import type { Metadata } from "next";
import JsonFormatterClient from "@/components/tools/json-formatter/json-formatter-client";

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
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "40px 24px 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
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

        {/* Tool */}
        <JsonFormatterClient />
      </div>
    </main>
  );
}
