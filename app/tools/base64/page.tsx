import type { Metadata } from "next";
import Base64Client from "@/components/tools/base64/base64-client";

export const metadata: Metadata = {
  title: "Base64 Encoder/Decoder — Free Online Tool | CodeBridge",
  description:
    "Encode and decode Base64 strings, URL-safe Base64, images, and JWT tokens instantly in your browser. No server required. Supports UTF-8, file upload, and JWT parsing.",
  keywords: [
    "base64 encoder",
    "base64 decoder",
    "base64 online",
    "jwt decoder",
    "url safe base64",
    "image to base64",
  ],
};

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

export default function Base64Page() {
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
      {/* Grid lines background */}
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
              <span style={{ color: "var(--electric-blue)" }}>base64</span>
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
              Base64{" "}
              <span style={{ color: "var(--code-comment)", fontWeight: 400 }}>
                Encoder
              </span>{" "}
              /{" "}
              <span style={{ color: "var(--code-comment)", fontWeight: 400 }}>
                Decoder
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
              Encode, decode, and inspect Base64{" "}
              <span style={{ color: "var(--terminal-green)", opacity: 0.8 }}>
                instantly
              </span>{" "}
              — text, URL-safe, images, and JWT tokens. Runs entirely in your browser.
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
              {/* Text / URL Safe */}
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
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>1.</span>{" Text / URL Safe tabs\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>2.</span>{" Type or paste text to encode\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>3.</span>{" Switch Encode / Decode mode\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>4.</span>{" Use Swap to flip input/output\n"}
                <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>{"* URL Safe replaces +/= with -_"}</span>
              </pre>
              {/* Image / JWT */}
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
                <span style={{ color: "rgba(88,166,255,0.7)", fontWeight: 700 }}>{"// Image & JWT\n"}</span>
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Image: drag & drop or click upload\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Copies as data URL, img tag, CSS\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" JWT: paste token to decode parts\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>-</span>{" Shows expiry countdown or expired\n"}
                <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>{"* Not encryption — anyone can decode"}</span>
              </pre>
            </div>
          </div>
        </div>

        {/* Tool */}
        <Base64Client />
      </div>
    </main>
  );
}
