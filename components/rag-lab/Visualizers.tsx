"use client";


export function ChunkVisualizer({ chunks }: { chunks: string[] }) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="panel glass-card">
      <div className="panel-header">
        <h3>Document Chunks ({chunks.length})</h3>
      </div>
      <div className="chunks-grid">
        {chunks.slice(0, 12).map((chunk, i) => (
          <div key={i} className="chunk-card">
            <div className="chunk-header">
              <span className="chunk-index">Chunk #{i + 1}</span>
              <span className="chunk-size">{chunk.length} chars</span>
            </div>
            <div className="chunk-text">
              {chunk}
            </div>
          </div>
        ))}
      </div>
      {chunks.length > 12 && (
        <div style={{ textAlign: "center", marginTop: "var(--space-4)", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          + {chunks.length - 12} more chunks...
        </div>
      )}
    </div>
  );
}

export function EmbeddingViewer({ embeddings }: { embeddings: number[][] }) {
  if (!embeddings || embeddings.length === 0) return null;

  return (
    <div className="panel glass-card" style={{ marginTop: "var(--space-6)" }}>
      <div className="panel-header">
        <h3>Vector Embeddings (Preview)</h3>
      </div>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
        Each chunk is converted into a 768-dimensional vector by Gemini. Here are the first 5 dimensions of the first few chunks:
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {embeddings.slice(0, 5).map((vector, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--accent-primary)", fontFamily: "var(--font-mono)", width: 70 }}>
              Chunk #{i + 1}
            </span>
            <div className="embedding-grid" style={{ flex: 1 }}>
              {vector.map((val, j) => (
                <div key={j} className="embedding-cell" style={{ background: `rgba(0, 212, 170, ${Math.abs(val) * 2})` }}>
                  {val.toFixed(3)}
                </div>
              ))}
              <div className="embedding-cell">...</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
