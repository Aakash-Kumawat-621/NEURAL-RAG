// Retrieval Agent — Query Embedding & Similarity Search
//
// This agent handles the second stage of the RAG pipeline:
// 1. Convert the user's query into an embedding vector
// 2. Perform cosine similarity search in Pinecone
// 3. Return the top-k most relevant chunks with scores

import { embedQuery } from "../gemini";
import { getPineconeIndex } from "../pinecone";
import { CODE_SNIPPETS, EMBEDDING_DIMENSIONS } from "../constants";
import type { GraphState, RetrievedChunk } from "./state";

export async function retrievalAgent(state: GraphState): Promise<Partial<GraphState>> {
  const startTime = Date.now();

  try {
    const { query, pineconeNamespace, params } = state;

    if (!query) {
      return { error: "No query provided for retrieval" };
    }

    if (!pineconeNamespace) {
      return { error: "No Pinecone namespace found. Please ingest a document first." };
    }

    // Step 1: Embed the user's query using the native Gemini SDK (outputDimensionality=768)
    const queryVector = await embedQuery(query);

    // Step 2: Cosine similarity search in Pinecone
    const index = getPineconeIndex();
    const ns = index.namespace(pineconeNamespace);

    const queryResult = await ns.query({
      vector: queryVector,
      topK: params.topK,
      includeMetadata: true,
    });

    // Step 3: Format the results
    const retrievedContext: RetrievedChunk[] = (queryResult.matches || []).map(
      (match) => ({
        text: (match.metadata?.text as string) || "",
        score: match.score || 0,
        chunkIndex: (match.metadata?.chunkIndex as number) || 0,
      })
    );

    const retrievalMs = Date.now() - startTime;

    // Generate code snippets for the "Code Behind" panel
    const codeSnippets: Record<string, string> = {
      ...state.codeSnippets,
      queryEmbed: CODE_SNIPPETS.queryEmbed
        .replace("{{QUERY}}", query.length > 50 ? query.slice(0, 50) + "..." : query)
        .replace("{{DIMENSIONS}}", String(EMBEDDING_DIMENSIONS)),
      similaritySearch: CODE_SNIPPETS.similaritySearch
        .replaceAll("{{TOP_K}}", String(params.topK)),
    };

    return {
      retrievedContext,
      currentStep: "retrieval",
      inspectionMode: true, // Pause for HITL inspection
      codeSnippets,
      metrics: {
        ...state.metrics,
        retrievalMs,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown retrieval error";
    console.error("Retrieval agent error:", message);
    return {
      error: `Retrieval failed: ${message}`,
      currentStep: "error",
      inspectionMode: false,
    };
  }
}
