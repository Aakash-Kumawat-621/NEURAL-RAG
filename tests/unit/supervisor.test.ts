import { describe, it, expect } from "vitest";
import { supervisorAgent, routeFromSupervisor } from "@/lib/agents/supervisor";
import { PIPELINE_STEPS } from "@/lib/constants";

describe("Supervisor Routing", () => {
  it("should return error step if state has an error", () => {
    const state = { error: "Something went wrong" } as any;
    const result = supervisorAgent(state);
    expect(result.currentStep).toBe("error");
    expect(result.inspectionMode).toBe(false);
  });

  it("should stay on currentStep if inspectionMode is true", () => {
    const state = { inspectionMode: true, currentStep: "ingestion" } as any;
    const result = supervisorAgent(state);
    expect(result.currentStep).toBe("ingestion");
    expect(result.inspectionMode).toBeUndefined(); // Returns partial without it if just returning currentStep
  });

  it("should route to ingestion if rawText exists but no chunks", () => {
    const state = { rawText: "Some text", chunks: [] } as any;
    const result = supervisorAgent(state);
    expect(result.currentStep).toBe(PIPELINE_STEPS.INGESTION);
    expect(result.inspectionMode).toBe(false);
  });

  it("should route to retrieval if chunks and query exist but no retrieved context", () => {
    const state = { rawText: "Some text", chunks: ["chunk1"], query: "test", retrievedContext: [] } as any;
    const result = supervisorAgent(state);
    expect(result.currentStep).toBe(PIPELINE_STEPS.RETRIEVAL);
    expect(result.inspectionMode).toBe(false);
  });

  it("should route to generation if retrieved context exists but no answer", () => {
    const state = { retrievedContext: [{ text: "context" }], answer: "" } as any;
    const result = supervisorAgent(state);
    expect(result.currentStep).toBe(PIPELINE_STEPS.GENERATION);
    expect(result.inspectionMode).toBe(false);
  });

  it("should mark as complete if all conditions are met", () => {
    const state = { retrievedContext: [{ text: "context" }], answer: "Answer here" } as any;
    const result = supervisorAgent(state);
    expect(result.currentStep).toBe("complete");
    expect(result.inspectionMode).toBe(false);
  });
});

describe("Supervisor Edges Routing", () => {
  it("should return ingestion for ingestion step", () => {
    expect(routeFromSupervisor({ currentStep: PIPELINE_STEPS.INGESTION } as any)).toBe("ingestion");
  });
  
  it("should return __end__ for error step", () => {
    expect(routeFromSupervisor({ currentStep: "error" } as any)).toBe("__end__");
  });
});
