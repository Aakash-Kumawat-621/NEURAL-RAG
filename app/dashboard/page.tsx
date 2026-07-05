"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  fileType: string;
  chunkCount: number;
  createdAt: string;
  pineconeNs: string;
}

interface PipelineRun {
  id: string;
  query: string;
  params: string;
  answer: string | null;
  metrics: string | null;
  status: string;
  currentStep: string;
  createdAt: string;
  completedAt: string | null;
  document?: { filename: string };
}

const FILE_ICONS: Record<string, string> = {
  pdf: "PDF", txt: "TXT", md: "MD", docx: "DOC",
};

const FILE_ICON_CLASS: Record<string, string> = {
  pdf: "doc-icon-pdf", txt: "doc-icon-txt", md: "doc-icon-md", docx: "doc-icon-docx",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [documents, setDocuments]   = useState<Document[]>([]);
  const [runs, setRuns]             = useState<PipelineRun[]>([]);
  const [isLoadingDocs, setLoadingDocs] = useState(true);
  const [activeTab, setActiveTab]   = useState<"docs" | "runs">("docs");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Fetch data
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDocuments();
    fetchRuns();
  }, [status]);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  }

  async function fetchRuns() {
    try {
      const res = await fetch("/api/pipeline-runs");
      if (!res.ok) return;
      const data = await res.json();
      setRuns(data.runs || []);
    } catch { /* silent */ }
  }

  async function handleUpload(file: File) {
    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() =>
      setUploadProgress((p) => Math.min(p + 8, 85)), 300);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Upload failed");
        return;
      }

      toast.success(`"${file.name}" uploaded!`);
      await fetchDocuments();
    } catch {
      toast.error("Upload failed");
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 600);
    }
  }

  async function handleDelete(id: string, filename: string) {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Delete failed"); return; }
      toast.success("Document deleted");
      setDocuments((d) => d.filter((doc) => doc.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const totalChunks = documents.reduce((s, d) => s + (d.chunkCount || 0), 0);
  const completedRuns = runs.filter((r) => r.status === "completed").length;

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (status === "loading") {
    return (
      <main id="main-content" className="page container">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-card" />
      </main>
    );
  }

  return (
    <main id="main-content" className="page container">
      {/* Header */}
      <div className="dashboard-header animate-in">
        <div className="dashboard-greeting">
          <span style={{ fontSize: "0.9em" }}>👋</span>
          Welcome back
        </div>
        <h1 className="dashboard-title">{firstName}</h1>
        <p className="dashboard-subtitle">
          Your AI research workspace · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: "📄", label: "Documents", value: documents.length, color: "var(--cyan)", class: "delay-1" },
          { icon: "🧩", label: "Total Chunks", value: totalChunks, color: "var(--violet)", class: "delay-2" },
          { icon: "⚡", label: "Pipeline Runs", value: runs.length, color: "#10b981", class: "delay-3" },
          { icon: "✅", label: "Completed", value: completedRuns, color: "var(--amber)", class: "delay-4" },
        ].map((stat) => (
          <div key={stat.label} className={`glass-card stat-card animate-in ${stat.class}`}>
            <div className="stat-icon" style={{ background: `${stat.color}18` }}>
              {stat.icon}
            </div>
            <div className="stat-value" style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}99)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Content */}
      <div className="animate-in delay-3">
        <div className="tab-bar" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "docs"}
            className={`tab-btn ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => setActiveTab("docs")}
          >
            📄 Your Documents
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "runs"}
            className={`tab-btn ${activeTab === "runs" ? "active" : ""}`}
            onClick={() => setActiveTab("runs")}
          >
            ⚡ Run History
          </button>
        </div>

        {/* Documents tab */}
        {activeTab === "docs" && (
          <div>
            {/* Upload zone */}
            <div
              className={`upload-zone ${isDragging ? "dragging" : ""}`}
              style={{ marginBottom: "var(--space-5)" }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              role="button"
              tabIndex={0}
              aria-label="Upload document"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div>
                  <div className="spinner" style={{ margin: "0 auto var(--space-4)", width: 28, height: 28, borderWidth: 3 }} />
                  <p style={{ color: "var(--cyan)", fontWeight: 600 }}>Uploading…</p>
                  <div className="upload-progress" style={{ marginTop: "var(--space-4)", maxWidth: 240, margin: "var(--space-4) auto 0" }}>
                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <span className="upload-zone-icon">
                    {isDragging ? "📂" : "⬆️"}
                  </span>
                  <h3>{isDragging ? "Drop to upload" : "Upload a document"}</h3>
                  <p>PDF, DOCX, TXT, or Markdown · Max 10 MB</p>
                  <button className="btn btn-primary btn-sm" style={{ pointerEvents: "none" }}>
                    Browse Files
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />

            {/* Document table */}
            <div className="doc-table-wrap">
              <div className="doc-table-header">
                <span className="doc-table-title">
                  {documents.length} Document{documents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {isLoadingDocs ? (
                <div style={{ padding: "var(--space-8)" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ height: 48, marginBottom: "var(--space-3)" }} />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📁</div>
                  <h3>No documents yet</h3>
                  <p>Upload a PDF, DOCX, TXT, or Markdown file to get started with the RAG pipeline.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Chunks</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="doc-filename">
                            <div className={`doc-icon ${FILE_ICON_CLASS[doc.fileType] ?? "doc-icon-txt"}`}>
                              {FILE_ICONS[doc.fileType] ?? "TXT"}
                            </div>
                            {doc.filename}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${doc.fileType === "pdf" ? "badge-red" : doc.fileType === "docx" ? "badge-violet" : "badge-cyan"}`}>
                            {doc.fileType.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", color: doc.chunkCount > 0 ? "var(--emerald)" : "var(--text-muted)" }}>
                            {doc.chunkCount > 0 ? doc.chunkCount : "—"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>
                          {timeAgo(doc.createdAt)}
                        </td>
                        <td>
                          <div className="doc-actions">
                            <Link
                              href={`/rag-lab?docId=${doc.id}`}
                              className="btn btn-sm btn-ghost"
                            >
                              Open in Lab
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 9.5l7-7M4 2.5h5.5v5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(doc.id, doc.filename)}
                              aria-label={`Delete ${doc.filename}`}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Runs tab */}
        {activeTab === "runs" && (
          <div>
            {runs.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: "var(--space-16)" }}>
                <div className="empty-state-icon">⚡</div>
                <h3>No pipeline runs yet</h3>
                <p>Open a document in the RAG Lab and run the pipeline to see results here.</p>
              </div>
            ) : (
              runs.map((run) => {
                const params = (() => { try { return JSON.parse(run.params); } catch { return {}; } })();
                const metrics = (() => { try { return JSON.parse(run.metrics || "{}"); } catch { return {}; } })();
                const totalMs = (metrics.chunkingMs || 0) + (metrics.embeddingMs || 0) + (metrics.retrievalMs || 0) + (metrics.generationMs || 0);

                return (
                  <div key={run.id} className="run-card animate-in">
                    <div className="run-card-top">
                      <div>
                        <div className="run-query">&ldquo;{run.query}&rdquo;</div>
                        {run.document && (
                          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                            📄 {run.document.filename}
                          </div>
                        )}
                      </div>
                      <span className={`badge ${
                        run.status === "completed" ? "badge-emerald" :
                        run.status === "failed" ? "badge-red" : "badge-cyan"
                      }`}>
                        {run.status}
                      </span>
                    </div>

                    <div className="run-meta">
                      {[
                        { key: "Chunk Size", val: params.chunkSize ?? "—" },
                        { key: "Top-K", val: params.topK ?? "—" },
                        { key: "Chunks", val: metrics.chunkCount ?? "—" },
                        { key: "Time", val: totalMs ? `${totalMs}ms` : "—" },
                        { key: "Tokens", val: metrics.totalTokens ?? "—" },
                      ].map((s) => (
                        <div key={s.key} className="run-stat">
                          <div className="run-stat-val">{s.val}</div>
                          <div className="run-stat-key">{s.key}</div>
                        </div>
                      ))}
                      <div style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)", marginLeft: "auto" }}>
                        {timeAgo(run.createdAt)}
                      </div>
                    </div>

                    {run.answer && (
                      <details style={{ marginTop: "var(--space-4)" }}>
                        <summary style={{ fontSize: "var(--fs-xs)" }}>View Answer</summary>
                        <div style={{ fontSize: "var(--fs-xs)", lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                          {run.answer}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
