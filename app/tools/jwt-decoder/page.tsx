import type { Metadata } from "next";
import JwtDecoderClient from "@/components/tools/jwt-decoder/jwt-decoder-client";
import ToolNavSidebar from "@/components/layout/tool-nav-sidebar";

export const metadata: Metadata = {
  title: "JWT Inspector — Free Online JWT Decoder & Verifier | CodeBridge",
  description:
    "Decode and inspect JWT tokens instantly. View Header, Payload, and Signature with live expiry countdown. Verify HMAC signatures with your secret key. Runs entirely in your browser — zero server calls.",
  keywords: [
    "jwt decoder",
    "jwt inspector",
    "jwt debugger",
    "json web token decoder",
    "jwt verify",
    "jwt expiry checker",
    "hs256 verify",
  ],
};

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

export default function JwtDecoderPage() {
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
                <span style={{ color: "var(--electric-blue)" }}>jwt-decoder</span>
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
                JWT{" "}
                <span style={{ color: "var(--code-comment)", fontWeight: 400 }}>
                  Inspector
                </span>
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
                Decode Header, Payload, and Signature.{" "}
                <span style={{ color: "var(--terminal-green)", opacity: 0.85 }}>
                  Live expiry countdown
                </span>{" "}
                and HMAC signature verification — all in your browser, zero server calls.
              </p>
            </div>

            {/* Right: How to use */}
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
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>1.</span>{" Paste JWT token into the input\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>2.</span>{" Header, Payload, Signature decoded\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>3.</span>{" Check live expiry on exp claim\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>4.</span>{" Enter secret + Verify for HS256\n"}
                  <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>{"* all processing done in browser"}</span>
                </pre>
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
                  <span style={{ color: "rgba(88,166,255,0.7)", fontWeight: 700 }}>{"// Standard Claims\n"}</span>
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>iss</span>{" Issuer    "}<span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>sub</span>{" Subject\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>aud</span>{" Audience  "}<span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>jti</span>{" JWT ID\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>exp</span>{" Expiry    "}<span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>iat</span>{" Issued At\n"}
                  <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>nbf</span>{" Not Before\n"}
                  <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>{"* highlighted in payload section"}</span>
                </pre>
              </div>
            </div>
          </div>

          {/* Tool */}
          <JwtDecoderClient />
        </div>

        {/* Sidebar */}
        <ToolNavSidebar currentTool="jwt-decoder" />
      </div>
    </main>
  );
}
