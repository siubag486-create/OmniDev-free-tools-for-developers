"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Trash2, ArrowRightLeft, ShieldCheck } from "lucide-react";

type TabId = "url" | "query";
type Mode = "encode" | "decode";
type Status = "idle" | "valid" | "error";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

// ── helpers ──────────────────────────────────────────────────────────────────

function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

function decodeUrl(input: string): string {
  return decodeURIComponent(input);
}

function parseQueryString(raw: string): { key: string; value: string }[] {
  // Accept full URL or just query string
  let qs = raw.trim();
  if (qs.includes("?")) {
    qs = qs.slice(qs.indexOf("?") + 1);
  }
  if (!qs) return [];

  return qs.split("&").map((pair) => {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) return { key: decodeURIComponent(pair), value: "" };
    const k = pair.slice(0, eqIdx);
    const v = pair.slice(eqIdx + 1);
    try {
      return { key: decodeURIComponent(k), value: decodeURIComponent(v) };
    } catch {
      return { key: k, value: v };
    }
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function WindowDots() {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      {(["#ff5f56", "#ffbd2e", "#27c93f"] as const).map((color) => (
        <div
          key={color}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: color,
            opacity: 0.85,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: monoFont,
        fontSize: "0.72rem",
        padding: "5px 10px",
        borderRadius: "5px",
        cursor: "pointer",
        border: copied
          ? "1px solid rgba(0,255,136,0.5)"
          : "1px solid rgba(88,166,255,0.2)",
        background: copied ? "rgba(0,255,136,0.08)" : "rgba(88,166,255,0.05)",
        color: copied ? "var(--terminal-green)" : "var(--code-comment)",
        transition: "all 0.15s",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── URL Encode / Decode tab ───────────────────────────────────────────────────

function UrlTab() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const process = useCallback((value: string, currentMode: Mode) => {
    if (!value.trim()) {
      setOutput("");
      setStatus("idle");
      setErrorMsg("");
      return;
    }
    try {
      const result =
        currentMode === "encode" ? encodeUrl(value) : decodeUrl(value);
      setOutput(result);
      setStatus("valid");
      setErrorMsg("");
    } catch {
      setOutput("");
      setStatus("error");
      setErrorMsg("Invalid percent-encoded string");
    }
  }, []);

  const handleInput = (v: string) => {
    setInput(v);
    process(v, mode);
  };

  const handleMode = (m: Mode) => {
    setMode(m);
    process(input, m);
  };

  const handleSwap = () => {
    const newInput = output;
    const newMode: Mode = mode === "encode" ? "decode" : "encode";
    setInput(newInput);
    setMode(newMode);
    process(newInput, newMode);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setStatus("idle");
    setErrorMsg("");
  };

  const statusColor =
    status === "valid"
      ? "var(--terminal-green)"
      : status === "error"
        ? "#ff7b72"
        : "var(--code-comment)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid rgba(88,166,255,0.15)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {(["encode", "decode"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleMode(m)}
              style={{
                fontFamily: monoFont,
                fontSize: "0.72rem",
                padding: "5px 14px",
                border: "none",
                cursor: "pointer",
                background:
                  mode === m
                    ? "rgba(0,255,136,0.1)"
                    : "rgba(255,255,255,0.02)",
                color:
                  mode === m ? "var(--terminal-green)" : "var(--code-comment)",
                borderRight:
                  m === "encode" ? "1px solid rgba(88,166,255,0.15)" : "none",
                transition: "all 0.15s",
              }}
            >
              {m === "encode" ? "Encode" : "Decode"}
            </button>
          ))}
        </div>

        {/* Status badge */}
        <span
          style={{
            fontFamily: monoFont,
            fontSize: "0.68rem",
            color: statusColor,
            opacity: status === "idle" ? 0 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {status === "valid"
            ? mode === "encode"
              ? "Encoded"
              : "Decoded"
            : errorMsg}
        </span>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleSwap}
          title="Swap input/output"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: monoFont,
            fontSize: "0.72rem",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
            border: "1px solid rgba(88,166,255,0.2)",
            background: "rgba(88,166,255,0.05)",
            color: "var(--code-comment)",
            transition: "all 0.15s",
          }}
        >
          <ArrowRightLeft size={12} />
          Swap
        </button>

        <button
          onClick={handleClear}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: monoFont,
            fontSize: "0.72rem",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
            border: "1px solid rgba(255,123,114,0.2)",
            background: "rgba(255,123,114,0.04)",
            color: "var(--code-comment)",
            transition: "all 0.15s",
          }}
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Split pane */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        {/* Input */}
        <div
          style={{
            border: "1px solid rgba(88,166,255,0.15)",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid rgba(88,166,255,0.1)",
              backgroundColor: "rgba(88,166,255,0.04)",
              fontFamily: monoFont,
              fontSize: "0.65rem",
              color: "var(--code-comment)",
              letterSpacing: "0.08em",
            }}
          >
            INPUT
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Paste text to encode..."
                : "Paste percent-encoded string to decode..."
            }
            spellCheck={false}
            style={{
              flex: 1,
              minHeight: "260px",
              padding: "12px",
              background: "rgba(10,14,26,0.8)",
              border: "none",
              outline: "none",
              resize: "vertical",
              fontFamily: monoFont,
              fontSize: "0.8rem",
              color: "#e6edf3",
              lineHeight: "1.7",
            }}
          />
        </div>

        {/* Output */}
        <div
          style={{
            border: `1px solid ${status === "error" ? "rgba(255,123,114,0.3)" : "rgba(0,255,136,0.15)"}`,
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              borderBottom: `1px solid ${status === "error" ? "rgba(255,123,114,0.15)" : "rgba(0,255,136,0.1)"}`,
              backgroundColor:
                status === "error"
                  ? "rgba(255,123,114,0.04)"
                  : "rgba(0,255,136,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "0.65rem",
                color: "var(--code-comment)",
                letterSpacing: "0.08em",
              }}
            >
              OUTPUT
            </span>
            {output && <CopyButton text={output} />}
          </div>
          <pre
            style={{
              flex: 1,
              minHeight: "260px",
              margin: 0,
              padding: "12px",
              background: "rgba(10,14,26,0.8)",
              fontFamily: monoFont,
              fontSize: "0.8rem",
              color:
                status === "error" ? "#ff7b72" : "var(--terminal-green)",
              lineHeight: "1.7",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {status === "error"
              ? errorMsg
              : output || (
                  <span style={{ color: "var(--code-comment)", opacity: 0.4 }}>
                    Output will appear here...
                  </span>
                )}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Query String tab ──────────────────────────────────────────────────────────

function QueryTab() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const params = parseQueryString(input);

  const copyParam = (idx: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Input */}
      <div
        style={{
          border: "1px solid rgba(88,166,255,0.15)",
          borderRadius: "8px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "6px 12px",
            borderBottom: "1px solid rgba(88,166,255,0.1)",
            backgroundColor: "rgba(88,166,255,0.04)",
            fontFamily: monoFont,
            fontSize: "0.65rem",
            color: "var(--code-comment)",
            letterSpacing: "0.08em",
          }}
        >
          URL OR QUERY STRING
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com/search?q=hello+world&lang=ko&page=1"
          spellCheck={false}
          style={{
            minHeight: "80px",
            padding: "12px",
            background: "rgba(10,14,26,0.8)",
            border: "none",
            outline: "none",
            resize: "vertical",
            fontFamily: monoFont,
            fontSize: "0.8rem",
            color: "#e6edf3",
            lineHeight: "1.7",
          }}
        />
      </div>

      {/* Parsed table */}
      {params.length > 0 ? (
        <div
          style={{
            border: "1px solid rgba(0,255,136,0.15)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr auto",
              backgroundColor: "rgba(0,255,136,0.06)",
              borderBottom: "1px solid rgba(0,255,136,0.12)",
              padding: "7px 14px",
            }}
          >
            {["KEY", "VALUE", ""].map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.62rem",
                  color: "rgba(0,255,136,0.6)",
                  letterSpacing: "0.1em",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {params.map((p, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr auto",
                alignItems: "center",
                padding: "9px 14px",
                borderBottom:
                  i < params.length - 1
                    ? "1px solid rgba(0,255,136,0.06)"
                    : undefined,
                background: i % 2 === 0 ? "transparent" : "rgba(0,255,136,0.015)",
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.78rem",
                  color: "var(--electric-blue)",
                  wordBreak: "break-all",
                  paddingRight: "12px",
                }}
              >
                {p.key}
              </span>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.78rem",
                  color: "#e6edf3",
                  wordBreak: "break-all",
                  paddingRight: "12px",
                }}
              >
                {p.value || (
                  <span style={{ color: "var(--code-comment)", opacity: 0.4 }}>
                    (empty)
                  </span>
                )}
              </span>
              <button
                onClick={() => copyParam(i, p.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: monoFont,
                  fontSize: "0.65rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  border:
                    copied === i
                      ? "1px solid rgba(0,255,136,0.5)"
                      : "1px solid rgba(88,166,255,0.2)",
                  background:
                    copied === i
                      ? "rgba(0,255,136,0.08)"
                      : "rgba(88,166,255,0.04)",
                  color:
                    copied === i
                      ? "var(--terminal-green)"
                      : "var(--code-comment)",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {copied === i ? <Check size={11} /> : <Copy size={11} />}
                {copied === i ? "Copied" : "Copy"}
              </button>
            </div>
          ))}

          {/* Footer: param count */}
          <div
            style={{
              padding: "6px 14px",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderTop: "1px solid rgba(0,255,136,0.08)",
              fontFamily: monoFont,
              fontSize: "0.65rem",
              color: "var(--code-comment)",
              opacity: 0.6,
            }}
          >
            {params.length} parameter{params.length !== 1 ? "s" : ""} found
          </div>
        </div>
      ) : input.trim() ? (
        <div
          style={{
            fontFamily: monoFont,
            fontSize: "0.78rem",
            color: "var(--code-comment)",
            opacity: 0.5,
            padding: "20px",
            textAlign: "center",
          }}
        >
          No query parameters found
        </div>
      ) : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "url", label: "URL Encode / Decode" },
  { id: "query", label: "Query String Parser" },
];

export default function UrlEncoderClient() {
  const [activeTab, setActiveTab] = useState<TabId>("url");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Client-side badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid rgba(0,255,136,0.15)",
          backgroundColor: "rgba(0,255,136,0.05)",
          width: "fit-content",
        }}
      >
        <ShieldCheck
          size={12}
          style={{ color: "var(--terminal-green)", flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: monoFont,
            fontSize: "0.68rem",
            color: "var(--code-comment)",
          }}
        >
          100% client-side — no data leaves your browser
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--terminal-border)",
          borderRadius: "10px",
          overflow: "hidden",
          backgroundColor: "rgba(10, 14, 26, 0.6)",
        }}
      >
        {/* Window titlebar */}
        <div
          style={{
            backgroundColor: "rgba(16, 16, 16, 0.99)",
            borderBottom: "1px solid var(--terminal-border)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <WindowDots />
          <span
            style={{
              fontFamily: monoFont,
              fontSize: "0.68rem",
              color: "var(--code-comment)",
              opacity: 0.5,
              letterSpacing: "0.06em",
            }}
          >
            url-encoder — encode/decode/parse
          </span>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--terminal-border)",
            backgroundColor: "rgba(16,16,16,0.5)",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontFamily: monoFont,
                fontSize: "0.72rem",
                padding: "9px 18px",
                border: "none",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid var(--terminal-green)"
                    : "2px solid transparent",
                cursor: "pointer",
                background: "none",
                color:
                  activeTab === tab.id
                    ? "var(--terminal-green)"
                    : "var(--code-comment)",
                letterSpacing: "0.04em",
                transition: "all 0.15s",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "20px" }}>
          {activeTab === "url" && <UrlTab />}
          {activeTab === "query" && <QueryTab />}
        </div>
      </div>
    </div>
  );
}
