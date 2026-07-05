import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ragGraph } from "@/lib/agents/graph";
import { pipelineStartSchema } from "@/lib/validation";
import { errorResponse, ValidationError } from "@/lib/errors";
import { consumeToken, getRemainingTokens } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, DEFAULT_TOP_K } from "@/lib/constants";
import { v4 as uuidv4 } from "crypto";

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

    const body = await request.json();

    // Validate input
    const parsed = pipelineStartSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { documentId, query, params } = parsed.data;

    // Fetch the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    });

    if (!document) {
      throw new ValidationError("Document not found");
    }

    // Set pipeline parameters (use defaults if not provided)
    const pipelineParams = {
      chunkSize: params?.chunkSize ?? DEFAULT_CHUNK_SIZE,
      chunkOverlap: params?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP,
      topK: params?.topK ?? DEFAULT_TOP_K,
    };

    // Generate a unique thread ID for this pipeline run
    const threadId = crypto.randomUUID();

    // Create pipeline run record
    const pipelineRun = await prisma.pipelineRun.create({
      data: {
        userId: session.user.id,
        documentId,
        threadId,
        query,
        params: JSON.stringify(pipelineParams),
        status: "running",
        currentStep: "ingestion",
      },
    });

    // Invoke the LangGraph pipeline
    const result = await ragGraph.invoke(
      {
        rawText: document.rawText,
        documentId: document.id,
        userId: session.user.id,
        pineconeNamespace: document.pineconeNs,
        query,
        params: pipelineParams,
        chunks: [],
        embeddingsPreview: [],
        retrievedContext: [],
        answer: "",
        currentStep: "",
        inspectionMode: false,
        codeSnippets: {},
        metrics: {},
        error: null,
      },
      {
        configurable: { thread_id: threadId },
      }
    );

    // Update pipeline run with results
    await prisma.pipelineRun.update({
      where: { id: pipelineRun.id },
      data: {
        status: result.error ? "failed" : (result.inspectionMode ? "running" : "completed"),
        currentStep: result.currentStep,
        metrics: JSON.stringify(result.metrics),
      },
    });

    // Update document chunk count if ingestion happened
    if (result.chunks && result.chunks.length > 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { chunkCount: result.chunks.length },
      });
    }

    return Response.json({
      threadId,
      pipelineRunId: pipelineRun.id,
      currentStep: result.currentStep,
      inspectionMode: result.inspectionMode,
      chunks: result.chunks,
      embeddingsPreview: result.embeddingsPreview,
      retrievedContext: result.retrievedContext,
      answer: result.answer,
      codeSnippets: result.codeSnippets,
      metrics: result.metrics,
      error: result.error,
      remainingQuota: getRemainingTokens(session.user.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
