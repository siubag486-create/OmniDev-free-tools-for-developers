"use client";

import { useState, useRef, useCallback } from "react";
import { Copy, Check, Trash2, ArrowRightLeft, Image, Key } from "lucide-react";

type TabId = "text" | "urlsafe" | "image" | "jwt";
type Mode = "encode" | "decode";
type Status = "idle" | "valid" | "error";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

// ── helpers ──────────────────────────────────────────────────────────────────

function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function decodeBase64(input: string): string {
  return decodeURIComponent(escape(atob(input)));
}

function encodeUrlSafe(input: string): string {
  return encodeBase64(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function decodeUrlSafe(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const base64 = pad ? padded + "=".repeat(4 - pad) : padded;
  return decodeBase64(base64);
}

function decodeJwtPart(part: string): unknown {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  return JSON.parse(decodeBase64(padded));
}

function formatExpiry(exp: number): { label: string; expired: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const diff = exp - now;
  if (diff <= 0) {
    const ago = Math.abs(diff);
    if (ago < 60) return { label: `Expired ${ago}s ago`, expired: true };
    if (ago < 3600) return { label: `Expired ${Math.floor(ago / 60)}m ago`, expired: true };
    if (ago < 86400) return { label: `Expired ${Math.floor(ago / 3600)}h ago`, expired: true };
    return { label: `Expired ${Math.floor(ago / 86400)}d ago`, expired: true };
  }
  if (diff < 60) return { label: `${diff}s remaining`, expired: false };
  if (diff < 3600) return { label: `${Math.floor(diff / 60)}m remaining`, expired: false };
  if (diff < 86400) return { label: `${Math.floor(diff / 3600)}h remaining`, expired: false };
  return { label: `${Math.floor(diff / 86400)}d remaining`, expired: false };
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

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
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

// ── Text / URL-Safe tab ───────────────────────────────────────────────────────

function TextTab({ urlSafe = false }: { urlSafe?: boolean }) {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const process = useCallback(
    (value: string, currentMode: Mode) => {
      if (!value.trim()) {
        setOutput("");
        setStatus("idle");
        setErrorMsg("");
        return;
      }
      try {
        const result =
          currentMode === "encode"
            ? urlSafe
              ? encodeUrlSafe(value)
              : encodeBase64(value)
            : urlSafe
              ? decodeUrlSafe(value)
              : decodeBase64(value);
        setOutput(result);
        setStatus("valid");
        setErrorMsg("");
      } catch {
        setOutput("");
        setStatus("error");
        setErrorMsg("Invalid Base64 input");
      }
    },
    [urlSafe],
  );

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
      {/* Mode selector + actions row */}
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
                color: mode === m ? "var(--terminal-green)" : "var(--code-comment)",
                borderRight: m === "encode" ? "1px solid rgba(88,166,255,0.15)" : "none",
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
            ? urlSafe
              ? "URL-safe encoded"
              : mode === "encode"
                ? "Encoded"
                : "Decoded"
            : errorMsg}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Action buttons */}
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
                : "Paste Base64 to decode..."
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

// ── Image tab ─────────────────────────────────────────────────────────────────

function ImageTab() {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [copyStates, setCopyStates] = useState({
    url: false,
    img: false,
    css: false,
  });

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const copyWith = (key: keyof typeof copyStates, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(
        () => setCopyStates((prev) => ({ ...prev, [key]: false })),
        2000,
      );
    });
  };

  const imgTag = dataUrl
    ? `<img src="${dataUrl}" alt="${fileName}" />`
    : "";
  const cssVal = dataUrl ? `background-image: url('${dataUrl}');` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? "var(--terminal-green)" : "rgba(88,166,255,0.2)"}`,
          borderRadius: "10px",
          padding: "40px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragging
            ? "rgba(0,255,136,0.04)"
            : "rgba(88,166,255,0.02)",
          transition: "all 0.2s",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Image
          size={28}
          style={{
            color: isDragging ? "var(--terminal-green)" : "var(--code-comment)",
            margin: "0 auto 10px",
            opacity: 0.6,
          }}
        />
        <p
          style={{
            fontFamily: monoFont,
            fontSize: "0.8rem",
            color: isDragging ? "var(--terminal-green)" : "var(--code-comment)",
            margin: 0,
          }}
        >
          {isDragging ? "Drop image here" : "Drag & drop an image, or click to browse"}
        </p>
        <p
          style={{
            fontFamily: monoFont,
            fontSize: "0.65rem",
            color: "var(--code-comment)",
            opacity: 0.45,
            marginTop: "4px",
            marginBottom: 0,
          }}
        >
          PNG, JPG, GIF, SVG, WebP supported
        </p>
      </div>

      {/* Result */}
      {dataUrl && (
        <div
          style={{
            border: "1px solid rgba(0,255,136,0.15)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* Preview + copy actions header */}
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid rgba(0,255,136,0.1)",
              backgroundColor: "rgba(0,255,136,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "0.68rem",
                color: "var(--terminal-green)",
              }}
            >
              {fileName}
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={() => copyWith("url", dataUrl)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: monoFont,
                  fontSize: "0.68rem",
                  padding: "4px 9px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  border: copyStates.url
                    ? "1px solid rgba(0,255,136,0.5)"
                    : "1px solid rgba(88,166,255,0.2)",
                  background: copyStates.url
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(88,166,255,0.05)",
                  color: copyStates.url
                    ? "var(--terminal-green)"
                    : "var(--code-comment)",
                  transition: "all 0.15s",
                }}
              >
                {copyStates.url ? <Check size={11} /> : <Copy size={11} />}
                Copy data URL
              </button>
              <button
                onClick={() => copyWith("img", imgTag)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: monoFont,
                  fontSize: "0.68rem",
                  padding: "4px 9px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  border: copyStates.img
                    ? "1px solid rgba(0,255,136,0.5)"
                    : "1px solid rgba(88,166,255,0.2)",
                  background: copyStates.img
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(88,166,255,0.05)",
                  color: copyStates.img
                    ? "var(--terminal-green)"
                    : "var(--code-comment)",
                  transition: "all 0.15s",
                }}
              >
                {copyStates.img ? <Check size={11} /> : <Copy size={11} />}
                Copy as &lt;img&gt;
              </button>
              <button
                onClick={() => copyWith("css", cssVal)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: monoFont,
                  fontSize: "0.68rem",
                  padding: "4px 9px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  border: copyStates.css
                    ? "1px solid rgba(0,255,136,0.5)"
                    : "1px solid rgba(88,166,255,0.2)",
                  background: copyStates.css
                    ? "rgba(0,255,136,0.08)"
                    : "rgba(88,166,255,0.05)",
                  color: copyStates.css
                    ? "var(--terminal-green)"
                    : "var(--code-comment)",
                  transition: "all 0.15s",
                }}
              >
                {copyStates.css ? <Check size={11} /> : <Copy size={11} />}
                Copy as CSS bg
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
            }}
          >
            {/* Image preview */}
            <div
              style={{
                borderRight: "1px solid rgba(0,255,136,0.1)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt={fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "140px",
                  borderRadius: "4px",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Base64 output */}
            <pre
              style={{
                margin: 0,
                padding: "12px",
                fontFamily: monoFont,
                fontSize: "0.72rem",
                color: "var(--terminal-green)",
                lineHeight: "1.6",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "200px",
                overflowY: "auto",
                background: "rgba(10,14,26,0.8)",
              }}
            >
              {dataUrl}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── JWT tab ───────────────────────────────────────────────────────────────────

function JwtTab() {
  const [input, setInput] = useState("");

  const parsed = (() => {
    if (!input.trim()) return null;
    const parts = input.trim().split(".");
    if (parts.length !== 3) return { error: "Not a valid JWT — must have 3 parts separated by dots" };
    try {
      const header = decodeJwtPart(parts[0]);
      const payload = decodeJwtPart(parts[1]) as Record<string, unknown>;
      return { header, payload, signature: parts[2] };
    } catch {
      return { error: "Failed to decode — invalid Base64 or JSON in token" };
    }
  })();

  const expiry = (() => {
    if (!parsed || "error" in parsed) return null;
    const exp = (parsed.payload as Record<string, unknown>).exp;
    if (typeof exp !== "number") return null;
    return formatExpiry(exp);
  })();

  const partColor = (label: string) => {
    if (label === "Header") return "#58a6ff";
    if (label === "Payload") return "var(--terminal-green)";
    return "#ff7b72";
  };

  const renderPart = (label: string, data: unknown) => (
    <div
      key={label}
      style={{
        border: `1px solid ${label === "Header" ? "rgba(88,166,255,0.2)" : label === "Payload" ? "rgba(0,255,136,0.2)" : "rgba(255,123,114,0.2)"}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: `1px solid ${label === "Header" ? "rgba(88,166,255,0.12)" : label === "Payload" ? "rgba(0,255,136,0.12)" : "rgba(255,123,114,0.12)"}`,
          backgroundColor:
            label === "Header"
              ? "rgba(88,166,255,0.05)"
              : label === "Payload"
                ? "rgba(0,255,136,0.05)"
                : "rgba(255,123,114,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: monoFont,
            fontSize: "0.68rem",
            color: partColor(label),
            letterSpacing: "0.06em",
            fontWeight: 700,
          }}
        >
          {label}
        </span>
        {label === "Payload" && expiry && (
          <span
            style={{
              fontFamily: monoFont,
              fontSize: "0.65rem",
              padding: "2px 8px",
              borderRadius: "3px",
              border: `1px solid ${expiry.expired ? "rgba(255,123,114,0.3)" : "rgba(0,255,136,0.3)"}`,
              color: expiry.expired ? "#ff7b72" : "var(--terminal-green)",
              background: expiry.expired
                ? "rgba(255,123,114,0.06)"
                : "rgba(0,255,136,0.06)",
            }}
          >
            {expiry.label}
          </span>
        )}
        <CopyButton text={JSON.stringify(data, null, 2)} />
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px 14px",
          fontFamily: monoFont,
          fontSize: "0.76rem",
          color: partColor(label),
          background: "rgba(10,14,26,0.8)",
          lineHeight: "1.7",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Token input */}
      <div
        style={{
          border: "1px solid rgba(88,166,255,0.15)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "6px 12px",
            borderBottom: "1px solid rgba(88,166,255,0.1)",
            backgroundColor: "rgba(88,166,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Key size={12} style={{ color: "#58a6ff", opacity: 0.7 }} />
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "0.65rem",
                color: "var(--code-comment)",
                letterSpacing: "0.08em",
              }}
            >
              JWT TOKEN
            </span>
          </div>
          {input && (
            <button
              onClick={() => setInput("")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: monoFont,
                fontSize: "0.65rem",
                padding: "3px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                border: "1px solid rgba(255,123,114,0.2)",
                background: "rgba(255,123,114,0.04)",
                color: "var(--code-comment)",
              }}
            >
              <Trash2 size={10} />
              Clear
            </button>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a JWT token here... e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px",
            background: "rgba(10,14,26,0.8)",
            border: "none",
            outline: "none",
            resize: "vertical",
            fontFamily: monoFont,
            fontSize: "0.78rem",
            color: "#e6edf3",
            lineHeight: "1.6",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Parse error */}
      {parsed && "error" in parsed && (
        <div
          style={{
            fontFamily: monoFont,
            fontSize: "0.78rem",
            color: "#ff7b72",
            padding: "10px 14px",
            border: "1px solid rgba(255,123,114,0.2)",
            borderRadius: "7px",
            background: "rgba(255,123,114,0.04)",
          }}
        >
          {parsed.error}
        </div>
      )}

      {/* Decoded parts */}
      {parsed && !("error" in parsed) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {renderPart("Header", parsed.header)}
          {renderPart("Payload", parsed.payload)}
          {/* Signature */}
          <div
            style={{
              border: "1px solid rgba(255,123,114,0.2)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                borderBottom: "1px solid rgba(255,123,114,0.12)",
                backgroundColor: "rgba(255,123,114,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.68rem",
                  color: "#ff7b72",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                Signature
              </span>
              <CopyButton text={parsed.signature} />
            </div>
            <pre
              style={{
                margin: 0,
                padding: "10px 14px",
                fontFamily: monoFont,
                fontSize: "0.74rem",
                color: "#ff7b72",
                background: "rgba(10,14,26,0.8)",
                lineHeight: "1.6",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              {parsed.signature}
            </pre>
            <div
              style={{
                padding: "6px 14px",
                borderTop: "1px solid rgba(255,123,114,0.1)",
                fontFamily: monoFont,
                fontSize: "0.63rem",
                color: "var(--code-comment)",
                opacity: 0.5,
                background: "rgba(10,14,26,0.8)",
              }}
            >
              Signature cannot be verified client-side without the secret key
            </div>
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {!parsed && (
        <div
          style={{
            fontFamily: monoFont,
            fontSize: "0.76rem",
            color: "var(--code-comment)",
            opacity: 0.4,
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          Paste a JWT token above to decode its parts
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "urlsafe", label: "URL Safe" },
  { id: "image", label: "Image" },
  { id: "jwt", label: "JWT Decode" },
];

export default function Base64Client() {
  const [activeTab, setActiveTab] = useState<TabId>("text");

  return (
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
          base64 — encoder/decoder
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
        {activeTab === "text" && <TextTab />}
        {activeTab === "urlsafe" && <TextTab urlSafe />}
        {activeTab === "image" && <ImageTab />}
        {activeTab === "jwt" && <JwtTab />}
      </div>
    </div>
  );
}
