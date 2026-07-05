import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, ValidationError, FileSizeError, FileTypeError } from "@/lib/errors";
import { consumeToken } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { getNamespace } from "@/lib/pinecone";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Rate limit
    if (!consumeToken(session.user.id)) {
      throw new RateLimitError();
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new ValidationError("No file provided");
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeError(MAX_FILE_SIZE_MB);
    }

    // Validate file type
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(extension as typeof SUPPORTED_EXTENSIONS[number])) {
      throw new FileTypeError(SUPPORTED_EXTENSIONS);
    }

    // Extract text based on file type
    let rawText: string;
    const buffer = Buffer.from(await file.arrayBuffer());

    switch (extension) {
      case ".pdf": {
        // Use require() to avoid Turbopack ESM interop issues with the CJS pdf-parse module
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParseLib = require("pdf-parse");
        const pdfFn: (buf: Buffer) => Promise<{ text: string }> =
          typeof pdfParseLib === "function" ? pdfParseLib :
          typeof pdfParseLib.default === "function" ? pdfParseLib.default :
          pdfParseLib;
        const pdfData = await pdfFn(buffer);
        rawText = pdfData.text;
        break;
      }
      case ".txt":
      case ".md": {
        rawText = buffer.toString("utf-8");
        break;
      }
      case ".docx": {
        // Dynamic import for mammoth (DOCX parser)
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
        break;
      }
      default:
        throw new FileTypeError(SUPPORTED_EXTENSIONS);
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new ValidationError("Could not extract any text from the uploaded file");
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        fileType: extension.replace(".", ""),
        rawText,
        pineconeNs: getNamespace(session.user.id, ""), // Will be updated after creation with actual ID
      },
    });

    // Update the pinecone namespace with the actual document ID
    const pineconeNs = getNamespace(session.user.id, document.id);
    await prisma.document.update({
      where: { id: document.id },
      data: { pineconeNs },
    });

    return Response.json(
      {
        documentId: document.id,
        filename: file.name,
        fileType: extension.replace(".", ""),
        textLength: rawText.length,
        pineconeNs,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
