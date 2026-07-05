import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const runs = await prisma.pipelineRun.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        document: {
          select: { filename: true, fileType: true },
        },
      },
    });

    const formatted = runs.map((run: any) => ({
      id: run.id,
      threadId: run.threadId,
      query: run.query,
      status: run.status,
      currentStep: run.currentStep,
      documentId: run.documentId,
      documentFilename: run.document?.filename ?? "Unknown",
      documentFileType: run.document?.fileType ?? "",
      params: run.params ? JSON.parse(run.params) : null,
      metrics: run.metrics ? JSON.parse(run.metrics) : null,
      answer: run.answer,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
    }));

    return Response.json({ runs: formatted });
  } catch (error) {
    return errorResponse(error);
  }
}
