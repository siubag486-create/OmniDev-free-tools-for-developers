"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

const links = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      style={{
        backgroundColor: "rgba(8, 8, 8, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            width="12"
            height="14"
            viewBox="0 0 18 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <rect x="0" y="0" width="4" height="22" rx="1" fill="#00ff88" />
            <rect x="7" y="0" width="4" height="22" rx="1" fill="#00ff88" />
            <rect x="14" y="0" width="4" height="22" rx="1" fill="#00ff88" />
          </svg>
          <span
            style={{
              fontFamily: "'RoundedFixedsys', var(--font-space-mono), monospace",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "var(--terminal-green)",
              letterSpacing: "0.05em",
            }}
          >
            OmniDev
          </span>
          <span
            style={{
              fontFamily: monoFont,
              fontSize: "0.7rem",
              color: "var(--code-comment)",
              marginLeft: "-2px",
            }}
          >
            _
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex" style={{ alignItems: "center", gap: "2px" }}>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: monoFont,
                fontSize: "0.75rem",
                letterSpacing: "0.04em",
                textDecoration: "none",
                padding: "5px 13px",
                borderRadius: "5px",
                transition: "all 0.2s",
              }}
              className="text-[rgba(255,255,255,0.9)] border border-transparent bg-transparent hover:text-[#58a6ff]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden items-center justify-center"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: "none",
            border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: "6px",
            padding: "6px",
            cursor: "pointer",
            color: "var(--terminal-green)",
          }}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: "rgba(8, 8, 8, 0.98)",
            borderTop: "1px solid rgba(0,255,136,0.1)",
            padding: "8px 24px 16px",
          }}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "block",
                fontFamily: monoFont,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.8)",
                textDecoration: "none",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
