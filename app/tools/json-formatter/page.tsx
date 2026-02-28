import type { Metadata } from "next";
import JsonFormatterClient from "@/components/tools/json-formatter/json-formatter-client";
import ToolNavSidebar from "@/components/layout/tool-nav-sidebar";

export const metadata: Metadata = {
  title: "JSON Formatter & Validator — Free Online Tool | CodeBridge",
  description:
    "Format, validate, and minify JSON instantly in your browser. No server required. Fast, free JSON beautifier with syntax highlighting and error detection.",
  keywords: [
    "json formatter",
    "json validator",
    "json beautifier",
    "format json online",
    "json minifier",
  ],
};

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

export default function JsonFormatterPage() {
  return (
    <main
      style={{
        backgroundColor: "var(--terminal-bg)",
        minHeight: "100vh",
        paddingTop: "56px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid lines background — matches hero */}
      <div
        className="grid-lines-bg"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1480px",
          margin: "0 auto",
          padding: "40px 24px 60px",
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: "32px",
          alignItems: "flex-start",
        }}
      >
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Page header */}
          <div
            style={{
              marginBottom: "28px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {/* Left: title block */}
            <div>
              {/* Breadcrumb */}
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.72rem",
                  color: "var(--code-comment)",
                  marginBottom: "10px",
                  letterSpacing: "0.04em",
                }}
              >
                <span style={{ color: "var(--terminal-green)" }}>~</span>
                <span style={{ opacity: 0.5 }}>/tools/</span>
                <span style={{ color: "var(--electric-blue)" }}>
                  json-formatter
                </span>
              </p>

              <h1
                style={{
                  fontFamily: monoFont,
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  fontWeight: 700,
                  color: "var(--terminal-green)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  marginBottom: "8px",
                }}
              >
                JSON Formatter{" "}
                <span style={{ color: "var(--code-comment)", fontWeight: 400 }}>
                  &amp;
                </span>{" "}
                Validator
              </h1>

              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.82rem",
                  color: "var(--code-comment)",
                  lineHeight: 1.6,
                  maxWidth: "540px",
                }}
              >
                Format, minify, and validate JSON{" "}
                <span style={{ color: "var(--terminal-green)", opacity: 0.8 }}>
                  instantly
                </span>{" "}
                — runs entirely in your browser. Zero server calls, zero data sent.
              </p>
            </div>

            {/* Right: How to use tips box */}
            <div
              style={{
                border: "1px solid rgba(88,166,255,0.18)",
                borderRadius: "7px",
                backgroundColor: "rgba(88,166,255,0.03)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid rgba(88,166,255,0.12)",
                  backgroundColor: "rgba(88,166,255,0.06)",
                  fontFamily: monoFont,
                  fontSize: "0.65rem",
                  color: "#58a6ff",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                // How to use
              </div>
              <div style={{ display: "flex" }}>
                {/* Basic usage */}
                <pre
                  style={{
                    margin: 0,
                    padding: "10px 14px",
                    fontFamily: monoFont,
                    fontSize: "0.7rem",
                    lineHeight: "1.85",
                    color: "var(--code-comment)",
                    whiteSpace: "pre",
                    borderRight: "1px solid rgba(88,166,255,0.1)",
                  }}
                >
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>1.</span>{" Paste JSON into the left pane\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>2.</span>{" Validation runs automatically\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>3.</span>{" Hit Auto-fix if there are errors\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>4.</span>{" Choose Format or Minify mode\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>5.</span>{" Copy the result from right pane\n"}
                  <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>{"* Drag & drop .json files also work"}</span>
                </pre>
                {/* Tree View */}
                <pre
                  style={{
                    margin: 0,
                    padding: "10px 14px",
                    fontFamily: monoFont,
                    fontSize: "0.7rem",
                    lineHeight: "1.85",
                    color: "var(--code-comment)",
                    whiteSpace: "pre",
                  }}
                >
                  <span style={{ color: "rgba(88,166,255,0.7)", fontWeight: 700 }}>{"// Tree View\n"}</span>
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Switch to Tree in output header\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Click ▶ / ▼ to expand / collapse\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Click key name to copy its path\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Use search bar to filter nodes\n"}
                  <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>{"* e.g.  users[0].profile.name"}</span>
                </pre>
              </div>
            </div>
          </div>

          {/* Tool */}
          <JsonFormatterClient />
        </div>

        {/* Sidebar */}
        <ToolNavSidebar currentTool="json-formatter" />
      </div>
    </main>
  );
}
