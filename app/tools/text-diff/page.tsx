import type { Metadata } from "next";
import TextDiffClient from "@/components/tools/text-diff/text-diff-client";
import ToolNavSidebar from "@/components/layout/tool-nav-sidebar";

export const metadata: Metadata = {
  title: "Text Diff Tool — Free Online Comparison | CodeBridge",
  description:
    "Compare two texts, code files, or configs with instant line-by-line diff. Split and unified views, syntax highlighting, ignore whitespace. 100% client-side.",
  keywords: [
    "text diff",
    "code diff",
    "file comparison",
    "diff viewer",
    "online diff tool",
  ],
};

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

export default function TextDiffPage() {
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
                <span style={{ color: "var(--electric-blue)" }}>text-diff</span>
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
                Text Diff
              </h1>

              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.82rem",
                  color: "var(--code-comment)",
                  lineHeight: 1.6,
                  maxWidth: "560px",
                }}
              >
                Compare two texts{" "}
                <span style={{ color: "var(--terminal-green)", opacity: 0.8 }}>
                  instantly
                </span>{" "}
                — line-by-line diff with split and unified views. Zero server calls,
                zero data sent.
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
                minWidth: "220px",
                maxWidth: "340px",
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
              <pre
                style={{
                  margin: 0,
                  padding: "10px 14px",
                  fontFamily: monoFont,
                  fontSize: "0.7rem",
                  lineHeight: "1.85",
                  color: "var(--code-comment)",
                  whiteSpace: "pre-wrap",
                }}
              >
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>1.</span>{" Paste original text into the left pane\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>2.</span>{" Paste modified text into the right pane\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>3.</span>{" Differences highlight automatically\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>4.</span>{" Switch between Split / Unified views\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>5.</span>{" Toggle to ignore whitespace changes\n"}
                <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>
                  {"* Green = added  /  Red = removed"}
                </span>
              </pre>
            </div>
          </div>

          {/* Tool */}
          <TextDiffClient />
        </div>

        {/* Sidebar */}
        <ToolNavSidebar currentTool="text-diff" />
      </div>
    </main>
  );
}
