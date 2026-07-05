// Application-wide constants and default configuration
// These values are used as defaults throughout the RAG pipeline
// and can be overridden per-run via the UI parameter controls.

export const DEFAULT_CHUNK_SIZE = parseInt(process.env.DEFAULT_CHUNK_SIZE || "1000", 10);
export const DEFAULT_CHUNK_OVERLAP = parseInt(process.env.DEFAULT_CHUNK_OVERLAP || "200", 10);
export const DEFAULT_TOP_K = parseInt(process.env.DEFAULT_TOP_K || "4", 10);
export const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Pinecone configuration
export const PINECONE_INDEX = process.env.PINECONE_INDEX || "rag-education";
export const PINECONE_NAMESPACE_PREFIX = "user";

// Supported file types
export const SUPPORTED_FILE_TYPES = ["application/pdf", "text/plain", "text/markdown", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
export const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".md", ".docx"] as const;

// Gemini model configuration
export const GEMINI_CHAT_MODEL = "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
export const EMBEDDING_DIMENSIONS = 768;

// Pipeline step names (used for routing and UI display)
export const PIPELINE_STEPS = {
  INGESTION: "ingestion",
  RETRIEVAL: "retrieval",
  GENERATION: "generation",
  INSPECTION: "inspection",
} as const;

// Code snippets shown in the "Code Behind" educational panel
export const CODE_SNIPPETS = {
  chunking: `// Text Splitting with RecursiveCharacterTextSplitter
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: {{CHUNK_SIZE}},      // Max characters per chunk
  chunkOverlap: {{CHUNK_OVERLAP}}, // Overlap between chunks
  separators: ["\\n\\n", "\\n", ". ", " ", ""],
});

const chunks = await splitter.splitText(documentText);
// Result: {{CHUNK_COUNT}} chunks created`,

  embedding: `// Batch Embedding with Gemini
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",  // configured with outputDimensionality: 768
});

// Batch embed ALL chunks in one API call (saves quota!)
const vectors = await embeddings.embedDocuments(chunks);
// Result: {{CHUNK_COUNT}} vectors of {{DIMENSIONS}} dimensions each`,

  upsert: `// Storing in Pinecone Vector DB
import { Pinecone } from "@pinecone-database/pinecone";

const index = pinecone.index("rag-education");
const namespace = index.namespace("{{NAMESPACE}}");

await namespace.upsert(
  vectors.map((vector, i) => ({
    id: \`chunk-\${i}\`,
    values: vector,
    metadata: { text: chunks[i], chunkIndex: i },
  }))
);`,

  queryEmbed: `// Embedding the User Query
// Use the SAME embedding model to convert the query
// into the same vector space as the document chunks

const queryVector = await embeddings.embedQuery("{{QUERY}}");
// Result: 1 vector of {{DIMENSIONS}} dimensions`,

  similaritySearch: `// Cosine Similarity Search in Pinecone
const results = await namespace.query({
  vector: queryVector,
  topK: {{TOP_K}},            // Return top {{TOP_K}} most similar chunks
  includeMetadata: true,       // Include the original text
});

// Pinecone returns chunks ranked by cosine similarity score (0-1)
// Score closer to 1 = more semantically similar to your query`,

  generation: `// Answer Generation with Gemini 2.5 Flash
const prompt = \`You are a helpful assistant. Answer the question
based ONLY on the following context. If the context doesn't
contain enough information, say so.

Context:
{{CONTEXT}}

Question: {{QUERY}}

Answer:\`;

// Single LLM call — no iterative refinement (saves API quota!)
const response = await model.invoke(prompt);`,
} as const;
