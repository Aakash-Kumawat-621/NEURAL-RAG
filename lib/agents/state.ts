// LangGraph State Definition
// This is the shared state schema that flows through the entire RAG pipeline.
// Each node (agent) reads from and writes to this state.

import { Annotation } from "@langchain/langgraph";

// Types for pipeline parameters and metrics
export interface PipelineParams {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export interface RetrievedChunk {
  text: string;
  score: number;
  chunkIndex: number;
}

export interface StepMetrics {
  chunkingMs?: number;
  embeddingMs?: number;
  retrievalMs?: number;
  generationMs?: number;
  totalTokens?: number;
  chunkCount?: number;
  embeddingDimensions?: number;
}

// The main graph state annotation
// LangGraph uses this to track data as it flows through nodes
export const GraphAnnotation = Annotation.Root({
  // Document data
  rawText: Annotation<string>,
  documentId: Annotation<string>,
  userId: Annotation<string>,
  pineconeNamespace: Annotation<string>,

  // Chunking output
  chunks: Annotation<string[]>,

  // Embedding preview (first 5 dimensions per chunk for UI display)
  embeddingsPreview: Annotation<number[][]>,

  // Query and retrieval
  query: Annotation<string>,
  retrievedContext: Annotation<RetrievedChunk[]>,

  // Generation output
  answer: Annotation<string>,

  // Pipeline control
  params: Annotation<PipelineParams>,
  currentStep: Annotation<string>,
  inspectionMode: Annotation<boolean>,

  // Educational: code snippets shown in the "Code Behind" panel
  codeSnippets: Annotation<Record<string, string>>,

  // Performance metrics
  metrics: Annotation<StepMetrics>,

  // Error tracking
  error: Annotation<string | null>,
});

// Infer the state type for use in agent functions
export type GraphState = typeof GraphAnnotation.State;
