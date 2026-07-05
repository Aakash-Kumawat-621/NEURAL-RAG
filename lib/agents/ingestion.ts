// Ingestion Agent — Document Chunking, Embedding & Storage
//
// This agent handles the first stage of the RAG pipeline:
// 1. Split the raw document text into semantic chunks
// 2. Batch-embed all chunks using Gemini text-embedding-004
// 3. Upsert the vectors + metadata into Pinecone

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedDocuments } from "../gemini";
import { getPineconeIndex, getNamespace } from "../pinecone";
import { CODE_SNIPPETS, EMBEDDING_DIMENSIONS } from "../constants";
import type { GraphState } from "./state";

export async function ingestionAgent(state: GraphState): Promise<Partial<GraphState>> {
  const startTime = Date.now();

  try {
    const { rawText, params, userId, documentId } = state;

    if (!rawText) {
      return { error: "No document text provided for ingestion" };
    }

    // Step 1: Chunk the document
    const chunkStartTime = Date.now();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: params.chunkSize,
      chunkOverlap: params.chunkOverlap,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });

    const chunks = await splitter.splitText(rawText);
    const chunkingMs = Date.now() - chunkStartTime;

    if (chunks.length === 0) {
      return {
        error: "Ingestion failed: The document produced 0 chunks. The file may be empty, image-only (scanned PDF), or corrupted. Please delete it and re-upload a text-based document.",
        currentStep: "error",
        inspectionMode: false,
      };
    }

    // Step 2: Batch embed all chunks using native Gemini SDK with outputDimensionality=768
    const embedStartTime = Date.now();
    const vectors = await embedDocuments(chunks);
    const embeddingMs = Date.now() - embedStartTime;

    if (vectors.length === 0 || vectors.some((v) => v.length === 0)) {
      return {
        error: "Ingestion failed: Embedding API returned empty vectors. This usually means the Gemini API call failed (e.g. invalid API key, rate limits, or network error). Please check your environment variables and try again.",
        currentStep: "error",
        inspectionMode: false,
      };
    }

    // Step 3: Upsert into Pinecone with user-scoped namespace
    const namespace = getNamespace(userId, documentId);
    const index = getPineconeIndex();
    const ns = index.namespace(namespace);

    console.log("[INGESTION] Chunks count:", chunks.length);
    console.log("[INGESTION] Vectors count:", vectors.length);
    if (vectors.length > 0) {
      console.log("[INGESTION] First vector length:", vectors[0].length);
    }

    // Batch upsert in groups of 100 (Pinecone limit)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize).map((vector, j) => ({
        id: `chunk-${i + j}`,
        values: vector,
        metadata: {
          text: chunks[i + j],
          chunkIndex: i + j,
          documentId,
        },
      }));
      console.log(`[INGESTION] Batch ${i / batchSize + 1} size:`, batch.length);
      if (batch.length > 0) {
        console.log(`[INGESTION] Batch 1 first element metadata keys:`, Object.keys(batch[0].metadata));
        console.log(`[INGESTION] Batch 1 first element values length:`, batch[0].values.length);
      }
      await ns.upsert({ records: batch });
    }

    // Create embedding preview (first 5 dimensions per chunk for UI display)
    const embeddingsPreview = vectors.map((v) => v.slice(0, 5));

    // Generate code snippets for the "Code Behind" panel
    const codeSnippets: Record<string, string> = {
      chunking: CODE_SNIPPETS.chunking
        .replace("{{CHUNK_SIZE}}", String(params.chunkSize))
        .replace("{{CHUNK_OVERLAP}}", String(params.chunkOverlap))
        .replace("{{CHUNK_COUNT}}", String(chunks.length)),
      embedding: CODE_SNIPPETS.embedding
        .replace("{{CHUNK_COUNT}}", String(chunks.length))
        .replace("{{DIMENSIONS}}", String(EMBEDDING_DIMENSIONS)),
      upsert: CODE_SNIPPETS.upsert
        .replace("{{NAMESPACE}}", namespace),
    };

    return {
      chunks,
      embeddingsPreview,
      pineconeNamespace: namespace,
      currentStep: "ingestion",
      inspectionMode: true, // Pause for HITL inspection
      codeSnippets,
      metrics: {
        ...state.metrics,
        chunkingMs,
        embeddingMs,
        chunkCount: chunks.length,
        embeddingDimensions: EMBEDDING_DIMENSIONS,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ingestion error";
    console.error("Ingestion agent error:", message);
    return {
      error: `Ingestion failed: ${message}`,
      currentStep: "error",
      inspectionMode: false,
    };
  }
}
