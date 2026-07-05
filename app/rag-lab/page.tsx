"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// ─── Sub-components ────────────────────────────────────────────────

function PipelineStepper({ currentStep }: { currentStep: string }) {
  const steps = [
    { id: "ingestion",  label: "Chunking & Embedding", icon: "🧩" },
    { id: "retrieval",  label: "Vector Search",         icon: "🔍" },
    { id: "generation", label: "LLM Synthesis",         icon: "✨" },
  ];

  const stepIndex = {
    pending: -1, ingestion: 0, retrieval: 1, generation: 2, completed: 3, error: -1,
  }[currentStep] ?? -1;

  return (
    <div className="pipeline-stepper" role="list">
      {steps.map((step, i) => {
        const isActive    = stepIndex === i;
        const isCompleted = stepIndex > i;
        return (
          <div
            key={step.id}
            className={`step-item${isActive ? " active" : ""}${isCompleted ? " completed" : ""}`}
            role="listitem"
            style={{ flex: i < steps.length - 1 ? 1 : undefined }}
          >
            <div className="step-number">
              {isCompleted ? "✓" : step.icon}
            </div>
            <div>
              <div className="step-label">{step.label}</div>
              {isActive && (
                <div style={{ fontSize: "10px", color: "var(--cyan)", marginTop: 2 }}>
                  <span style={{ display: "inline-block", animation: "pulse-glow 1.5s ease infinite" }}>● Running</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ParameterControls({ params, onChange, disabled }: {
  params: { chunkSize: number; chunkOverlap: number; topK: number };
  onChange: (p: typeof params) => void;
  disabled: boolean;
}) {
  return (
    <div className="sidebar-card">
      <div className="sidebar-card-header">
        ⚙️ Parameters
      </div>
      <div className="sidebar-card-body">
        <div className="slider-group">
          {[
            { key: "chunkSize",    label: "Chunk Size",   min: 200,  max: 2000, step: 100,  unit: "chars" },
            { key: "chunkOverlap", label: "Overlap",      min: 0,    max: 500,  step: 50,   unit: "chars" },
            { key: "topK",         label: "Top-K",        min: 1,    max: 10,   step: 1,    unit: "chunks" },
          ].map((s) => (
            <div key={s.key} className="slider-item">
              <label>
                {s.label}
                <span>{params[s.key as keyof typeof params]} {s.unit}</span>
              </label>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key as keyof typeof params]}
                onChange={(e) => onChange({ ...params, [s.key]: Number(e.target.value) })}
                disabled={disabled}
                aria-label={s.label}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: 4 }}>
                <span>{s.min}</span>
                <span>{s.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChunkVisualizer({ chunks }: { chunks: string[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="result-section animate-in">
      <div className="result-section-header">
        <span className="result-section-title">
          🧩 Document Chunks
        </span>
        <span className="badge badge-cyan">{chunks.length} chunks</span>
      </div>
      <div className="result-section-body">
        <div className="chunk-grid">
          {chunks.slice(0, 12).map((chunk, i) => (
            <div
              key={i}
              className="chunk-card"
              onClick={() => setExpanded(expanded === i ? null : i)}
              title="Click to expand"
            >
              <div className="chunk-idx">#{i + 1}</div>
              {expanded === i ? chunk : chunk.slice(0, 120) + (chunk.length > 120 ? "…" : "")}
            </div>
          ))}
          {chunks.length > 12 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--fs-xs)", padding: "var(--space-3)" }}>
              + {chunks.length - 12} more chunks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmbeddingViewer({ embeddings }: { embeddings: number[][] }) {
  if (!embeddings.length) return null;
  return (
    <div className="result-section animate-in">
      <div className="result-section-header">
        <span className="result-section-title">
          🧠 Embedding Preview
        </span>
        <span className="badge badge-violet">768-dim · first 5 shown</span>
      </div>
      <div className="result-section-body">
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 400 }}>
            <thead>
              <tr>
                <th>Chunk</th>
                {[0,1,2,3,4].map((d) => <th key={d}>dim[{d}]</th>)}
                <th>…</th>
              </tr>
            </thead>
            <tbody>
              {embeddings.slice(0, 6).map((vec, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--cyan)" }}>#{i + 1}</td>
                  {vec.slice(0, 5).map((v, j) => (
                    <td key={j} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: v > 0 ? "var(--emerald)" : "var(--rose)" }}>
                      {v.toFixed(4)}
                    </td>
                  ))}
                  <td style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RetrievalPanel({ retrievedContext }: { retrievedContext: { text: string; score: number; chunkIndex: number }[] }) {
  return (
    <div className="result-section animate-in">
      <div className="result-section-header">
        <span className="result-section-title">
          🔍 Retrieved Chunks
        </span>
        <span className="badge badge-emerald">{retrievedContext.length} results</span>
      </div>
      <div className="result-section-body">
        {retrievedContext.map((chunk, i) => (
          <div key={i} className="retrieval-item">
            <div className="retrieval-score">
              ◉ {(chunk.score * 100).toFixed(1)}% match · chunk #{chunk.chunkIndex + 1}
            </div>
            <div className="retrieval-text">{chunk.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerationPanel({ answer }: { answer: string }) {
  return (
    <div className="result-section animate-in">
      <div className="result-section-header">
        <span className="result-section-title">
          ✨ Generated Answer
        </span>
        <span className="badge badge-emerald">Complete</span>
      </div>
      <div className="result-section-body">
        <div className="answer-panel">{answer}</div>
      </div>
    </div>
  );
}

function MetricsDashboard({ metrics }: { metrics: Record<string, number> }) {
  if (!Object.keys(metrics).length) return null;

  const totalMs = (metrics.chunkingMs || 0) + (metrics.embeddingMs || 0) +
                  (metrics.retrievalMs || 0) + (metrics.generationMs || 0);
  const costEst = ((metrics.totalTokens || 0) / 1_000_000 * 0.075).toFixed(6);

  const items = [
    { label: "Chunking", val: metrics.chunkingMs ? `${metrics.chunkingMs}ms` : "—" },
    { label: "Embedding", val: metrics.embeddingMs ? `${metrics.embeddingMs}ms` : "—" },
    { label: "Retrieval", val: metrics.retrievalMs ? `${metrics.retrievalMs}ms` : "—" },
    { label: "Generation", val: metrics.generationMs ? `${metrics.generationMs}ms` : "—" },
    { label: "Total Time", val: totalMs ? `${totalMs}ms` : "—" },
    { label: "Tokens", val: metrics.totalTokens ?? "—" },
    { label: "Chunks", val: metrics.chunkCount ?? "—" },
    { label: "Est. Cost", val: `$${costEst}` },
  ];

  return (
    <div className="sidebar-card">
      <div className="sidebar-card-header">📊 Metrics</div>
      <div className="sidebar-card-body">
        <div className="metrics-grid">
          {items.map((item) => (
            <div key={item.label} className="metric-item">
              <div className="metric-value">{item.val}</div>
              <div className="metric-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeBehindPanel({ snippets }: { snippets: Record<string, string> }) {
  if (!Object.keys(snippets).length) return null;
  return (
    <div className="sidebar-card">
      <div className="sidebar-card-header">💻 Code Behind</div>
      <div className="sidebar-card-body" style={{ padding: 0 }}>
        {Object.entries(snippets).map(([key, code]) => (
          <details key={key}>
            <summary>{key.replace(/([A-Z])/g, " $1").trim()}</summary>
            <pre className="code-block" style={{ margin: "0 var(--space-4) var(--space-4)", borderRadius: "var(--radius)" }}>
              {code}
            </pre>
          </details>
        ))}
      </div>
    </div>
  );
}

// ─── Main RAG Lab Component ────────────────────────────────────────

function RagLabContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");

  const [document, setDocument] = useState<{ id: string; filename: string } | null>(null);
  const [query, setQuery] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("pending");
  const [inspectionMode, setInspectionMode] = useState(false);

  const [params, setParams] = useState({ chunkSize: 1000, chunkOverlap: 200, topK: 4 });
  const [chunks, setChunks] = useState<string[]>([]);
  const [embeddingsPreview, setEmbeddingsPreview] = useState<number[][]>([]);
  const [retrievedContext, setRetrievedContext] = useState<{ text: string; score: number; chunkIndex: number }[]>([]);
  const [answer, setAnswer] = useState("");
  const [codeSnippets, setCodeSnippets] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && docId) {
      fetch("/api/documents")
        .then((r) => r.json())
        .then((data) => {
          const doc = data.documents?.find((d: { id: string }) => d.id === docId);
          if (doc) setDocument(doc);
          else { toast.error("Document not found"); router.push("/dashboard"); }
        });
    } else if (status === "authenticated" && !docId) {
      router.push("/dashboard");
    }
  }, [status, docId, router]);

  const updateFromResponse = (data: {
    threadId?: string; currentStep?: string; inspectionMode?: boolean;
    chunks?: string[]; embeddingsPreview?: number[][]; retrievedContext?: { text: string; score: number; chunkIndex: number }[];
    answer?: string; codeSnippets?: Record<string, string>; metrics?: Record<string, number>; error?: string | null;
  }) => {
    if (data.threadId)       setThreadId(data.threadId);
    if (data.currentStep)    setCurrentStep(data.currentStep);
    if (data.inspectionMode !== undefined) setInspectionMode(data.inspectionMode);
    if (data.chunks?.length) setChunks(data.chunks);
    if (data.embeddingsPreview?.length) setEmbeddingsPreview(data.embeddingsPreview);
    if (data.retrievedContext?.length)  setRetrievedContext(data.retrievedContext);
    if (data.answer)         setAnswer(data.answer);
    if (data.codeSnippets)   setCodeSnippets(data.codeSnippets);
    if (data.metrics)        setMetrics(data.metrics as Record<string, number>);
    setIsRunning(false);

    if (data.currentStep === "completed") toast.success("🎉 Pipeline complete!");
    else if (data.error)                  toast.error(data.error);
    else if (data.inspectionMode)         toast("⏸️ Inspection pause — review and continue", { duration: 3000 });
  };

  const handleStart = async () => {
    if (!query.trim()) { toast.error("Enter a question first"); return; }
    setIsRunning(true);
    setCurrentStep("pending");
    setChunks([]); setEmbeddingsPreview([]); setRetrievedContext([]); setAnswer(""); setCodeSnippets({}); setMetrics({});
    try {
      const res = await fetch("/api/rag-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, query, params }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Pipeline failed"); setIsRunning(false); return; }
      updateFromResponse(data);
    } catch { toast.error("Pipeline error"); setIsRunning(false); }
  };

  const handleResume = async () => {
    if (!threadId) return;
    setIsRunning(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, documentId: docId, params }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Resume failed"); setIsRunning(false); return; }
      updateFromResponse(data);
    } catch { toast.error("Resume error"); setIsRunning(false); }
  };

  if (!session || !document) {
    return (
      <main id="main-content" className="page container">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-card" style={{ height: 400 }} />
      </main>
    );
  }

  return (
    <main id="main-content" className="page container animate-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
          <a
            href="/dashboard"
            style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", color: "var(--text-muted)", fontSize: "var(--fs-sm)", fontWeight: 500, textDecoration: "none" }}
          >
            ← Dashboard
          </a>
          <span style={{ color: "var(--border)", fontSize: "var(--fs-sm)" }}>/</span>
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}>RAG Lab</span>
        </div>
        <h1 style={{ fontSize: "var(--fs-3xl)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "var(--space-2)" }}>
          RAG Lab
        </h1>
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span>📄</span>
          <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{document.filename}</span>
        </div>
      </div>

      {/* Pipeline Stepper */}
      <PipelineStepper currentStep={currentStep} />

      <div className="rag-lab" style={{ marginTop: "var(--space-5)" }}>
        {/* Main column */}
        <div className="rag-lab-main">
          {/* Query input */}
          <div className="query-box">
            <textarea
              placeholder="Ask a question about this document… e.g. 'What are the main findings?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isRunning || (inspectionMode && currentStep !== "pending")}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !isRunning) { e.preventDefault(); handleStart(); } }}
              rows={2}
              aria-label="Enter your question"
            />
            {(currentStep === "pending" || currentStep === "completed") && (
              <button
                className="btn btn-primary"
                onClick={handleStart}
                disabled={isRunning || !query.trim()}
                id="run-pipeline"
                style={{ flexShrink: 0 }}
              >
                {isRunning ? <div className="spinner" /> : "Run Pipeline"}
              </button>
            )}
          </div>

          {/* Results */}
          {chunks.length > 0 && <ChunkVisualizer chunks={chunks} />}
          {embeddingsPreview.length > 0 && <EmbeddingViewer embeddings={embeddingsPreview} />}
          {retrievedContext.length > 0 && <RetrievalPanel retrievedContext={retrievedContext} />}
          {answer && (currentStep === "generation" || currentStep === "completed") && (
            <GenerationPanel answer={answer} />
          )}

          {/* HITL resume */}
          {inspectionMode && !isRunning && (
            <div className="hitl-banner animate-in">
              <h3>⏸ Pipeline Paused</h3>
              <p>
                Review the results above. You can adjust parameters in the sidebar before proceeding to the next step.
              </p>
              <button
                className="btn btn-primary btn-lg pulse-glow"
                onClick={handleResume}
                disabled={isRunning}
                aria-label="Continue pipeline to next step"
                id="resume-pipeline"
              >
                {isRunning ? <div className="spinner" /> : "Continue to Next Step →"}
              </button>
            </div>
          )}

          {/* Running indicator */}
          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", padding: "var(--space-8)", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
              <div className="spinner" />
              <span>
                {currentStep === "pending" ? "Initializing pipeline…" :
                 currentStep === "ingestion" ? "Chunking & embedding…" :
                 currentStep === "retrieval" ? "Searching vectors…" :
                 currentStep === "generation" ? "Generating answer…" : "Running…"}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="rag-lab-sidebar">
          <ParameterControls
            params={params}
            onChange={setParams}
            disabled={isRunning || (chunks.length > 0 && currentStep !== "ingestion" && currentStep !== "pending")}
          />
          <MetricsDashboard metrics={metrics} />
          <CodeBehindPanel snippets={codeSnippets} />
        </div>
      </div>
    </main>
  );
}

export default function RagLab() {
  return (
    <Suspense fallback={
      <main id="main-content" className="page container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "var(--space-4)" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span style={{ color: "var(--text-muted)" }}>Loading RAG Lab…</span>
        </div>
      </main>
    }>
      <RagLabContent />
    </Suspense>
  );
}
