import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteNamespace } from "@/lib/pinecone";
import { errorResponse, ValidationError } from "@/lib/errors";

// GET — List all documents for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        filename: true,
        fileType: true,
        chunkCount: true,
        createdAt: true,
        _count: {
          select: { pipelineRuns: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ documents });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE — Delete a specific document and its Pinecone namespace
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      throw new ValidationError("Document ID is required");
    }

    // Verify document belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    });

    if (!document) {
      throw new ValidationError("Document not found");
    }

    // Delete vectors from Pinecone namespace
    try {
      await deleteNamespace(session.user.id, documentId);
    } catch (err) {
      console.warn("Failed to delete Pinecone namespace (may not exist):", err);
    }

    // Delete document from database (cascades to PipelineRuns)
    await prisma.document.delete({
      where: { id: documentId },
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
