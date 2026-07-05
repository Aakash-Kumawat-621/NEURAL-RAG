import { describe, it, expect } from "vitest";
import { signupSchema, pipelineStartSchema } from "@/lib/validation";

describe("Validation Schemas", () => {
  describe("signupSchema", () => {
    it("should validate correct signup data", () => {
      const data = { name: "Test", email: "test@example.com", password: "password123" };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail on invalid email", () => {
      const data = { name: "Test", email: "not-an-email", password: "password123" };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should fail on short password", () => {
      const data = { name: "Test", email: "test@example.com", password: "short" };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
      }
    });
  });

  describe("pipelineStartSchema", () => {
    it("should validate correct pipeline params", () => {
      const data = { 
        documentId: "doc-123", 
        query: "What is RAG?",
        params: { chunkSize: 500, chunkOverlap: 50, topK: 3 }
      };
      const result = pipelineStartSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow missing params (uses defaults)", () => {
      const data = { documentId: "doc-123", query: "What is RAG?" };
      const result = pipelineStartSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
