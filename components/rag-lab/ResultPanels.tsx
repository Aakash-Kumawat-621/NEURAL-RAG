"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function RetrievalPanel({ retrievedContext }: { retrievedContext: any[] }) {
  if (!retrievedContext || retrievedContext.length === 0) return null;

  return (
    <div className="panel glass-card">
      <div className="panel-header">
        <h3>Top-K Retrieved Context</h3>
      </div>
      <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
        Pinecone searched the vector database and found these chunks to be most similar to the query.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {retrievedContext.map((chunk, i) => (
          <div key={i} className="retrieval-result animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="score-bar-container">
              <span className="score-value">{(chunk.score * 100).toFixed(1)}%</span>
              <div className="score-bar">
                <div 
                  className="score-bar-fill" 
                  style={{ 
                    height: `${chunk.score * 100}%`,
                    background: `linear-gradient(to top, var(--accent-primary), var(--accent-secondary))`
                  }} 
                />
              </div>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                #{chunk.chunkIndex + 1}
              </span>
            </div>
            <div className="retrieval-content">
              <div className="retrieval-text">
                {chunk.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenerationPanel({ answer }: { answer: string }) {
  if (!answer) return null;

  return (
    <div className="panel glass-card pulse-glow">
      <div className="panel-header">
        <h3>Generated Answer</h3>
        <span className="badge badge-green">Gemini 2.5 Flash</span>
      </div>
      <div className="generation-output markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Style source citations like [Source 1] with accent colour
            p: ({ children }) => (
              <p>
                {typeof children === "string"
                  ? children.split(/(\[Source \d+\])/g).map((part, j) =>
                      part.match(/\[Source \d+\]/) ? (
                        <strong key={j} style={{ color: "var(--accent-secondary)", margin: "0 2px" }}>
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )
                  : children}
              </p>
            ),
            code: ({ children, className }) => {
              const isBlock = className !== undefined;
              return isBlock ? (
                <pre className="code-block-md">
                  <code>{children}</code>
                </pre>
              ) : (
                <code className="inline-code">{children}</code>
              );
            },
          }}
        >
          {answer}
        </ReactMarkdown>
      </div>
    </div>
  );
}

