"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <nav
      className="navbar"
      role="navigation"
      aria-label="Main navigation"
      style={{ boxShadow: scrolled ? "0 1px 40px rgba(0,0,0,0.4)" : undefined }}
    >
      <a href="#main-content" className="skip-link">Skip to content</a>

      <div className="container navbar-inner">
        {/* Brand */}
        <Link href="/" className="navbar-brand" aria-label="Neural RAG home">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="8" fill="url(#brand-grad)"/>
            <circle cx="9" cy="9" r="2.5" fill="white" fillOpacity="0.9"/>
            <circle cx="19" cy="9" r="2.5" fill="white" fillOpacity="0.9"/>
            <circle cx="9" cy="19" r="2.5" fill="white" fillOpacity="0.9"/>
            <circle cx="19" cy="19" r="2.5" fill="white" fillOpacity="0.9"/>
            <circle cx="14" cy="14" r="3" fill="white"/>
            <line x1="9" y1="9" x2="14" y2="14" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
            <line x1="19" y1="9" x2="14" y2="14" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
            <line x1="9" y1="19" x2="14" y2="14" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
            <line x1="19" y1="19" x2="14" y2="14" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#06b6d4"/>
                <stop offset="1" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
          <span>Neural RAG</span>
        </Link>

        {/* Nav links */}
        <ul className="navbar-links" role="list">
          {status === "loading" ? (
            <li><div className="skeleton skeleton-text" style={{ width: 80, margin: 0 }}></div></li>
          ) : session ? (
            <>
              <li>
                <Link
                  href="/dashboard"
                  aria-current={pathname === "/dashboard" ? "page" : undefined}
                  style={{ color: pathname === "/dashboard" ? "var(--cyan)" : "" }}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/rag-lab"
                  aria-current={pathname?.startsWith("/rag-lab") ? "page" : undefined}
                  style={{ color: pathname?.startsWith("/rag-lab") ? "var(--cyan)" : "" }}
                >
                  RAG Lab
                </Link>
              </li>
              <li>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn btn-sm btn-secondary"
                  aria-label="Sign out"
                >
                  Sign Out
                </button>
              </li>
              <li>
                {session.user?.image ? (
                  <div className="navbar-avatar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={session.user.image} alt={session.user.name ?? "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div className="navbar-avatar" title={session.user?.name ?? "User"}>
                    {initials}
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li><Link href="/login" className="btn btn-sm btn-ghost">Log In</Link></li>
              <li><Link href="/signup" className="btn btn-sm btn-primary">Get Started</Link></li>
            </>
          )}

          {/* Theme toggle */}
          <li>
            <button
              onClick={toggleTheme}
              className="btn btn-sm btn-ghost"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              style={{ padding: "0.4rem 0.6rem", fontSize: "1rem" }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
