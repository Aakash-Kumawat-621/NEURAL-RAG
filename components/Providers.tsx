"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster 
        theme="dark" 
        position="top-right" 
        toastOptions={{
          style: {
            background: "rgba(26, 26, 46, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            color: "#f0f0f5",
          }
        }}
      />
    </SessionProvider>
  );
}
