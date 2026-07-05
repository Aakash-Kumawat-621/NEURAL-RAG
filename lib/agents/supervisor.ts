// Supervisor Agent — Deterministic Router (NO LLM CALLS)
//
// This is the traffic controller of the RAG pipeline.
// It examines the current state and routes to the appropriate next step.
// By being deterministic (if/else), it saves API quota entirely.

import { PIPELINE_STEPS } from "../constants";
import type { GraphState } from "./state";

/**
 * The supervisor agent checks the graph state and returns the name
 * of the next node to execute. It never calls an LLM.
 *
 * Routing logic:
 * 1. If there's an error → END
 * 2. If inspectionMode is true → return to frontend for HITL
 * 3. If rawText exists but no chunks → route to INGESTION
 * 4. If chunks exist + query exists but no retrievedContext → route to RETRIEVAL
 * 5. If retrievedContext exists but no answer → route to GENERATION
 * 6. Otherwise → END (pipeline complete)
 */
export function supervisorAgent(state: GraphState): Partial<GraphState> {
  // If there's an error, stop the pipeline
  if (state.error) {
    return {
      currentStep: "error",
      inspectionMode: false,
    };
  }

  // If in inspection mode, we've just completed a step
  // and the frontend is displaying results. Don't route further.
  if (state.inspectionMode) {
    return { currentStep: state.currentStep };
  }

  // Route based on what data is available in the state
  if (state.rawText && (!state.chunks || state.chunks.length === 0)) {
    // Document uploaded but not yet chunked/embedded
    return {
      currentStep: PIPELINE_STEPS.INGESTION,
      inspectionMode: false,
    };
  }

  if (
    state.chunks &&
    state.chunks.length > 0 &&
    state.query &&
    (!state.retrievedContext || state.retrievedContext.length === 0)
  ) {
    // Chunks exist and query submitted, but no retrieval done yet
    return {
      currentStep: PIPELINE_STEPS.RETRIEVAL,
      inspectionMode: false,
    };
  }

  if (
    state.retrievedContext &&
    state.retrievedContext.length > 0 &&
    !state.answer
  ) {
    // Context retrieved but no answer generated yet
    return {
      currentStep: PIPELINE_STEPS.GENERATION,
      inspectionMode: false,
    };
  }

  // Pipeline complete or no action needed
  return {
    currentStep: "complete",
    inspectionMode: false,
  };
}

/**
 * Routing function used by LangGraph's conditional edges.
 * Returns the name of the next node based on the supervisor's decision.
 */
export function routeFromSupervisor(state: GraphState): string {
  const step = state.currentStep;

  switch (step) {
    case PIPELINE_STEPS.INGESTION:
      return "ingestion";
    case PIPELINE_STEPS.RETRIEVAL:
      return "retrieval";
    case PIPELINE_STEPS.GENERATION:
      return "generation";
    case "error":
    case "complete":
    default:
      return "__end__";
  }
}
