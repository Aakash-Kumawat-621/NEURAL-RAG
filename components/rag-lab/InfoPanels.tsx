"use client";

import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

export function CodeBehindPanel({ snippets }: { snippets: Record<string, string> }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!snippets || Object.keys(snippets).length === 0) return null;

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key);
  };

  const labels: Record<string, string> = {
    chunking: "Text Splitter (LangChain)",
    embedding: "Embeddings (Gemini)",
    upsert: "Vector DB (Pinecone)",
    queryEmbed: "Embed Query (Gemini)",
    similaritySearch: "Similarity Search (Pinecone)",
    generation: "Prompt + LLM (Gemini)",
  };

  return (
    <div className="panel glass-card" style={{ marginTop: "var(--space-6)" }}>
      <div className="panel-header">
        <h3><span style={{ fontSize: "1.2rem" }}>🧑‍💻</span> The Code Behind</h3>
      </div>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
        Click to see the actual code running under the hood during this step.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {Object.entries(snippets).map(([key, code]) => (
          <div key={key} className="code-panel">
            <div
              className="code-panel-header"
              onClick={() => toggle(key)}
              role="button"
              aria-expanded={expanded === key}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggle(key)}
            >
              <h4>{labels[key] || key}</h4>
              <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>
                {expanded === key ? "▲ Collapse" : "▼ Expand"}
              </span>
            </div>
            {expanded === key && (
              <div className="code-panel-body" style={{ padding: 0, overflow: "hidden", borderRadius: "0 0 var(--radius-md) var(--radius-md)" }}>
                <Highlight
                  theme={themes.nightOwl}
                  code={code.trim()}
                  language="typescript"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      className={className}
                      style={{
                        ...style,
                        margin: 0,
                        padding: "var(--space-4)",
                        fontSize: "var(--fs-sm)",
                        lineHeight: 1.6,
                        overflowX: "auto",
                        background: "rgba(1, 22, 39, 0.95)",
                      }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          <span style={{ color: "#4a5568", userSelect: "none", marginRight: "var(--space-4)", fontSize: "var(--fs-xs)" }}>
                            {String(i + 1).padStart(2, " ")}
                          </span>
                          {line.map((token, j) => (
                            <span key={j} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricsDashboard({ metrics }: { metrics: any }) {
  if (!metrics || Object.keys(metrics).length === 0) return null;

  // Estimate cost: Gemini 2.5 Flash ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
  const estimatedCost = metrics.totalTokens
    ? ((metrics.totalTokens * 0.075) / 1_000_000).toFixed(6)
    : null;

  return (
    <div className="panel glass-card" style={{ marginTop: "var(--space-6)" }}>
      <div className="panel-header">
        <h3><span style={{ fontSize: "1.2rem" }}>⚡</span> Performance Metrics</h3>
      </div>
      
      <div className="metrics-grid">
        {metrics.chunkingMs !== undefined && (
          <div className="metric-card">
            <div className="metric-value">{metrics.chunkingMs}ms</div>
            <div className="metric-label">Chunking Latency</div>
          </div>
        )}
        
        {metrics.embeddingMs !== undefined && (
          <div className="metric-card">
            <div className="metric-value">{metrics.embeddingMs}ms</div>
            <div className="metric-label">Embedding API Latency</div>
          </div>
        )}
        
        {metrics.retrievalMs !== undefined && (
          <div className="metric-card">
            <div className="metric-value">{metrics.retrievalMs}ms</div>
            <div className="metric-label">Pinecone Search Latency</div>
          </div>
        )}
        
        {metrics.generationMs !== undefined && (
          <div className="metric-card">
            <div className="metric-value">{(metrics.generationMs / 1000).toFixed(1)}s</div>
            <div className="metric-label">Gemini Generation Latency</div>
          </div>
        )}

        {metrics.totalTokens !== undefined && (
          <div className="metric-card">
            <div className="metric-value">~{metrics.totalTokens.toLocaleString()}</div>
            <div className="metric-label">Tokens (Input + Output)</div>
          </div>
        )}

        {estimatedCost && (
          <div className="metric-card">
            <div className="metric-value" style={{ color: "var(--accent-secondary)" }}>
              ~${estimatedCost}
            </div>
            <div className="metric-label">Estimated Cost (USD)</div>
          </div>
        )}
      </div>
    </div>
  );
}

