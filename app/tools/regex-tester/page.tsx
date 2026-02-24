import type { Metadata } from "next";
import RegexTesterClient from "@/components/tools/regex-tester/regex-tester-client";

export const metadata: Metadata = {
  title: "Regex Tester — Free Online Tool | CodeBridge",
  description:
    "Test regular expressions in real-time. See matches highlighted instantly, explore capture groups, and toggle flags. No server required.",
  keywords: [
    "regex tester",
    "regular expression tester",
    "regex debugger",
    "online regex",
    "javascript regex",
  ],
};

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

export default function RegexTesterPage() {
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
            <span style={{ color: "var(--electric-blue)" }}>regex-tester</span>
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
            Regex Tester
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
            Write and test regular expressions{" "}
            <span style={{ color: "var(--terminal-green)", opacity: 0.8 }}>
              instantly
            </span>{" "}
            — matches highlighted in real-time. Zero server calls, zero data sent.
          </p>
        </div>

        {/* Tool */}
        <RegexTesterClient />
      </div>
    </main>
  );
}
