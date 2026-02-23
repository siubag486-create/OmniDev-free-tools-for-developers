"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Check,
  Trash2,
  Minimize2,
  AlignLeft,
  AlertCircle,
  CheckCircle2,
  Upload,
  Wand2,
} from "lucide-react";
import { jsonrepair } from "jsonrepair";

type FormatMode = "format" | "minify";
type Status = "idle" | "valid" | "error" | "fixed";

interface FixItem {
  label: string;
  description: string;
}

interface JsonState {
  input: string;
  output: string;
  highlighted: string;
  mode: FormatMode;
  status: Status;
  errorMessage: string | null;
  fixItems: FixItem[];
  copied: boolean;
  inputFocused: boolean;
  isDragging: boolean;
  cannotFix: boolean;
}

const INITIAL_STATE: JsonState = {
  input: "",
  output: "",
  highlighted: "",
  mode: "format",
  status: "idle",
  errorMessage: null,
  fixItems: [],
  copied: false,
  inputFocused: false,
  isDragging: false,
  cannotFix: false,
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightJson(json: string): string {
  const escaped = escapeHtml(json);
  return escaped
    .replace(
      /(&quot;)((?:[^&]|&(?!quot;))*?)(&quot;)(\s*:)/g,
      '<span style="color:var(--electric-blue)">$1$2$3</span>$4'
    )
    .replace(
      /(&quot;)((?:[^&]|&(?!quot;))*?)(&quot;)(?!\s*:)/g,
      '<span style="color:var(--code-yellow)">$1$2$3</span>'
    )
    .replace(
      /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
      (match, num) =>
        match.replace(
          num,
          `<span style="color:var(--code-orange)">${num}</span>`
        )
    )
    .replace(
      /:\s*(true|false)\b/g,
      (match, bool) =>
        match.replace(
          bool,
          `<span style="color:var(--code-red)">${bool}</span>`
        )
    )
    .replace(
      /:\s*(null)\b/g,
      (match, n) =>
        match.replace(
          n,
          `<span style="color:var(--code-comment)">${n}</span>`
        )
    )
    .replace(
      /([{}[\]])/g,
      '<span style="color:var(--terminal-green);opacity:0.65">$1</span>'
    );
}

function parseJsonError(err: unknown, raw: string): string {
  const msg = err instanceof Error ? err.message : "Invalid JSON";
  const lineColMatch = msg.match(/at line (\d+) column (\d+)/);
  if (lineColMatch) {
    return `Syntax error — line ${lineColMatch[1]}, col ${lineColMatch[2]}`;
  }
  const posMatch = msg.match(/at position (\d+)/);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const before = raw.slice(0, pos);
    const line = (before.match(/\n/g) ?? []).length + 1;
    const lastNewline = before.lastIndexOf("\n");
    const col = pos - lastNewline;
    return `Syntax error — line ${line}, col ${col}`;
  }
  return msg.replace(/ in JSON at position \d+/, "").replace(/\u2019/g, "'");
}

function computeStats(text: string) {
  if (!text) return { chars: 0, lines: 0, kb: "0.00" };
  return {
    chars: text.length,
    lines: text.split("\n").length,
    kb: (new TextEncoder().encode(text).byteLength / 1024).toFixed(2),
  };
}

// 원본과 수정본을 비교해서 어떤 오류가 수정됐는지 감지
function detectFixes(original: string, repaired: string): FixItem[] {
  const items: FixItem[] = [];

  // 단일 따옴표 → 이중 따옴표
  if (/(?<![\\])'/.test(original) && !/'/.test(repaired)) {
    items.push({
      label: "Single quotes converted",
      description: "Single quotes replaced with double quotes",
    });
  }

  // 후행 쉼표 (trailing comma)
  if (/,\s*[}\]]/.test(original)) {
    items.push({
      label: "Trailing commas removed",
      description: "Commas before } or ] were removed",
    });
  }

  // 주석 제거 (// or /* */)
  if (/\/\/[^\n]*|\/\*[\s\S]*?\*\//.test(original)) {
    items.push({
      label: "Comments removed",
      description: "// and /* */ style comments were stripped",
    });
  }

  // 따옴표 없는 key (unquoted keys)
  if (/[{,]\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/.test(original)) {
    // 원본에 따옴표 없는 key가 있고 수정본에는 없으면
    const unquotedKeyRx = /[{,]\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
    const originalMatches = original.match(unquotedKeyRx) ?? [];
    const repairedMatches = repaired.match(unquotedKeyRx) ?? [];
    if (originalMatches.length > repairedMatches.length) {
      items.push({
        label: "Unquoted keys quoted",
        description: "Object keys without quotes were wrapped in double quotes",
      });
    }
  }

  // 누락된 쉼표 (문자 수 비교로 대략 감지)
  const originalCommas = (original.match(/,/g) ?? []).length;
  const repairedCommas = (repaired.match(/,/g) ?? []).length;
  if (repairedCommas > originalCommas) {
    items.push({
      label: "Missing commas inserted",
      description: `${repairedCommas - originalCommas} missing comma(s) were added between elements`,
    });
  }

  // 따옴표 없는 string 값 (unquoted string values)
  if (/:\s*(?!true\b|false\b|null\b|-?\d)([a-zA-Z][a-zA-Z0-9_]*)/.test(original)) {
    const unquotedValRx = /:\s*(?!true\b|false\b|null\b|-?\d)([a-zA-Z][a-zA-Z0-9_]*)/g;
    const origValMatches = original.match(unquotedValRx) ?? [];
    const repValMatches = repaired.match(unquotedValRx) ?? [];
    if (origValMatches.length > repValMatches.length) {
      items.push({
        label: "Unquoted string values quoted",
        description: "String values without quotes were wrapped in double quotes",
      });
    }
  }

  // 따옴표 짝이 맞지 않는 경우 — 원본의 " 갯수가 홀수
  const origQuotes = (original.match(/(?<!\\)"/g) ?? []).length;
  if (origQuotes % 2 !== 0) {
    items.push({
      label: "Unclosed quotes fixed",
      description: "Missing closing quote mark(s) were added",
    });
  }

  // 괄호/브래킷 짝이 맞지 않는 경우
  const opens = (original.match(/[{[]/g) ?? []).length;
  const closes = (original.match(/[}\]]/g) ?? []).length;
  if (opens !== closes) {
    items.push({
      label: "Mismatched brackets fixed",
      description: `${Math.abs(opens - closes)} missing ${opens > closes ? "closing" : "opening"} bracket(s) were added`,
    });
  }

  // 감지된 항목이 없지만 실제로 수정이 됐을 경우
  if (items.length === 0 && original.trim() !== repaired.trim()) {
    items.push({
      label: "Syntax errors corrected",
      description: "JSON structure was repaired to be valid",
    });
  }

  return items;
}

function StatsBar({ text }: { text: string }) {
  const stats = computeStats(text);
  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {[
        `${stats.chars.toLocaleString()} chars`,
        `${stats.lines} lines`,
        `${stats.kb} KB`,
      ].map((label) => (
        <span
          key={label}
          style={{
            color: "var(--code-comment)",
            fontSize: "0.65rem",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function WindowDots() {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      {["#ff5f56", "#ffbd2e", "#27c93f"].map((color) => (
        <div
          key={color}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: color,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

const monoFont = "var(--font-geist-mono), monospace";

const toolbarBtnBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontFamily: monoFont,
  fontSize: "0.75rem",
  padding: "5px 12px",
  borderRadius: "5px",
  cursor: "pointer",
  border: "1px solid transparent",
  transition: "all 0.15s ease",
  lineHeight: 1,
};

export default function JsonFormatterClient() {
  const [state, setState] = useState<JsonState>(INITIAL_STATE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<FormatMode>("format");

  useEffect(() => {
    modeRef.current = state.mode;
  }, [state.mode]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function processJson(raw: string, mode: FormatMode) {
    if (!raw.trim()) {
      setState((prev) => ({
        ...prev,
        output: "",
        highlighted: "",
        status: "idle",
        errorMessage: null,
        fixItems: [],
        cannotFix: false,
      }));
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const formatted =
        mode === "format"
          ? JSON.stringify(parsed, null, 2)
          : JSON.stringify(parsed);
      const highlighted = highlightJson(formatted);
      setState((prev) => ({
        ...prev,
        output: formatted,
        highlighted,
        status: "valid",
        errorMessage: null,
        fixItems: [],
        cannotFix: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        output: "",
        highlighted: "",
        status: "error",
        errorMessage: parseJsonError(err, raw),
        fixItems: [],
        cannotFix: false,
      }));
    }
  }

  function handleAutoFix() {
    if (!state.input.trim()) return;
    try {
      const repaired = jsonrepair(state.input);
      const fixes = detectFixes(state.input, repaired);
      const parsed = JSON.parse(repaired);
      const formatted =
        state.mode === "format"
          ? JSON.stringify(parsed, null, 2)
          : JSON.stringify(parsed);
      const highlighted = highlightJson(formatted);
      setState((prev) => ({
        ...prev,
        input: repaired,
        output: formatted,
        highlighted,
        status: "fixed",
        errorMessage: null,
        fixItems: fixes,
        cannotFix: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, cannotFix: true }));
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setState((prev) => ({ ...prev, input: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setState((prev) => ({
        ...prev,
        input: value,
        output: "",
        highlighted: "",
        status: "idle",
        errorMessage: null,
        fixItems: [],
        cannotFix: false,
      }));
      return;
    }
    debounceRef.current = setTimeout(() => {
      processJson(value, modeRef.current);
    }, 300);
  }

  function handleModeChange(newMode: FormatMode) {
    modeRef.current = newMode;
    setState((prev) => ({ ...prev, mode: newMode }));
    if (state.input.trim()) processJson(state.input, newMode);
  }

  async function handleCopy() {
    if (!state.output) return;
    await navigator.clipboard.writeText(state.output);
    setState((prev) => ({ ...prev, copied: true }));
    setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000);
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState({ ...INITIAL_STATE, mode: state.mode });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setState((prev) => ({ ...prev, isDragging: false }));
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      setState((prev) => ({ ...prev, input: text }));
      processJson(text, modeRef.current);
    };
    reader.readAsText(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setState((prev) => ({ ...prev, isDragging: true }));
  }

  function handleDragLeave() {
    setState((prev) => ({ ...prev, isDragging: false }));
  }

  const inputBorderColor = state.isDragging
    ? "rgba(0,255,136,0.6)"
    : state.inputFocused
    ? "rgba(0,255,136,0.35)"
    : "var(--terminal-border-bright)";

  const inputGlow = state.isDragging
    ? "0 0 0 1px rgba(0,255,136,0.3), 0 0 30px rgba(0,255,136,0.08)"
    : state.inputFocused
    ? "0 0 0 1px rgba(0,255,136,0.15), 0 0 18px rgba(0,255,136,0.05)"
    : "none";

  const activeMode: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "rgba(0,255,136,0.1)",
    border: "1px solid rgba(0,255,136,0.3)",
    color: "var(--terminal-green)",
  };

  const inactiveMode: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "transparent",
    border: "1px solid var(--terminal-border-bright)",
    color: "var(--code-comment)",
  };

  const actionBtn: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "transparent",
    border: "1px solid var(--terminal-border-bright)",
    color: "var(--code-comment)",
  };

  const isError = state.status === "error";
  const isFixed = state.status === "fixed";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => handleModeChange("format")}
            style={state.mode === "format" ? activeMode : inactiveMode}
          >
            <AlignLeft size={13} />
            Format
          </button>
          <button
            onClick={() => handleModeChange("minify")}
            style={state.mode === "minify" ? activeMode : inactiveMode}
          >
            <Minimize2 size={13} />
            Minify
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={handleCopy}
            disabled={!state.output}
            style={{
              ...actionBtn,
              opacity: state.output ? 1 : 0.35,
              cursor: state.output ? "pointer" : "default",
              color: state.copied ? "var(--terminal-green)" : "var(--code-comment)",
              borderColor: state.copied
                ? "rgba(0,255,136,0.3)"
                : "var(--terminal-border-bright)",
            }}
          >
            {state.copied ? <Check size={13} /> : <Copy size={13} />}
            {state.copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleClear}
            disabled={!state.input}
            style={{
              ...actionBtn,
              opacity: state.input ? 1 : 0.35,
              cursor: state.input ? "pointer" : "default",
            }}
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {state.status !== "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Main status row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: isFixed ? "6px 6px 0 0" : "6px",
              borderTop: `1px solid ${
                isError
                  ? "rgba(255,123,114,0.2)"
                  : isFixed
                  ? "rgba(88,166,255,0.25)"
                  : "rgba(0,255,136,0.18)"
              }`,
              borderLeft: `1px solid ${
                isError
                  ? "rgba(255,123,114,0.2)"
                  : isFixed
                  ? "rgba(88,166,255,0.25)"
                  : "rgba(0,255,136,0.18)"
              }`,
              borderRight: `1px solid ${
                isError
                  ? "rgba(255,123,114,0.2)"
                  : isFixed
                  ? "rgba(88,166,255,0.25)"
                  : "rgba(0,255,136,0.18)"
              }`,
              borderBottom: isFixed
                ? "1px solid rgba(88,166,255,0.1)"
                : `1px solid ${
                    isError
                      ? "rgba(255,123,114,0.2)"
                      : "rgba(0,255,136,0.18)"
                  }`,
              backgroundColor: isError
                ? "rgba(255,123,114,0.05)"
                : isFixed
                ? "rgba(88,166,255,0.06)"
                : "rgba(0,255,136,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: monoFont,
                fontSize: "0.78rem",
                color: isError
                  ? "var(--code-red)"
                  : isFixed
                  ? "var(--electric-blue)"
                  : "var(--terminal-green)",
              }}
            >
              {isError ? (
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
              ) : (
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
              )}
              <span>
                {isError
                  ? state.errorMessage
                  : isFixed
                  ? `Auto-fixed — ${state.fixItems.length} issue${state.fixItems.length !== 1 ? "s" : ""} corrected`
                  : "Valid JSON"}
              </span>
              {state.cannotFix && isError && (
                <span
                  style={{
                    color: "var(--code-comment)",
                    fontSize: "0.7rem",
                    marginLeft: "4px",
                  }}
                >
                  (Cannot auto-fix this error)
                </span>
              )}
            </div>

            {/* Auto-fix button — only when error */}
            {isError && (
              <button
                onClick={handleAutoFix}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: monoFont,
                  fontSize: "0.72rem",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  border: "1px solid rgba(88,166,255,0.35)",
                  backgroundColor: "rgba(88,166,255,0.08)",
                  color: "var(--electric-blue)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Wand2 size={12} />
                Auto-fix
              </button>
            )}
          </div>

          {/* Fix detail list — shown after auto-fix */}
          {isFixed && state.fixItems.length > 0 && (
            <div
              style={{
                borderRadius: "0 0 6px 6px",
                border: "1px solid rgba(88,166,255,0.25)",
                borderTop: "none",
                backgroundColor: "rgba(88,166,255,0.03)",
                overflow: "hidden",
              }}
            >
              {state.fixItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "10px",
                    padding: "6px 14px",
                    borderTop: i > 0 ? "1px solid rgba(88,166,255,0.08)" : undefined,
                  }}
                >
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.7rem",
                      color: "var(--electric-blue)",
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: "0.72rem",
                        color: "var(--electric-blue)",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: "0.67rem",
                        color: "var(--code-comment)",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-Pane — terminal window style */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: "12px",
          minHeight: "540px",
        }}
      >
        {/* INPUT pane */}
        <div
          style={{
            border: `1px solid ${inputBorderColor}`,
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: inputGlow,
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Terminal title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
              backgroundColor: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid var(--terminal-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <WindowDots />
              <span
                style={{
                  color: "var(--code-comment)",
                  fontSize: "0.68rem",
                  fontFamily: monoFont,
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                input.json
              </span>
            </div>
            <StatsBar text={state.input} />
          </div>

          {/* Textarea */}
          <div style={{ position: "relative", flex: 1, display: "flex" }}>
            <textarea
              value={state.input}
              onChange={handleInputChange}
              onFocus={() =>
                setState((prev) => ({ ...prev, inputFocused: true }))
              }
              onBlur={() =>
                setState((prev) => ({ ...prev, inputFocused: false }))
              }
              placeholder={'{\n  "paste": "your JSON here"\n}'}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                flex: 1,
                width: "100%",
                resize: "none",
                background: "var(--terminal-surface)",
                color: "var(--foreground)",
                fontFamily: monoFont,
                fontSize: "0.8rem",
                padding: "14px 16px",
                border: "none",
                outline: "none",
                lineHeight: "1.65",
                caretColor: "var(--terminal-green)",
              }}
            />
            {/* Drag overlay */}
            {state.isDragging && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,255,136,0.04)",
                  gap: "8px",
                  pointerEvents: "none",
                  borderTop: "1px dashed rgba(0,255,136,0.3)",
                }}
              >
                <Upload size={26} style={{ color: "var(--terminal-green)", opacity: 0.7 }} />
                <span
                  style={{
                    color: "var(--terminal-green)",
                    fontFamily: monoFont,
                    fontSize: "0.78rem",
                    opacity: 0.8,
                  }}
                >
                  Drop JSON file to load
                </span>
              </div>
            )}
          </div>

          {/* Drop hint footer */}
          {!state.input && !state.isDragging && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                borderTop: "1px solid var(--terminal-border)",
                backgroundColor: "var(--terminal-surface-2)",
              }}
            >
              <Upload size={11} style={{ color: "var(--code-comment)" }} />
              <span
                style={{
                  color: "var(--code-comment)",
                  fontSize: "0.65rem",
                  fontFamily: monoFont,
                }}
              >
                Or drag &amp; drop a .json file here
              </span>
            </div>
          )}
        </div>

        {/* OUTPUT pane */}
        <div
          style={{
            border: "1px solid var(--terminal-border-bright)",
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Terminal title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 14px",
              backgroundColor: "rgba(255,255,255,0.02)",
              borderBottom: "1px solid var(--terminal-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <WindowDots />
              <span
                style={{
                  color: "var(--code-comment)",
                  fontSize: "0.68rem",
                  fontFamily: monoFont,
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                output.json
              </span>
            </div>
            <StatsBar text={state.output} />
          </div>

          {/* Output content */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              backgroundColor: "var(--terminal-surface-2)",
              position: "relative",
            }}
          >
            {/* Scanlines overlay */}
            <div
              className="crt-scanlines"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 1,
                opacity: 0.4,
              }}
            />

            {isError ? (
              <div
                style={{
                  padding: "14px 16px",
                  color: "var(--code-comment)",
                  fontFamily: monoFont,
                  fontSize: "0.8rem",
                  lineHeight: "1.65",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Fix the error in the input to see the result.
              </div>
            ) : state.output ? (
              <pre
                style={{
                  padding: "14px 16px",
                  margin: 0,
                  fontSize: "0.8rem",
                  lineHeight: "1.65",
                  fontFamily: monoFont,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--foreground)",
                  position: "relative",
                  zIndex: 2,
                }}
                dangerouslySetInnerHTML={{ __html: state.highlighted }}
              />
            ) : (
              <div
                style={{
                  padding: "14px 16px",
                  color: "var(--code-comment)",
                  fontFamily: monoFont,
                  fontSize: "0.8rem",
                  opacity: 0.4,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Formatted output will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
