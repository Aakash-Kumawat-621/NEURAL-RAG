// Generation Agent — Answer Synthesis
//
// This agent handles the final stage of the RAG pipeline:
// 1. Construct a dynamic prompt with the retrieved context + user query
// 2. Make a SINGLE Gemini 2.5 Flash call to generate the answer
// 3. Return the grounded answer

import { getChatModel } from "../gemini";
import { CODE_SNIPPETS } from "../constants";
import type { GraphState } from "./state";

export async function generationAgent(state: GraphState): Promise<Partial<GraphState>> {
  const startTime = Date.now();

  try {
    const { query, retrievedContext } = state;

    if (!query) {
      return { error: "No query provided for generation" };
    }

    if (!retrievedContext || retrievedContext.length === 0) {
      return { error: "No context retrieved. Please run retrieval first." };
    }

    // Build the context string from retrieved chunks
    const contextStr = retrievedContext
      .map(
        (chunk, i) =>
          `[Source ${i + 1}] (Similarity: ${(chunk.score * 100).toFixed(1)}%)\n${chunk.text}`
      )
      .join("\n\n---\n\n");

    // Construct the generation prompt
    const prompt = `You are a helpful, educational assistant. Answer the student's question based ONLY on the following retrieved context. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing.

When referencing information, cite the source number (e.g., [Source 1]).

Context:
${contextStr}

Student's Question: ${query}

Answer:`;

    // Single LLM call — no iterative refinement (saves API quota!)
    const model = getChatModel();
    const response = await model.invoke(prompt);
    const answer = typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

    const generationMs = Date.now() - startTime;

    // Estimate token count (rough: ~4 chars per token)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(answer.length / 4);
    const totalTokens = inputTokens + outputTokens;

    // Generate code snippet for the "Code Behind" panel
    const contextPreview = contextStr.length > 200
      ? contextStr.slice(0, 200) + "..."
      : contextStr;
    const codeSnippets: Record<string, string> = {
      ...state.codeSnippets,
      generation: CODE_SNIPPETS.generation
        .replace("{{CONTEXT}}", contextPreview)
        .replace("{{QUERY}}", query),
    };

    return {
      answer,
      currentStep: "generation",
      inspectionMode: true, // Pause for final inspection
      codeSnippets,
      metrics: {
        ...state.metrics,
        generationMs,
        totalTokens,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown generation error";
    console.error("Generation agent error:", message);
    return {
      error: `Generation failed: ${message}`,
      currentStep: "error",
      inspectionMode: false,
    };
  }
}
