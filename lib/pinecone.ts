import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_INDEX, PINECONE_NAMESPACE_PREFIX } from "./constants";

// Pinecone client singleton
const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined;
};

function createPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is not set");
  }
  return new Pinecone({ apiKey });
}

export function getPineconeClient(): Pinecone {
  if (!globalForPinecone.pinecone) {
    globalForPinecone.pinecone = createPineconeClient();
  }
  return globalForPinecone.pinecone;
}

// Get the Pinecone index reference
export function getPineconeIndex() {
  const client = getPineconeClient();
  return client.index(PINECONE_INDEX);
}

/**
 * Generate a user-scoped namespace for Pinecone.
 * Each user+document combination gets its own namespace
 * to prevent cross-contamination of embeddings.
 *
 * Format: "user_<userId>_doc_<documentId>"
 */
export function getNamespace(userId: string, documentId: string): string {
  return `${PINECONE_NAMESPACE_PREFIX}_${userId}_doc_${documentId}`;
}

/**
 * Delete all vectors in a namespace (used when deleting a document).
 */
export async function deleteNamespace(userId: string, documentId: string): Promise<void> {
  const index = getPineconeIndex();
  const namespace = getNamespace(userId, documentId);
  await index.namespace(namespace).deleteAll();
}
