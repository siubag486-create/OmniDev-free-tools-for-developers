"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Download, Upload, X, ShieldCheck, Minus, AlignLeft, ChevronDown, Search } from "lucide-react";
import { format as sqlFormat } from "sql-formatter";
import type { SqlLanguage, KeywordCase, IndentStyle } from "sql-formatter";
import hljs from "highlight.js/lib/core";
import hljsSQL from "highlight.js/lib/languages/sql";
hljs.registerLanguage("sql", hljsSQL);

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

type Mode = "format" | "minify";

const DIALECTS: { id: SqlLanguage; label: string }[] = [
  { id: "sql",         label: "Standard SQL" },
  { id: "mysql",       label: "MySQL" },
  { id: "postgresql",  label: "PostgreSQL" },
  { id: "tsql",        label: "T-SQL (MSSQL)" },
  { id: "sqlite",      label: "SQLite" },
  { id: "mariadb",     label: "MariaDB" },
  { id: "bigquery",    label: "BigQuery" },
  { id: "spark",       label: "Spark SQL" },
  { id: "hive",        label: "Hive SQL" },
  { id: "plsql",       label: "PL/SQL (Oracle)" },
  { id: "snowflake",   label: "Snowflake" },
  { id: "redshift",    label: "Redshift" },
];

const KEYWORD_CASES: { id: KeywordCase; label: string }[] = [
  { id: "upper",    label: "UPPER" },
  { id: "lower",    label: "lower" },
  { id: "preserve", label: "Preserve" },
];

const INDENT_OPTIONS: { id: string; label: string }[] = [
  { id: "2",   label: "2 spaces" },
  { id: "4",   label: "4 spaces" },
  { id: "tab", label: "Tab" },
];

const SAMPLE_SQL = `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_spent DESC LIMIT 50;`;

// ─── Syntax highlighting (highlight.js — safe tokenizer, no regex pollution) ──
function highlightSQL(sql: string): string {
  try {
    return hljs.highlight(sql, { language: "sql" }).value;
  } catch {
    // fallback: escape and return plain text
    return sql.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

function getStats(sql: string) {
  const lines = sql ? sql.split("\n").length : 0;
  const chars = sql.length;
  const statements = sql ? (sql.match(/;/g) || []).length : 0;
  return { lines, chars, statements };
}

// ─── Dialect custom dropdown ─────────────────────────────────────────────────
function DialectSelect({ value, onChange }: { value: SqlLanguage; onChange: (v: SqlLanguage) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = DIALECTS.filter(d =>
    d.label.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = DIALECTS.find(d => d.id === value);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 220),
      });
    }
    setOpen(o => !o);
    setSearch("");
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const dropdown = document.getElementById("dialect-dropdown");
        if (!dropdown || !dropdown.contains(target)) {
          setOpen(false);
          setSearch("");
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const dropdown = open && typeof document !== "undefined" ? createPortal(
    <div
      id="dialect-dropdown"
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
        border: "1px solid rgba(0,255,136,0.2)",
        borderRadius: "8px",
        background: "#0d1117",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ padding: "8px", borderBottom: "1px solid rgba(0,255,136,0.08)", display: "flex", alignItems: "center", gap: "6px" }}>
        <Search size={12} style={{ color: "var(--code-comment)", opacity: 0.5, flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dialect..."
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontFamily: monoFont, fontSize: "0.72rem", color: "#e6edf3",
          }}
        />
      </div>
      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "12px 14px", fontFamily: monoFont, fontSize: "0.72rem", color: "var(--code-comment)", opacity: 0.5 }}>
            No results
          </div>
        ) : (
          filtered.map(d => (
            <button
              key={d.id}
              onClick={() => { onChange(d.id); setOpen(false); setSearch(""); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 14px", fontFamily: monoFont, fontSize: "0.72rem",
                border: "none", cursor: "pointer",
                background: d.id === value ? "rgba(0,255,136,0.08)" : "none",
                color: d.id === value ? "var(--terminal-green)" : "var(--code-comment)",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (d.id !== value) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (d.id !== value) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {d.label}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        onClick={openDropdown}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontFamily: monoFont, fontSize: "0.72rem", padding: "6px 10px",
          borderRadius: "6px", border: "1px solid rgba(0,255,136,0.2)",
          background: "rgba(0,0,0,0.4)", color: "var(--terminal-green)",
          outline: "none", cursor: "pointer", minWidth: "160px",
          justifyContent: "space-between",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected?.label ?? value}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {dropdown}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function WindowDots() {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      {(["#ff5f56", "#ffbd2e", "#27c93f"] as const).map(color => (
        <div key={color} style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, opacity: 0.85 }} />
      ))}
    </div>
  );
}

function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: small ? "3px 8px" : "5px 12px",
        border: `1px solid ${copied ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "4px",
        backgroundColor: copied ? "rgba(0,255,136,0.08)" : "transparent",
        color: copied ? "var(--terminal-green)" : "var(--code-comment)",
        fontFamily: monoFont, fontSize: small ? "0.68rem" : "0.72rem",
        cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", fontFamily: monoFont, fontSize: "0.72rem",
        border: "1px solid transparent", borderRadius: "4px", cursor: "pointer",
        transition: "all 0.15s",
        backgroundColor: active ? "rgba(0,255,136,0.12)" : "transparent",
        color: active ? "var(--terminal-green)" : "var(--code-comment)",
        borderColor: active ? "rgba(0,255,136,0.3)" : "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SqlFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("format");
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indent, setIndent] = useState("2");
  const [lineNumbers, setLineNumbers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const process = useCallback((sql: string) => {
    if (!sql.trim()) { setOutput(""); setError(null); return; }
    try {
      if (mode === "minify") {
        // Minify: collapse whitespace, preserve string literals
        const minified = sql
          .replace(/\s+/g, " ")
          .replace(/\s*([,;()])\s*/g, "$1 ")
          .replace(/\s+,/g, ",")
          .trim();
        setOutput(minified);
        setError(null);
      } else {
        const indentStr = indent === "tab" ? "\t" : " ".repeat(Number(indent));
        const formatted = sqlFormat(sql, {
          language: dialect,
          keywordCase: keywordCase,
          indentStyle: "standard" as IndentStyle,
          tabWidth: indent === "tab" ? 2 : Number(indent),
          useTabs: indent === "tab",
          linesBetweenQueries: 2,
        });
        setOutput(formatted);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to format SQL");
      setOutput("");
    }
  }, [mode, dialect, keywordCase, indent]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => process(input), 120);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, process]);

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    setInput(text);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const stats = getStats(output);
  const inputStats = getStats(input);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* highlight.js token colors mapped to our terminal theme */}
      <style>{`
        .hljs-keyword, .hljs-operator { color: #569cd6; font-weight: 600; }
        .hljs-string, .hljs-quote { color: #ce9178; }
        .hljs-number { color: #b5cea8; }
        .hljs-comment { color: #6e7681; font-style: italic; }
        .hljs-built_in, .hljs-name { color: #dcdcaa; }
        .hljs-literal { color: #66d9e8; }
        .hljs-variable, .hljs-template-variable { color: #9cdcfe; }
        .hljs-type, .hljs-class { color: #4ec9b0; }
        .hljs-punctuation, .hljs-symbol { color: rgba(255,255,255,0.35); }
        .hljs { background: transparent; color: rgba(255,255,255,0.82); }
      `}</style>
      {/* Client-side badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "6px 12px", borderRadius: "6px",
        border: "1px solid rgba(0,255,136,0.15)",
        backgroundColor: "rgba(0,255,136,0.05)", width: "fit-content",
      }}>
        <ShieldCheck size={12} style={{ color: "var(--terminal-green)", flexShrink: 0 }} />
        <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "var(--code-comment)" }}>
          100% client-side — no data leaves your browser
        </span>
      </div>

      {/* Main panel */}
      <div style={{
        border: "1px solid rgba(0,255,136,0.15)",
        borderRadius: "8px",
        backgroundColor: "rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}>
        {/* Title bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(0,255,136,0.1)",
          backgroundColor: "rgba(0,255,136,0.03)",
        }}>
          <WindowDots />
          <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "var(--code-comment)", opacity: 0.6 }}>
            sql — formatter
          </span>
          <div style={{ width: "52px" }} />
        </div>

        {/* Options bar */}
        <div style={{ padding: "14px 20px 0", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
          {/* Mode */}
          <div>
            <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              // Mode
            </p>
            <div style={{ display: "flex", gap: "4px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
              <SegBtn active={mode === "format"}  onClick={() => setMode("format")}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlignLeft size={11} />Format</span>
              </SegBtn>
              <SegBtn active={mode === "minify"}  onClick={() => setMode("minify")}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Minus size={11} />Minify</span>
              </SegBtn>
            </div>
          </div>

          {/* Dialect */}
          <div>
            <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              // Dialect
            </p>
            <DialectSelect value={dialect} onChange={setDialect} />
          </div>

          {/* Keyword case - only in format mode */}
          {mode === "format" && (
            <div>
              <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                // Keyword Case
              </p>
              <div style={{ display: "flex", gap: "4px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                {KEYWORD_CASES.map(k => (
                  <SegBtn key={k.id} active={keywordCase === k.id} onClick={() => setKeywordCase(k.id)}>
                    {k.label}
                  </SegBtn>
                ))}
              </div>
            </div>
          )}

          {/* Indent - only in format mode */}
          {mode === "format" && (
            <div>
              <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                // Indent
              </p>
              <div style={{ display: "flex", gap: "4px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                {INDENT_OPTIONS.map(o => (
                  <SegBtn key={o.id} active={indent === o.id} onClick={() => setIndent(o.id)}>
                    {o.label}
                  </SegBtn>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor area: input + output side by side */}
        <div style={{ padding: "16px 20px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
          {/* Input */}
          <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Input header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                // Input SQL
              </span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--code-comment)", opacity: 0.4 }}>
                  {inputStats.chars} chars · {inputStats.lines} lines
                </span>
                <button
                  onClick={() => setInput(SAMPLE_SQL)}
                  style={{
                    padding: "3px 8px", fontFamily: monoFont, fontSize: "0.65rem",
                    border: "1px solid rgba(88,166,255,0.2)", borderRadius: "3px",
                    backgroundColor: "rgba(88,166,255,0.05)", color: "#58a6ff",
                    cursor: "pointer",
                  }}
                >
                  Sample
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "3px 8px", fontFamily: monoFont, fontSize: "0.65rem",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px",
                    backgroundColor: "transparent", color: "var(--code-comment)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                  }}
                >
                  <Upload size={10} /> Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql,.txt"
                  style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
                />
                {input && (
                  <button
                    onClick={() => { setInput(""); setOutput(""); setError(null); }}
                    style={{
                      padding: "3px 8px", fontFamily: monoFont, fontSize: "0.65rem",
                      border: "1px solid rgba(255,80,80,0.2)", borderRadius: "3px",
                      backgroundColor: "rgba(255,80,80,0.05)", color: "rgba(255,100,100,0.7)",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                    }}
                  >
                    <X size={10} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Textarea with drag */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{ position: "relative" }}
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={"// Paste your SQL query here...\n// SELECT * FROM users WHERE id = 1;\n\n// Drag & drop a .sql file to upload"}
                spellCheck={false}
                style={{
                  width: "100%", minHeight: "320px", padding: "12px 14px",
                  fontFamily: monoFont, fontSize: "0.8rem", lineHeight: 1.7,
                  backgroundColor: isDragging ? "rgba(0,255,136,0.03)" : "rgba(0,0,0,0.3)",
                  border: `1px solid ${isDragging ? "rgba(0,255,136,0.4)" : "rgba(0,255,136,0.12)"}`,
                  borderRadius: "6px", color: "rgba(255,255,255,0.85)",
                  resize: "vertical", outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s, background-color 0.15s",
                  tabSize: 2,
                }}
              />
            </div>
          </div>

          {/* Output */}
          <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Output header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                // Output
              </span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {output && (
                  <>
                    <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--code-comment)", opacity: 0.4 }}>
                      {stats.chars} chars · {stats.lines} lines{stats.statements > 0 ? ` · ${stats.statements} stmt` : ""}
                    </span>
                    <button
                      onClick={() => setLineNumbers(v => !v)}
                      style={{
                        padding: "3px 8px", fontFamily: monoFont, fontSize: "0.65rem",
                        border: `1px solid ${lineNumbers ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "3px",
                        backgroundColor: lineNumbers ? "rgba(0,255,136,0.08)" : "transparent",
                        color: lineNumbers ? "var(--terminal-green)" : "var(--code-comment)",
                        cursor: "pointer",
                      }}
                    >
                      #
                    </button>
                    <CopyBtn text={output} small />
                    <button
                      onClick={handleDownload}
                      style={{
                        padding: "3px 8px", fontFamily: monoFont, fontSize: "0.65rem",
                        border: "1px solid rgba(88,166,255,0.2)", borderRadius: "3px",
                        backgroundColor: "rgba(88,166,255,0.05)", color: "#58a6ff",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                      }}
                    >
                      <Download size={10} /> .sql
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Output display */}
            <div style={{
              minHeight: "320px",
              border: `1px solid ${error ? "rgba(255,80,80,0.3)" : "rgba(0,255,136,0.12)"}`,
              borderRadius: "6px",
              backgroundColor: "rgba(0,0,0,0.3)",
              overflow: "auto",
              boxSizing: "border-box",
              position: "relative",
            }}>
              {!input && !error && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <p style={{ fontFamily: monoFont, fontSize: "0.78rem", color: "var(--code-comment)", opacity: 0.3 }}>
                    // Formatted output appears here
                  </p>
                </div>
              )}

              {error && (
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontFamily: monoFont, fontSize: "0.75rem", color: "rgba(255,100,100,0.85)", lineHeight: 1.6 }}>
                    ✕ {error}
                  </p>
                </div>
              )}

              {output && !error && (
                <div style={{ display: "flex", minHeight: "318px" }}>
                  {/* Line numbers */}
                  {lineNumbers && (
                    <div style={{
                      padding: "12px 0",
                      minWidth: "40px",
                      textAlign: "right",
                      borderRight: "1px solid rgba(0,255,136,0.08)",
                      backgroundColor: "rgba(0,255,136,0.02)",
                      flexShrink: 0,
                      userSelect: "none",
                    }}>
                      {output.split("\n").map((_, i) => (
                        <div
                          key={i}
                          style={{
                            fontFamily: monoFont, fontSize: "0.72rem", lineHeight: "1.7",
                            paddingRight: "10px", paddingLeft: "8px",
                            color: "rgba(110,118,129,0.4)",
                          }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Code */}
                  <pre
                    style={{
                      margin: 0,
                      padding: "12px 16px",
                      fontFamily: monoFont, fontSize: "0.8rem", lineHeight: "1.7",
                      color: "rgba(255,255,255,0.82)",
                      whiteSpace: "pre",
                      overflowX: "auto",
                      flex: 1,
                      minWidth: 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightSQL(output) }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
