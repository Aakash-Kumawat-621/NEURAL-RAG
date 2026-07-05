import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <main id="main-content">
        <section className="hero">
          <div style={{ maxWidth: 760, width: "100%" }}>
            <div className="animate-in">
              <div className="hero-eyebrow">
                <span>✦</span>
                Powered by Gemini 2.5 &amp; Pinecone
              </div>
            </div>

            <h1 className="animate-in delay-1">
              Learn RAG Through<br />
              <span>Interactive AI Agents</span>
            </h1>

            <p className="hero-desc animate-in delay-2">
              Upload a document and watch an agentic pipeline dissect it — 
              chunk by chunk, embedding by embedding, retrieval by retrieval. 
              Built for engineers who want to understand RAG from the inside out.
            </p>

            <div className="hero-actions animate-in delay-3">
              <Link href="/signup" className="btn btn-primary btn-lg pulse-glow">
                Start Learning Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/login" className="btn btn-ghost btn-lg">
                Sign In
              </Link>
            </div>

            {/* Floating stat pills */}
            <div className="animate-in delay-4" style={{ marginTop: "var(--space-12)", display: "flex", justifyContent: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
              {[
                { label: "Embedding Dims", value: "768" },
                { label: "LLM Model", value: "Gemini 2.5" },
                { label: "Vector DB", value: "Pinecone" },
                { label: "Pipeline Steps", value: "3-Stage" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  padding: "0.5rem 1.25rem",
                  background: "rgba(6,182,212,0.06)",
                  border: "1px solid rgba(6,182,212,0.15)",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</span>
                  <span style={{ color: "var(--cyan)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <div style={{ textAlign: "center", padding: "var(--space-16) 0 var(--space-10)" }}>
              <h2 style={{ fontSize: "var(--fs-4xl)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "var(--space-4)" }}>
                How it <span className="text-gradient">works</span>
              </h2>
              <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto" }}>
                A three-stage agentic pipeline with human-in-the-loop control at every step.
              </p>
            </div>

            <div className="features-grid" style={{ paddingTop: 0 }}>
              <div className="glass-card feature-card animate-in delay-1">
                <div className="feature-icon feature-icon-cyan">🧩</div>
                <h3>Intelligent Chunking</h3>
                <p>RecursiveCharacterTextSplitter breaks your document into semantically meaningful chunks with configurable size and overlap parameters you control in real time.</p>
              </div>
              <div className="glass-card feature-card animate-in delay-2">
                <div className="feature-icon feature-icon-violet">🧠</div>
                <h3>Vector Embeddings</h3>
                <p>Gemini&apos;s embedding model converts each chunk into a 768-dimensional vector. Watch the embedding preview update live as you tweak parameters.</p>
              </div>
              <div className="glass-card feature-card animate-in delay-3">
                <div className="feature-icon feature-icon-emerald">⚡</div>
                <h3>Retrieval &amp; Generation</h3>
                <p>Pinecone cosine similarity search retrieves the top-K most relevant chunks. Gemini 2.5 Flash synthesizes a grounded answer from the retrieved context.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "var(--space-20) var(--space-6)", textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ fontSize: "var(--fs-4xl)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "var(--space-4)" }}>
              Ready to explore RAG?
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-8)" }}>
              Create a free account and start uploading documents in under a minute.
            </p>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Get Started — It&apos;s Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
          Built with Next.js · Gemini · Pinecone · LangGraph
        </p>
      </footer>
    </>
  );
}
