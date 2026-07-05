// LangGraph RAG Pipeline — Graph Definition & Compilation
//
// This file wires together all agents into a LangGraph state graph:
// START → supervisor → {ingestion | retrieval | generation} → END
//
// The MemorySaver checkpointer is CRITICAL for HITL (Human-In-The-Loop):
// it persists graph state between pauses, allowing students to inspect
// intermediate results and resume the pipeline.

import { StateGraph, MemorySaver } from "@langchain/langgraph";
import { GraphAnnotation } from "./state";
import { supervisorAgent, routeFromSupervisor } from "./supervisor";
import { ingestionAgent } from "./ingestion";
import { retrievalAgent } from "./retrieval";
import { generationAgent } from "./generation";

// MemorySaver — persists graph state in memory for HITL resume
// In production, swap this for a persistent checkpointer (e.g., SqliteSaver)
const checkpointer = new MemorySaver();

// Build the state graph
const workflow = new StateGraph(GraphAnnotation)
  // Add all agent nodes
  .addNode("supervisor", supervisorAgent)
  .addNode("ingestion", ingestionAgent)
  .addNode("retrieval", retrievalAgent)
  .addNode("generation", generationAgent)

  // Entry point: always start at the supervisor
  .addEdge("__start__", "supervisor")

  // Supervisor routes to the appropriate agent based on state
  .addConditionalEdges("supervisor", routeFromSupervisor, {
    ingestion: "ingestion",
    retrieval: "retrieval",
    generation: "generation",
    __end__: "__end__",
  })

  // After each agent completes, the graph ends (HITL breakpoint)
  // The frontend will call /api/resume to continue
  .addEdge("ingestion", "__end__")
  .addEdge("retrieval", "__end__")
  .addEdge("generation", "__end__");

// Compile the graph with the checkpointer
export const ragGraph = workflow.compile({ checkpointer });

// Export checkpointer for use in API routes (to resume from saved state)
export { checkpointer };
