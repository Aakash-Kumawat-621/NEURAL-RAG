import { describe, it, expect } from "vitest";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

describe("Text Chunking", () => {
  it("should split text correctly according to chunk size and overlap", async () => {
    const text = "This is a test document. It contains multiple sentences. We want to test if the LangChain recursive character text splitter works correctly. It should split by punctuation first.";
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 50,
      chunkOverlap: 10,
      separators: [". ", " ", ""],
    });

    const chunks = await splitter.splitText(text);
    
    // Total text length is ~180 chars. At 50 chars each, expect ~4-5 chunks.
    expect(chunks.length).toBeGreaterThan(1);
    
    // Each chunk should be <= 50 characters (plus occasionally some leeway depending on splits)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(50);
    }
    
    // Ensure no data was lost
    const joined = chunks.join(" ");
    expect(joined).toContain("This is a test");
    expect(joined).toContain("split by punctuation");
  });
});
