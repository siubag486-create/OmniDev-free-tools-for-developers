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

          {/* Right: How to use tips box */}
          <div
            style={{
              border: "1px solid rgba(88,166,255,0.18)",
              borderRadius: "7px",
              backgroundColor: "rgba(88,166,255,0.03)",
              overflow: "hidden",
              flexShrink: 0,
              minWidth: "220px",
              maxWidth: "280px",
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
                whiteSpace: "pre",
              }}
            >
              <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>1.</span>{" Type your pattern in the regex field\n"}
              <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>2.</span>{" Enter test text in the area below\n"}
              <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>3.</span>{" Matches highlight in real-time\n"}
              <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>4.</span>{" Toggle flags (g, i, m) as needed\n"}
              <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>5.</span>{" Capture groups appear in the panel\n"}
              <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>
                {"* \\ auto-converts from Korean \\ key"}
              </span>
            </pre>
          </div>
        </div>

        {/* Tool */}
        <RegexTesterClient />
      </div>
    </main>
  );
}
