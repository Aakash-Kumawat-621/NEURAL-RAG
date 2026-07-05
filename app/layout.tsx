import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Neural RAG — Learn Agentic RAG Interactively",
  description: "Upload documents, watch agentic AI pipeline them chunk by chunk, and get grounded answers. Built with Gemini 2.5, Pinecone, and LangGraph.",
  keywords: ["RAG", "AI", "Gemini", "Pinecone", "LangGraph", "Vector Embeddings", "Agentic AI"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>
          <Navbar />
          {children}
          <Toaster
            richColors
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(10, 15, 30, 0.95)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                color: "#f1f5f9",
                backdropFilter: "blur(12px)",
                fontFamily: "Inter, sans-serif",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
