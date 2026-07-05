import { z } from "zod";
import { SUPPORTED_EXTENSIONS } from "./constants";

// Schema for file upload validation
export const uploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  fileType: z
    .string()
    .refine(
      (val) => SUPPORTED_EXTENSIONS.some((ext) => val.toLowerCase().endsWith(ext)),
      `Supported file types: ${SUPPORTED_EXTENSIONS.join(", ")}`
    ),
});

// Schema for starting the RAG pipeline
export const pipelineStartSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  query: z.string().min(1, "Query is required").max(2000, "Query must be under 2000 characters"),
  params: z
    .object({
      chunkSize: z.number().int().min(100).max(4000).optional(),
      chunkOverlap: z.number().int().min(0).max(1000).optional(),
      topK: z.number().int().min(1).max(20).optional(),
    })
    .optional(),
});

// Schema for resuming the pipeline after HITL inspection
export const pipelineResumeSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  documentId: z.string().min(1, "Document ID is required"),
  params: z
    .object({
      chunkSize: z.number().int().min(100).max(4000).optional(),
      chunkOverlap: z.number().int().min(0).max(1000).optional(),
      topK: z.number().int().min(1).max(20).optional(),
    })
    .optional(),
});

// Schema for signup
export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

// Schema for login
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Type exports for use in API routes and components
export type UploadInput = z.infer<typeof uploadSchema>;
export type PipelineStartInput = z.infer<typeof pipelineStartSchema>;
export type PipelineResumeInput = z.infer<typeof pipelineResumeSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
