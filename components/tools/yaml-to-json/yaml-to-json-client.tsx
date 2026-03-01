"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Trash2,
  ArrowLeftRight,
  Download,
  Upload,
  ShieldCheck,
  AlertCircle,
  FileCode,
  ChevronRight,
} from "lucide-react";
import * as yaml from "js-yaml";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

// ── helpers ───────────────────────────────────────────────────────────────────

type Direction = "yaml2json" | "json2yaml";
type Indent = 2 | 4;

const SAMPLE_YAML = `# YAML to JSON sample
server:
  host: localhost
  port: 8080
  ssl: true

database:
  engine: postgresql
  name: myapp_db
  credentials:
    user: admin
    password: s3cr3t

features:
  - name: auth
    enabled: true
  - name: cache
    enabled: false
    ttl: 300

meta:
  version: "1.2.0"
  updated: 2026-03-01
`;

const SAMPLE_JSON = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "engine": "postgresql",
    "name": "myapp_db",
    "credentials": {
      "user": "admin",
      "password": "s3cr3t"
    }
  },
  "features": [
    { "name": "auth", "enabled": true },
    { "name": "cache", "enabled": false, "ttl": 300 }
  ],
  "meta": {
    "version": "1.2.0",
    "updated": "2026-03-01"
  }
}`;

interface ConvertResult {
  output: string;
  error: string | null;
  lineCount: number;
  charCount: number;
}

function convert(input: string, direction: Direction, indent: Indent): ConvertResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: "", error: null, lineCount: 0, charCount: 0 };
  }

  try {
    if (direction === "yaml2json") {
      const parsed = yaml.load(trimmed);
      if (parsed === undefined || parsed === null) {
        return { output: "null", error: null, lineCount: 1, charCount: 4 };
      }
      const output = JSON.stringify(parsed, null, indent);
      return {
        output,
        error: null,
        lineCount: output.split("\n").length,
        charCount: output.length,
      };
    } else {
      const parsed = JSON.parse(trimmed);
      const output = yaml.dump(parsed, {
        indent,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });
      return {
        output,
        error: null,
        lineCount: output.split("\n").length,
        charCount: output.length,
      };
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e);
    return { output: "", error: err, lineCount: 0, charCount: 0 };
  }
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

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        border: `1px solid ${copied ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "5px",
        backgroundColor: copied ? "rgba(0,255,136,0.08)" : "transparent",
        color: copied ? "var(--terminal-green)" : "var(--comment-gray)",
        fontFamily: monoFont,
        fontSize: "0.7rem",
        cursor: text ? "pointer" : "not-allowed",
        opacity: text ? 1 : 0.4,
        transition: "all 0.15s",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function SegBtn({
  active,
  onClick,
  children,
  color = "green",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "green" | "blue";
}) {
  const accent =
    color === "blue"
      ? { bg: "rgba(88,166,255,0.12)", border: "rgba(88,166,255,0.35)", text: "var(--electric-blue)" }
      : { bg: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.35)", text: "var(--terminal-green)" };
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 13px",
        fontFamily: monoFont,
        fontSize: "0.72rem",
        border: active ? `1px solid ${accent.border}` : "1px solid transparent",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.15s",
        backgroundColor: active ? accent.bg : "transparent",
        color: active ? accent.text : "var(--comment-gray)",
      }}
    >
      {children}
    </button>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--comment-gray)", opacity: 0.45 }}>
        {label}:
      </span>
      <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--comment-gray)", opacity: 0.7 }}>
        {value}
      </span>
    </div>
  );
}

// ── Highlighted output panel ──────────────────────────────────────────────────

function OutputPanel({
  value,
  direction,
  error,
}: {
  value: string;
  direction: Direction;
  error: string | null;
}) {
  const isJson = direction === "yaml2json";

  if (error) {
    return (
      <div
        style={{
          flex: 1,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "14px 16px",
            border: "1px solid rgba(255,80,80,0.25)",
            borderRadius: "6px",
            backgroundColor: "rgba(255,80,80,0.05)",
          }}
        >
          <AlertCircle size={14} style={{ color: "#ff5f56", flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: "0.7rem",
                color: "#ff5f56",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              Parse Error
            </p>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: "0.68rem",
                color: "rgba(255,95,86,0.8)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: "0.75rem",
            color: "var(--comment-gray)",
            opacity: 0.3,
            textAlign: "center",
          }}
        >
          {`// output will appear here`}
        </p>
      </div>
    );
  }

  // Render with syntax coloring
  const lines = value.split("\n");

  function colorizeJsonLine(line: string): React.ReactNode {
    // Simple JSON token coloring
    const parts: React.ReactNode[] = [];
    let i = 0;
    const chars = line;

    while (i < chars.length) {
      // String key
      if (chars[i] === '"') {
        const end = chars.indexOf('"', i + 1);
        if (end !== -1) {
          const str = chars.slice(i, end + 1);
          const after = chars.slice(end + 1).trimStart();
          const isKey = after.startsWith(":");
          parts.push(
            <span key={i} style={{ color: isKey ? "var(--electric-blue)" : "#e6db74" }}>
              {str}
            </span>
          );
          i = end + 1;
          continue;
        }
      }
      // Numbers
      if (/\d/.test(chars[i]) || (chars[i] === "-" && /\d/.test(chars[i + 1] ?? ""))) {
        let num = "";
        while (i < chars.length && /[\d.eE+\-]/.test(chars[i])) {
          num += chars[i++];
        }
        parts.push(<span key={`n${i}`} style={{ color: "#ae81ff" }}>{num}</span>);
        continue;
      }
      // Booleans / null
      const rest = chars.slice(i);
      const kw = ["true", "false", "null"].find((k) => rest.startsWith(k));
      if (kw) {
        parts.push(
          <span key={`k${i}`} style={{ color: kw === "null" ? "#f92672" : "#66d9e8" }}>
            {kw}
          </span>
        );
        i += kw.length;
        continue;
      }
      // Punctuation
      if ("{}[]:,".includes(chars[i])) {
        parts.push(
          <span key={`p${i}`} style={{ color: "rgba(255,255,255,0.35)" }}>
            {chars[i]}
          </span>
        );
        i++;
        continue;
      }
      parts.push(<span key={`x${i}`} style={{ color: "var(--comment-gray)" }}>{chars[i]}</span>);
      i++;
    }
    return parts;
  }

  function colorizeYamlLine(line: string): React.ReactNode {
    // Comment
    if (line.trimStart().startsWith("#")) {
      return <span style={{ color: "var(--comment-gray)", opacity: 0.5 }}>{line}</span>;
    }
    // Key: value
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx);
      const val = line.slice(colonIdx + 1);
      return (
        <>
          <span style={{ color: "var(--electric-blue)" }}>{key}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>:</span>
          <span style={{ color: colorYamlValue(val) }}>{val}</span>
        </>
      );
    }
    // List item
    if (line.trimStart().startsWith("- ")) {
      const indent = line.length - line.trimStart().length;
      return (
        <>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>{line.slice(0, indent)}</span>
          <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>{"- "}</span>
          <span style={{ color: colorYamlValue(line.trimStart().slice(2)) }}>
            {line.trimStart().slice(2)}
          </span>
        </>
      );
    }
    return <span style={{ color: "var(--comment-gray)" }}>{line}</span>;
  }

  function colorYamlValue(val: string): string {
    const v = val.trim();
    if (v === "true" || v === "false") return "#66d9e8";
    if (v === "null" || v === "~") return "#f92672";
    if (!isNaN(Number(v)) && v !== "") return "#ae81ff";
    if (v.startsWith('"') || v.startsWith("'")) return "#e6db74";
    return "rgba(255,255,255,0.8)";
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "auto",
        padding: "0",
        display: "flex",
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "fit-content" }}>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx}>
              <td
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.78rem",
                  lineHeight: "1.7",
                  color: "var(--comment-gray)",
                  opacity: 0.3,
                  userSelect: "none",
                  paddingLeft: "16px",
                  paddingRight: "12px",
                  textAlign: "right",
                  verticalAlign: "top",
                  minWidth: "36px",
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                  whiteSpace: "nowrap",
                }}
              >
                {idx + 1}
              </td>
              <td
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.78rem",
                  lineHeight: "1.7",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  verticalAlign: "top",
                  whiteSpace: "pre",
                }}
              >
                {isJson ? colorizeJsonLine(line) : colorizeYamlLine(line)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function YamlToJsonClient() {
  const [direction, setDirection] = useState<Direction>("yaml2json");
  const [indent, setIndent] = useState<Indent>(2);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const result = convert(input, direction, indent);

  const swapDirection = useCallback(() => {
    setDirection((d) => {
      const next: Direction = d === "yaml2json" ? "json2yaml" : "yaml2json";
      // If there's valid output, swap it into input
      if (result.output && !result.error) {
        setInput(result.output);
      }
      return next;
    });
  }, [result]);

  const loadSample = () => {
    setInput(direction === "yaml2json" ? SAMPLE_YAML : SAMPLE_JSON);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setInput(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const downloadOutput = () => {
    if (!result.output) return;
    const ext = direction === "yaml2json" ? "json" : "yaml";
    const mime = direction === "yaml2json" ? "application/json" : "text/yaml";
    const blob = new Blob([result.output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const inputLabel = direction === "yaml2json" ? "YAML Input" : "JSON Input";
  const outputLabel = direction === "yaml2json" ? "JSON Output" : "YAML Output";
  const inputLang = direction === "yaml2json" ? "yaml" : "json";
  const outputLang = direction === "yaml2json" ? "json" : "yaml";

  const inputLineCount = input ? input.split("\n").length : 0;
  const inputCharCount = input.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Security badge */}
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
        <ShieldCheck size={12} style={{ color: "var(--terminal-green)", flexShrink: 0 }} />
        <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "var(--code-comment)" }}>
          100% client-side — your data never leaves the browser
        </span>
      </div>

      {/* Main tool card */}
      <div
        style={{
          border: "1px solid rgba(0,255,136,0.15)",
          borderRadius: "10px",
          backgroundColor: "rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* ── Title bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid rgba(0,255,136,0.1)",
            backgroundColor: "rgba(0,255,136,0.03)",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <WindowDots />
          <span
            style={{
              fontFamily: monoFont,
              fontSize: "0.68rem",
              color: "var(--comment-gray)",
              opacity: 0.6,
            }}
          >
            {direction === "yaml2json" ? "yaml → json" : "json → yaml"}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Sample */}
            <button
              onClick={loadSample}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                border: "1px solid rgba(88,166,255,0.2)",
                borderRadius: "5px",
                backgroundColor: "rgba(88,166,255,0.05)",
                color: "var(--electric-blue)",
                fontFamily: monoFont,
                fontSize: "0.68rem",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <FileCode size={12} />
              Sample
            </button>
            {/* Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                border: "1px solid rgba(88,166,255,0.2)",
                borderRadius: "5px",
                backgroundColor: "rgba(88,166,255,0.05)",
                color: "var(--electric-blue)",
                fontFamily: monoFont,
                fontSize: "0.68rem",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Upload size={12} />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml,.json,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
            {/* Download */}
            <button
              onClick={downloadOutput}
              disabled={!result.output}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                border: "1px solid rgba(88,166,255,0.2)",
                borderRadius: "5px",
                backgroundColor: "rgba(88,166,255,0.05)",
                color: "var(--electric-blue)",
                fontFamily: monoFont,
                fontSize: "0.68rem",
                cursor: result.output ? "pointer" : "not-allowed",
                opacity: result.output ? 1 : 0.35,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Download size={12} />
              Download
            </button>
            {/* Clear */}
            <button
              onClick={() => setInput("")}
              disabled={!input}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "5px",
                backgroundColor: "transparent",
                color: "var(--comment-gray)",
                fontFamily: monoFont,
                fontSize: "0.68rem",
                cursor: input ? "pointer" : "not-allowed",
                opacity: input ? 1 : 0.35,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        </div>

        {/* ── Direction + Indent controls ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            padding: "12px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            backgroundColor: "rgba(0,0,0,0.15)",
            flexWrap: "wrap",
          }}
        >
          {/* Direction */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "0.65rem",
                color: "var(--comment-gray)",
                opacity: 0.5,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              // Mode
            </span>
            <div
              style={{
                display: "flex",
                gap: "3px",
                padding: "3px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <SegBtn
                active={direction === "yaml2json"}
                onClick={() => { setDirection("yaml2json"); setInput(""); }}
              >
                YAML → JSON
              </SegBtn>
              <SegBtn
                active={direction === "json2yaml"}
                onClick={() => { setDirection("json2yaml"); setInput(""); }}
              >
                JSON → YAML
              </SegBtn>
            </div>
          </div>

          {/* Swap with transfer */}
          <button
            onClick={swapDirection}
            title="Swap direction and transfer output to input"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 12px",
              border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: "5px",
              backgroundColor: "rgba(0,255,136,0.05)",
              color: "var(--terminal-green)",
              fontFamily: monoFont,
              fontSize: "0.68rem",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <ArrowLeftRight size={12} />
            Swap &amp; Transfer
          </button>

          {/* Indent (only for JSON output) */}
          {direction === "yaml2json" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.65rem",
                  color: "var(--comment-gray)",
                  opacity: 0.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                // Indent
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "3px",
                  padding: "3px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <SegBtn active={indent === 2} onClick={() => setIndent(2)}>2 spaces</SegBtn>
                <SegBtn active={indent === 4} onClick={() => setIndent(4)}>4 spaces</SegBtn>
              </div>
            </div>
          )}
        </div>

        {/* ── Panels ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: "440px",
          }}
        >
          {/* Input panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: "rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <ChevronRight size={12} style={{ color: "var(--terminal-green)", opacity: 0.6 }} />
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.68rem",
                    color: "var(--comment-gray)",
                    fontWeight: 700,
                  }}
                >
                  {inputLabel}
                </span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.6rem",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(88,166,255,0.1)",
                    color: "var(--electric-blue)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {inputLang}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {input && (
                  <>
                    <StatBadge label="lines" value={inputLineCount} />
                    <StatBadge label="chars" value={inputCharCount} />
                  </>
                )}
              </div>
            </div>

            {/* Textarea with drag & drop */}
            <div
              style={{
                flex: 1,
                position: "relative",
                backgroundColor: dragOver ? "rgba(0,255,136,0.03)" : "transparent",
                transition: "background-color 0.15s",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {dragOver && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                >
                  <p
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.82rem",
                      color: "var(--terminal-green)",
                      opacity: 0.7,
                    }}
                  >
                    Drop file to load
                  </p>
                </div>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`// Paste ${inputLang.toUpperCase()} here or drag & drop a file...`}
                spellCheck={false}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "400px",
                  padding: "14px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontFamily: monoFont,
                  fontSize: "0.78rem",
                  lineHeight: "1.7",
                  color: "rgba(255,255,255,0.82)",
                  caretColor: "var(--terminal-green)",
                  boxSizing: "border-box",
                  opacity: dragOver ? 0.2 : 1,
                  transition: "opacity 0.15s",
                }}
              />
            </div>
          </div>

          {/* Output panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: "rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <ChevronRight size={12} style={{ color: "var(--terminal-green)", opacity: 0.6 }} />
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.68rem",
                    color: "var(--comment-gray)",
                    fontWeight: 700,
                  }}
                >
                  {outputLabel}
                </span>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.6rem",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(0,255,136,0.1)",
                    color: "var(--terminal-green)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {outputLang}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {result.output && !result.error && (
                  <>
                    <StatBadge label="lines" value={result.lineCount} />
                    <StatBadge label="chars" value={result.charCount} />
                  </>
                )}
                <CopyBtn text={result.output} label="Copy" />
              </div>
            </div>

            {/* Output content */}
            <OutputPanel
              value={result.output}
              direction={direction}
              error={result.error}
            />
          </div>
        </div>

        {/* ── Status bar ── */}
        {(result.output || result.error) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {result.error ? (
                <>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#ff5f56",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "#ff5f56" }}>
                    Invalid {inputLang.toUpperCase()}
                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--terminal-green)",
                      flexShrink: 0,
                      boxShadow: "0 0 6px var(--terminal-green)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.65rem",
                      color: "var(--terminal-green)",
                      opacity: 0.8,
                    }}
                  >
                    Converted successfully
                  </span>
                </>
              )}
            </div>
            <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--comment-gray)", opacity: 0.4 }}>
              js-yaml 4.1 · {direction === "yaml2json" ? `indent: ${indent}` : "yaml dump"}
            </span>
          </div>
        )}
      </div>

      {/* ── Quick reference ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "10px",
          marginTop: "4px",
        }}
      >
        {[
          {
            title: "YAML → JSON",
            rows: [
              ["key: value", '{ "key": "value" }'],
              ["list:\\n  - a\\n  - b", '["a", "b"]'],
              ["nested:\\n  x: 1", '{ "nested": { "x": 1 } }'],
              ["true / false / null", "true / false / null"],
            ],
          },
          {
            title: "YAML Types",
            rows: [
              ["String", "bare word or quoted"],
              ["Number", "42, 3.14, 1e5"],
              ["Boolean", "true, false, yes, no"],
              ["Null", "null, ~, (empty)"],
            ],
          },
          {
            title: "Common Pitfalls",
            rows: [
              ["Tabs", "Use spaces, never tabs"],
              ["Indent consistency", "All siblings must align"],
              ["Special chars", "Quote strings with : # &"],
              ["Trailing commas", "Not valid in JSON"],
            ],
          },
        ].map(({ title, rows }) => (
          <div
            key={title}
            style={{
              border: "1px solid rgba(88,166,255,0.1)",
              borderRadius: "7px",
              backgroundColor: "rgba(88,166,255,0.02)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                borderBottom: "1px solid rgba(88,166,255,0.08)",
                backgroundColor: "rgba(88,166,255,0.05)",
                fontFamily: monoFont,
                fontSize: "0.63rem",
                color: "var(--electric-blue)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {`// ${title}`}
            </div>
            <div>
              {rows.map(([l, r], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "7px 12px",
                    borderBottom:
                      i < rows.length - 1 ? "1px solid rgba(88,166,255,0.04)" : undefined,
                    alignItems: "flex-start",
                  }}
                >
                  <code
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.68rem",
                      color: "var(--terminal-green)",
                      opacity: 0.8,
                      flex: 1,
                      whiteSpace: "pre",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {l}
                  </code>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.68rem",
                      color: "var(--comment-gray)",
                      opacity: 0.6,
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
