import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ragGraph } from "@/lib/agents/graph";
import { pipelineResumeSchema } from "@/lib/validation";
import { errorResponse, ValidationError } from "@/lib/errors";
import { consumeToken, getRemainingTokens } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, DEFAULT_TOP_K } from "@/lib/constants";

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
    const parsed = pipelineResumeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const { threadId, documentId, params } = parsed.data;

    // Find the existing pipeline run
    const pipelineRun = await prisma.pipelineRun.findFirst({
      where: {
        threadId,
        userId: session.user.id,
      },
    });

    if (!pipelineRun) {
      throw new ValidationError("Pipeline run not found");
    }

    // Get the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    });

    if (!document) {
      throw new ValidationError("Document not found");
    }

    // Merge params with defaults
    const existingParams = JSON.parse(pipelineRun.params);
    const pipelineParams = {
      chunkSize: params?.chunkSize ?? existingParams.chunkSize ?? DEFAULT_CHUNK_SIZE,
      chunkOverlap: params?.chunkOverlap ?? existingParams.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP,
      topK: params?.topK ?? existingParams.topK ?? DEFAULT_TOP_K,
    };

    // Resume the graph from the last checkpoint
    // Setting inspectionMode to false tells the supervisor to continue routing
    const result = await ragGraph.invoke(
      {
        inspectionMode: false,
        params: pipelineParams,
      },
      {
        configurable: { thread_id: threadId },
      }
    );

    // Update pipeline run
    const updateData: Record<string, unknown> = {
      status: result.error ? "failed" : (result.inspectionMode ? "running" : "completed"),
      currentStep: result.currentStep,
      params: JSON.stringify(pipelineParams),
      metrics: JSON.stringify(result.metrics),
    };

    if (result.retrievedContext && result.retrievedContext.length > 0) {
      updateData.retrievedChunks = JSON.stringify(result.retrievedContext);
    }

    if (result.answer) {
      updateData.answer = result.answer;
      updateData.completedAt = new Date();
      updateData.status = "completed";
    }

    await prisma.pipelineRun.update({
      where: { id: pipelineRun.id },
      data: updateData,
    });

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
