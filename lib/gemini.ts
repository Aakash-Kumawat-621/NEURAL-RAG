import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_CHAT_MODEL, GEMINI_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "./constants";

// ─── Chat Model ────────────────────────────────────────────────────────────────

const globalForGemini = globalThis as unknown as {
  geminiChat: ChatGoogleGenerativeAI | undefined;
  geminiNativeAI: GoogleGenerativeAI | undefined;
};

export function getChatModel(): ChatGoogleGenerativeAI {
  if (!globalForGemini.geminiChat) {
    globalForGemini.geminiChat = new ChatGoogleGenerativeAI({
      model: GEMINI_CHAT_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,        // Lower temperature for factual, grounded answers
      maxOutputTokens: 2048,
      streaming: true,         // Enable streaming for token-by-token output
    });
  }
  return globalForGemini.geminiChat;
}

// ─── Native Google AI Client ────────────────────────────────────────────────────

function getNativeClient(): GoogleGenerativeAI {
  if (!globalForGemini.geminiNativeAI) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY environment variable is not set");
    globalForGemini.geminiNativeAI = new GoogleGenerativeAI(apiKey);
  }
  return globalForGemini.geminiNativeAI;
}

// ─── Embedding Functions ────────────────────────────────────────────────────────
//
// We use the native @google/generative-ai SDK directly because the LangChain
// wrapper (GoogleGenerativeAIEmbeddings) does NOT correctly pass the
// outputDimensionality parameter to the API, resulting in 3072-dim vectors
// instead of the 768-dim vectors that our Pinecone index is configured for.

/**
 * Embed a single query string.
 * Returns a 768-dimensional vector.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const client = getNativeClient();
  const model = client.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: "user" },
    outputDimensionality: EMBEDDING_DIMENSIONS,
  } as any);
  return result.embedding.values;
}

/**
 * Embed multiple document chunks in batches of 100.
 * Returns an array of 768-dimensional vectors.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getNativeClient();
  const model = client.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });

  const BATCH_SIZE = 100;
  const allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { parts: [{ text }], role: "user" },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })) as any,
    });
    allVectors.push(...result.embeddings.map((e) => e.values));
  }

  return allVectors;
}
