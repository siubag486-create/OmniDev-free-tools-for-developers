"use client";

import { useState, useMemo, useRef } from "react";
import { diffLines, diffArrays, Change } from "diff";
import { Copy, Check, Trash2, ShieldCheck } from "lucide-react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);

type ViewMode = "split" | "unified";
type SyntaxLang =
  | "none"
  | "auto"
  | "javascript"
  | "typescript"
  | "python"
  | "json"
  | "css"
  | "html"
  | "bash"
  | "sql";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

// Unified view line
interface DiffLine {
  lineNum: number | null;
  lineNumNew: number | null;
  content: string;
  type: "added" | "removed" | "unchanged";
}

// Split view: each panel has its own independent line list
interface PanelLine {
  lineNum: number;
  content: string;
  type: "added" | "removed" | "unchanged";
  inlineHtml?: string; // word-level diff HTML for matched pairs
}

interface DiffResult {
  unifiedLines: DiffLine[];
  leftPanel: PanelLine[];
  rightPanel: PanelLine[];
  addedCount: number;
  removedCount: number;
}

function splitLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightLine(content: string, lang: SyntaxLang): string {
  if (lang === "none" || !content.trim()) return escapeHtml(content);
  try {
    if (lang === "auto") return hljs.highlightAuto(content).value;
    return hljs.highlight(content, { language: lang }).value;
  } catch {
    return escapeHtml(content);
  }
}

// ── Heuristic line matching ───────────────────────────────────────────────────
const HEURISTIC_THRESHOLD = 0.3;

function bigramSim(a: string, b: string): number {
  const na = a.trim();
  const nb = b.trim();
  if (na === nb) return 1.0;
  if (!na || !nb) return 0.0;
  if (na.length < 2 && nb.length < 2) return na === nb ? 1.0 : 0.0;

  const bgA = new Map<string, number>();
  for (let i = 0; i < na.length - 1; i++) {
    const k = na[i] + na[i + 1];
    bgA.set(k, (bgA.get(k) ?? 0) + 1);
  }

  let intersect = 0;
  for (let i = 0; i < nb.length - 1; i++) {
    const k = nb[i] + nb[i + 1];
    const c = bgA.get(k) ?? 0;
    if (c > 0) {
      intersect++;
      bgA.set(k, c - 1);
    }
  }

  const totalA = Math.max(1, na.length - 1);
  const totalB = Math.max(1, nb.length - 1);
  return (2 * intersect) / (totalA + totalB);
}

function heuristicPairs(
  removed: string[],
  added: string[]
): Array<{ ri: number; ai: number }> {
  const result: Array<{ ri: number; ai: number }> = [];
  let aStart = 0;

  for (let ri = 0; ri < removed.length; ri++) {
    let bestScore = HEURISTIC_THRESHOLD;
    let bestAi = -1;

    for (let ai = aStart; ai < added.length; ai++) {
      const score = bigramSim(removed[ri], added[ai]);
      if (score > bestScore) {
        bestScore = score;
        bestAi = ai;
      }
    }

    if (bestAi !== -1) {
      result.push({ ri, ai: bestAi });
      aStart = bestAi + 1;
    }
  }

  return result;
}
// ─────────────────────────────────────────────────────────────────────────────

// 괄호 그룹 (...)을 하나의 토큰으로, 나머지는 단어/공백/기호 단위로 분리
function tokenizeForDiff(s: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < s.length) {
    if (s[i] === "(") {
      // 중첩 괄호까지 포함해서 닫는 괄호까지 하나의 토큰
      let depth = 0;
      const start = i;
      while (i < s.length) {
        if (s[i] === "(") depth++;
        else if (s[i] === ")") {
          depth--;
          if (depth === 0) { i++; break; }
        }
        i++;
      }
      tokens.push(s.slice(start, i));
    } else if (/\s/.test(s[i])) {
      const start = i;
      while (i < s.length && /\s/.test(s[i])) i++;
      tokens.push(s.slice(start, i));
    } else if (/\w/.test(s[i])) {
      const start = i;
      while (i < s.length && /\w/.test(s[i])) i++;
      tokens.push(s.slice(start, i));
    } else {
      const start = i;
      while (i < s.length && !/[\w\s(]/.test(s[i])) i++;
      tokens.push(s.slice(start, i));
    }
  }

  return tokens.filter((t) => t.length > 0);
}

function computeInlineDiff(
  left: string,
  right: string
): { leftHtml: string; rightHtml: string } {
  const leftTokens = tokenizeForDiff(left);
  const rightTokens = tokenizeForDiff(right);
  const changes = diffArrays(leftTokens, rightTokens);

  let leftHtml = "";
  let rightHtml = "";

  for (const change of changes) {
    const text = change.value.join("");
    const escaped = escapeHtml(text);
    if (change.removed) {
      leftHtml += `<mark style="background:rgba(255,80,80,0.42);border-radius:2px;padding:0 1px;">${escaped}</mark>`;
    } else if (change.added) {
      rightHtml += `<mark style="background:rgba(0,255,136,0.42);border-radius:2px;padding:0 1px;">${escaped}</mark>`;
    } else {
      leftHtml += escaped;
      rightHtml += escaped;
    }
  }

  return { leftHtml, rightHtml };
}

function computeDiff(
  original: string,
  modified: string,
  ignoreWhitespace: boolean
): DiffResult {
  const changes: Change[] = diffLines(original, modified, { ignoreWhitespace });

  const unifiedLines: DiffLine[] = [];
  const leftPanel: PanelLine[] = [];
  const rightPanel: PanelLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let oldLineNum = 1;
  let newLineNum = 1;
  let leftNum = 1;
  let rightNum = 1;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      // Unchanged: goes to both panels + unified
      for (const line of splitLines(change.value)) {
        unifiedLines.push({
          lineNum: oldLineNum++,
          lineNumNew: newLineNum++,
          content: line,
          type: "unchanged",
        });
        leftPanel.push({ lineNum: leftNum++, content: line, type: "unchanged" });
        rightPanel.push({ lineNum: rightNum++, content: line, type: "unchanged" });
      }
    } else if (change.removed) {
      const removedLines = splitLines(change.value);
      const hasNext = i + 1 < changes.length && changes[i + 1].added;
      const addedLines = hasNext ? splitLines(changes[i + 1].value) : [];

      // Unified view lines
      for (const line of removedLines) {
        unifiedLines.push({ lineNum: oldLineNum++, lineNumNew: null, content: line, type: "removed" });
        removedCount++;
      }
      if (hasNext) {
        for (const line of addedLines) {
          unifiedLines.push({ lineNum: null, lineNumNew: newLineNum++, content: line, type: "added" });
          addedCount++;
        }
      }

      // Heuristic matching for word-level diff
      const pairs = heuristicPairs(removedLines, addedLines);
      const pairByRi = new Map(pairs.map((p) => [p.ri, p.ai]));
      const pairByAi = new Map(pairs.map((p) => [p.ai, p.ri]));

      // Pre-compute inline diffs
      const inlineCache = new Map<number, { leftHtml: string; rightHtml: string }>();
      for (const { ri, ai } of pairs) {
        inlineCache.set(ri, computeInlineDiff(removedLines[ri], addedLines[ai]));
      }

      // Left panel: all removed lines
      for (let j = 0; j < removedLines.length; j++) {
        const pl: PanelLine = { lineNum: leftNum++, content: removedLines[j], type: "removed" };
        if (pairByRi.has(j)) {
          pl.inlineHtml = inlineCache.get(j)!.leftHtml;
        }
        leftPanel.push(pl);
      }

      // Right panel: all added lines
      for (let j = 0; j < addedLines.length; j++) {
        const pl: PanelLine = { lineNum: rightNum++, content: addedLines[j], type: "added" };
        const ri = pairByAi.get(j);
        if (ri !== undefined) {
          pl.inlineHtml = inlineCache.get(ri)!.rightHtml;
        }
        rightPanel.push(pl);
      }

      if (hasNext) i++;
    } else {
      // Pure addition (no preceding removal)
      for (const line of splitLines(change.value)) {
        unifiedLines.push({ lineNum: null, lineNumNew: newLineNum++, content: line, type: "added" });
        rightPanel.push({ lineNum: rightNum++, content: line, type: "added" });
        addedCount++;
      }
    }
  }

  return { unifiedLines, leftPanel, rightPanel, addedCount, removedCount };
}

function generateDiffText(original: string, modified: string): string {
  return diffLines(original, modified)
    .flatMap((change) => {
      const prefix = change.added ? "+" : change.removed ? "-" : " ";
      return splitLines(change.value).map((line) => `${prefix} ${line}`);
    })
    .join("\n");
}

const LANG_OPTIONS: { value: SyntaxLang; label: string }[] = [
  { value: "none", label: "No highlight" },
  { value: "auto", label: "Auto" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
];

const toolbarBtnBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontFamily: monoFont,
  fontSize: "0.75rem",
  padding: "5px 10px",
  borderRadius: "5px",
  cursor: "pointer",
  border: "1px solid transparent",
  transition: "all 0.15s ease",
  lineHeight: 1,
  background: "none",
};

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
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// Single line row used in both panels
function PanelRow({
  line,
  lang,
}: {
  line: PanelLine;
  lang: SyntaxLang;
}) {
  const html =
    line.inlineHtml ??
    (line.type === "removed"
      ? `<mark style="background:rgba(255,80,80,0.35);border-radius:2px;padding:0 1px;">${escapeHtml(line.content)}</mark>`
      : line.type === "added"
        ? `<mark style="background:rgba(0,255,136,0.30);border-radius:2px;padding:0 1px;">${escapeHtml(line.content)}</mark>`
        : highlightLine(line.content, lang));
  const bg =
    line.type === "removed"
      ? "rgba(255,80,80,0.12)"
      : line.type === "added"
        ? "rgba(0,255,136,0.11)"
        : "transparent";
  const textColor =
    line.type === "removed"
      ? "rgba(255,123,114,0.92)"
      : line.type === "added"
        ? "rgba(0,255,136,0.92)"
        : "var(--foreground)";
  const numColor =
    line.type === "removed"
      ? "rgba(255,80,80,0.5)"
      : line.type === "added"
        ? "rgba(0,255,136,0.4)"
        : "var(--code-comment)";

  return (
    <div
      style={{
        display: "flex",
        backgroundColor: bg,
        minHeight: "22px",
        fontSize: "0.78rem",
        fontFamily: monoFont,
        lineHeight: "22px",
      }}
    >
      <div
        style={{
          width: "44px",
          textAlign: "right",
          paddingRight: "10px",
          color: numColor,
          opacity: 0.7,
          flexShrink: 0,
          userSelect: "none",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {line.lineNum}
      </div>
      <div
        style={{
          flex: 1,
          paddingLeft: "12px",
          paddingRight: "16px",
          color: textColor,
          overflow: "hidden",
          whiteSpace: "pre",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export default function TextDiffClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [syntaxLang, setSyntaxLang] = useState<SyntaxLang>("none");
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const [copied, setCopied] = useState(false);
  const [originalFocused, setOriginalFocused] = useState(false);
  const [modifiedFocused, setModifiedFocused] = useState(false);

  // Synchronized scrolling refs
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const syncLock = useRef(false);

  const hasDiff = original.length > 0 || modified.length > 0;
  const modifiedReady = original.length > 0 && modified.length === 0;

  const result = useMemo(
    () => (hasDiff ? computeDiff(original, modified, ignoreWhitespace) : null),
    [original, modified, ignoreWhitespace, hasDiff]
  );

  // Unified view
  const displayedUnified = useMemo(
    () =>
      hideUnchanged && result
        ? result.unifiedLines.filter((l) => l.type !== "unchanged")
        : result?.unifiedLines ?? [],
    [result, hideUnchanged]
  );

  // Split view: each panel independently filtered
  const displayedLeft = useMemo(
    () =>
      hideUnchanged && result
        ? result.leftPanel.filter((l) => l.type !== "unchanged")
        : result?.leftPanel ?? [],
    [result, hideUnchanged]
  );

  const displayedRight = useMemo(
    () =>
      hideUnchanged && result
        ? result.rightPanel.filter((l) => l.type !== "unchanged")
        : result?.rightPanel ?? [],
    [result, hideUnchanged]
  );

  // Unified view inline diff map
  const unifiedInlineMap = useMemo((): Map<DiffLine, string> => {
    if (!result) return new Map();
    const map = new Map<DiffLine, string>();
    const lines = result.unifiedLines;
    let i = 0;

    while (i < lines.length) {
      if (lines[i].type === "removed") {
        const removedStart = i;
        while (i < lines.length && lines[i].type === "removed") i++;
        const removedBlock = lines.slice(removedStart, i);

        const addedStart = i;
        while (i < lines.length && lines[i].type === "added") i++;
        const addedBlock = lines.slice(addedStart, i);

        const pairs = heuristicPairs(
          removedBlock.map((l) => l.content),
          addedBlock.map((l) => l.content)
        );
        for (const { ri, ai } of pairs) {
          const { leftHtml, rightHtml } = computeInlineDiff(
            removedBlock[ri].content,
            addedBlock[ai].content
          );
          map.set(removedBlock[ri], leftHtml);
          map.set(addedBlock[ai], rightHtml);
        }
      } else {
        i++;
      }
    }

    return map;
  }, [result]);

  function handleLeftScroll() {
    if (syncLock.current || !rightPanelRef.current || !leftPanelRef.current) return;
    syncLock.current = true;
    rightPanelRef.current.scrollTop = leftPanelRef.current.scrollTop;
    syncLock.current = false;
  }

  function handleRightScroll() {
    if (syncLock.current || !leftPanelRef.current || !rightPanelRef.current) return;
    syncLock.current = true;
    leftPanelRef.current.scrollTop = rightPanelRef.current.scrollTop;
    syncLock.current = false;
  }

  async function handleCopyDiff() {
    if (!result || !hasDiff) return;
    const text = generateDiffText(original, modified);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyPanel(lines: PanelLine[]) {
    navigator.clipboard.writeText(lines.map((l) => l.content).join("\n"));
  }

  function handleClear() {
    setOriginal("");
    setModified("");
  }

  const activeToggle: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "rgba(0,255,136,0.1)",
    border: "1px solid rgba(0,255,136,0.3)",
    color: "var(--terminal-green)",
    fontWeight: 700,
  };

  const inactiveToggle: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "transparent",
    border: "1px solid var(--terminal-border-bright)",
    color: "var(--code-comment)",
  };

  const activeBlue: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "rgba(88,166,255,0.1)",
    border: "1px solid rgba(88,166,255,0.3)",
    color: "var(--electric-blue)",
    fontWeight: 700,
  };

  const actionBtn: React.CSSProperties = {
    ...toolbarBtnBase,
    backgroundColor: "transparent",
    border: "1px solid var(--terminal-border-bright)",
    color: "var(--code-comment)",
  };

  const divider = (
    <div
      style={{
        width: "1px",
        height: "18px",
        backgroundColor: "var(--terminal-border)",
        margin: "0 2px",
        flexShrink: 0,
      }}
    />
  );

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
          100% client-side — no data leaves your browser
        </span>
      </div>

      {/* Input panes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
          gap: "12px",
        }}
      >
        {/* Original */}
        <div
          style={{
            border: `1px solid ${originalFocused ? "rgba(255,123,114,0.4)" : "var(--terminal-border-bright)"}`,
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "border-color 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 14px",
              backgroundColor: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid var(--terminal-border)",
            }}
          >
            <WindowDots />
            <span style={{ color: "var(--code-comment)", fontSize: "0.68rem", fontFamily: monoFont, letterSpacing: "0.08em", fontWeight: 600 }}>
              original.txt
            </span>
            {original && (
              <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: "var(--code-comment)", opacity: 0.5, fontFamily: monoFont }}>
                {original.split("\n").length} lines
              </span>
            )}
          </div>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            onFocus={() => setOriginalFocused(true)}
            onBlur={() => setOriginalFocused(false)}
            placeholder="Paste original text here..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            style={{
              flex: 1,
              minHeight: "260px",
              resize: "vertical",
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
        </div>

        {/* Modified */}
        <div
          style={{
            border: `1px solid ${
              modifiedFocused
                ? "rgba(0,255,136,0.5)"
                : modifiedReady
                  ? "rgba(0,255,136,0.3)"
                  : "var(--terminal-border-bright)"
            }`,
            borderRadius: "10px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "border-color 0.2s",
            boxShadow: modifiedReady && !modifiedFocused ? "0 0 12px rgba(0,255,136,0.06)" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 14px",
              backgroundColor: modifiedReady ? "rgba(0,255,136,0.04)" : "rgba(255,255,255,0.03)",
              borderBottom: "1px solid var(--terminal-border)",
              transition: "background-color 0.2s",
            }}
          >
            <WindowDots />
            <span
              style={{
                color: modifiedReady ? "var(--terminal-green)" : "var(--code-comment)",
                fontSize: "0.68rem",
                fontFamily: monoFont,
                letterSpacing: "0.08em",
                fontWeight: 600,
                transition: "color 0.2s",
              }}
            >
              modified.txt
            </span>
            {modifiedReady && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--terminal-green)",
                    boxShadow: "0 0 6px var(--terminal-green)",
                    animation: "cursor-blink 1s step-end infinite",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.62rem", color: "var(--terminal-green)", fontFamily: monoFont, opacity: 0.8 }}>
                  paste modified text
                </span>
              </div>
            )}
            {modified && (
              <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: "var(--code-comment)", opacity: 0.5, fontFamily: monoFont }}>
                {modified.split("\n").length} lines
              </span>
            )}
          </div>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            onFocus={() => setModifiedFocused(true)}
            onBlur={() => setModifiedFocused(false)}
            placeholder="Paste modified text here..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            style={{
              flex: 1,
              minHeight: "260px",
              resize: "vertical",
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
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          padding: "10px 14px",
          backgroundColor: "var(--terminal-surface)",
          border: "1px solid var(--terminal-border-bright)",
          borderRadius: "8px",
        }}
      >
        {/* Left: stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: monoFont, fontSize: "0.74rem" }}>
          {result ? (
            result.addedCount === 0 && result.removedCount === 0 ? (
              <span style={{ color: "var(--terminal-green)" }}>No differences</span>
            ) : (
              <>
                {result.removedCount > 0 && (
                  <span style={{ color: "var(--code-red)" }}>-{result.removedCount} removed</span>
                )}
                {result.addedCount > 0 && (
                  <span style={{ color: "var(--terminal-green)" }}>+{result.addedCount} added</span>
                )}
              </>
            )
          ) : (
            <span style={{ color: "var(--code-comment)", opacity: 0.4 }}>Paste text above to compare</span>
          )}
        </div>

        {/* Right: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
          <select
            value={syntaxLang}
            onChange={(e) => setSyntaxLang(e.target.value as SyntaxLang)}
            style={{
              fontFamily: monoFont,
              fontSize: "0.75rem",
              padding: "5px 10px",
              borderRadius: "5px",
              border: "1px solid var(--terminal-border-bright)",
              backgroundColor: "transparent",
              color: "var(--code-comment)",
              cursor: "pointer",
              outline: "none",
              lineHeight: 1,
            }}
          >
            {LANG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: "#111111" }}>
                {opt.label}
              </option>
            ))}
          </select>

          {divider}

          <button onClick={() => setViewMode("split")} style={viewMode === "split" ? activeToggle : inactiveToggle}>
            Split
          </button>
          <button onClick={() => setViewMode("unified")} style={viewMode === "unified" ? activeToggle : inactiveToggle}>
            Unified
          </button>

          {divider}

          <button onClick={() => setIgnoreWhitespace((p) => !p)} style={ignoreWhitespace ? activeBlue : inactiveToggle}>
            Ignore WS
          </button>
          <button onClick={() => setHideUnchanged((p) => !p)} style={hideUnchanged ? activeBlue : inactiveToggle}>
            Hide Same
          </button>

          {divider}

          <button
            onClick={handleCopyDiff}
            disabled={!hasDiff}
            style={{
              ...actionBtn,
              opacity: hasDiff ? 1 : 0.35,
              cursor: hasDiff ? "pointer" : "default",
              color: copied ? "var(--terminal-green)" : "var(--code-comment)",
              borderColor: copied ? "rgba(0,255,136,0.3)" : "var(--terminal-border-bright)",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy Diff"}
          </button>

          <button
            onClick={handleClear}
            disabled={!original && !modified}
            style={{
              ...actionBtn,
              opacity: original || modified ? 1 : 0.35,
              cursor: original || modified ? "pointer" : "default",
            }}
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Diff output */}
      {result && (
        <div
          style={{
            border: "1px solid var(--terminal-border-bright)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <WindowDots />
              <span style={{ color: "var(--code-comment)", fontSize: "0.68rem", fontFamily: monoFont, letterSpacing: "0.08em", fontWeight: 600 }}>
                diff-output —{" "}
                <span style={{ opacity: 0.6 }}>{viewMode} view</span>
              </span>
            </div>
            {result.addedCount === 0 && result.removedCount === 0 && (
              <span style={{ color: "var(--terminal-green)", fontFamily: monoFont, fontSize: "0.68rem" }}>
                files are identical
              </span>
            )}
          </div>

          {/* Output content */}
          <div style={{ backgroundColor: "var(--terminal-surface-2)" }}>
            {result.addedCount === 0 && result.removedCount === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  fontFamily: monoFont,
                  fontSize: "0.82rem",
                  color: "var(--terminal-green)",
                  opacity: 0.7,
                }}
              >
                No differences found — files are identical
              </div>
            ) : viewMode === "unified" ? (
              // ── Unified view ────────────────────────────────────────────────
              <div style={{ overflowX: "auto", minWidth: "100%", maxHeight: "640px", overflowY: "auto" }}>
                {displayedUnified.map((line, idx) => {
                  const hasInline = unifiedInlineMap.has(line);
                  const highlighted =
                    hasInline
                      ? unifiedInlineMap.get(line)!
                      : line.type === "removed"
                        ? `<mark style="background:rgba(255,80,80,0.42);border-radius:2px;padding:0 1px;">${escapeHtml(line.content)}</mark>`
                        : line.type === "added"
                          ? `<mark style="background:rgba(0,255,136,0.35);border-radius:2px;padding:0 1px;">${escapeHtml(line.content)}</mark>`
                          : highlightLine(line.content, syntaxLang);
                  const bg =
                    line.type === "added"
                      ? "rgba(0,255,136,0.13)"
                      : line.type === "removed"
                        ? "rgba(255,80,80,0.13)"
                        : "transparent";
                  const prefixColor =
                    line.type === "added"
                      ? "var(--terminal-green)"
                      : line.type === "removed"
                        ? "var(--code-red)"
                        : "var(--terminal-border-bright)";
                  const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
                  const textColor =
                    line.type === "added"
                      ? "rgba(0,255,136,0.9)"
                      : line.type === "removed"
                        ? "rgba(255,123,114,0.9)"
                        : "var(--foreground)";

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        backgroundColor: bg,
                        minHeight: "22px",
                        fontSize: "0.78rem",
                        fontFamily: monoFont,
                        lineHeight: "22px",
                      }}
                    >
                      <div style={{ width: "44px", textAlign: "right", paddingRight: "8px", color: "var(--code-comment)", opacity: 0.4, flexShrink: 0, userSelect: "none", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                        {line.lineNum ?? ""}
                      </div>
                      <div style={{ width: "44px", textAlign: "right", paddingRight: "8px", color: "var(--code-comment)", opacity: 0.4, flexShrink: 0, userSelect: "none", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                        {line.lineNumNew ?? ""}
                      </div>
                      <div style={{ width: "24px", textAlign: "center", color: prefixColor, fontWeight: 700, flexShrink: 0, userSelect: "none" }}>
                        {prefix}
                      </div>
                      <div
                        style={{ flex: 1, paddingLeft: "8px", paddingRight: "16px", color: textColor, overflow: "hidden", whiteSpace: "pre" }}
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              // ── Split view: two independent panels, no empty rows ────────────
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {/* Left panel */}
                <div style={{ borderRight: "1px solid var(--terminal-border)", minWidth: 0 }}>
                  {/* Panel header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 12px",
                      borderBottom: "1px solid var(--terminal-border)",
                      backgroundColor: "rgba(255,80,80,0.06)",
                    }}
                  >
                    <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "rgba(255,123,114,0.8)", fontWeight: 600 }}>
                      — {result.removedCount} removals
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--code-comment)", opacity: 0.5 }}>
                        {result.leftPanel.length} lines
                      </span>
                      <button
                        onClick={() => handleCopyPanel(result.leftPanel)}
                        style={{ ...actionBtn, padding: "3px 8px", fontSize: "0.65rem" }}
                      >
                        <Copy size={11} />
                        Copy
                      </button>
                    </div>
                  </div>
                  {/* Lines */}
                  <div
                    ref={leftPanelRef}
                    onScroll={handleLeftScroll}
                    style={{ overflowX: "auto", overflowY: "auto", maxHeight: "580px" }}
                  >
                    {displayedLeft.map((line, idx) => (
                      <PanelRow key={idx} line={line} lang={syntaxLang} />
                    ))}
                  </div>
                </div>

                {/* Right panel */}
                <div style={{ minWidth: 0 }}>
                  {/* Panel header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 12px",
                      borderBottom: "1px solid var(--terminal-border)",
                      backgroundColor: "rgba(0,255,136,0.05)",
                    }}
                  >
                    <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "rgba(0,255,136,0.7)", fontWeight: 600 }}>
                      + {result.addedCount} additions
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: monoFont, fontSize: "0.62rem", color: "var(--code-comment)", opacity: 0.5 }}>
                        {result.rightPanel.length} lines
                      </span>
                      <button
                        onClick={() => handleCopyPanel(result.rightPanel)}
                        style={{ ...actionBtn, padding: "3px 8px", fontSize: "0.65rem" }}
                      >
                        <Copy size={11} />
                        Copy
                      </button>
                    </div>
                  </div>
                  {/* Lines */}
                  <div
                    ref={rightPanelRef}
                    onScroll={handleRightScroll}
                    style={{ overflowX: "auto", overflowY: "auto", maxHeight: "580px" }}
                  >
                    {displayedRight.map((line, idx) => (
                      <PanelRow key={idx} line={line} lang={syntaxLang} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
