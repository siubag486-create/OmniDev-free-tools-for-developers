"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface DiffLine {
  type: "same" | "added" | "removed";
  content: string;
}

interface ErrorContextLine {
  num: number;
  content: string;
  isError: boolean;
}

interface ErrorContext {
  summary: string;
  lines: ErrorContextLine[];
  col: number;
}

interface JsonState {
  input: string;
  output: string;
  highlighted: string;
  mode: FormatMode;
  status: Status;
  errorMessage: string | null;
  errorContext: ErrorContext | null;
  fixItems: FixItem[];
  diffLines: DiffLine[];
  showDiff: boolean;
  copied: boolean;
  inputFocused: boolean;
  isDragging: boolean;
  cannotFix: boolean;
  cannotFixReason: string | null;
}

const INITIAL_STATE: JsonState = {
  input: "",
  output: "",
  highlighted: "",
  mode: "format",
  status: "idle",
  errorMessage: null,
  errorContext: null,
  fixItems: [],
  diffLines: [],
  showDiff: false,
  copied: false,
  inputFocused: false,
  isDragging: false,
  cannotFix: false,
  cannotFixReason: null,
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

// ─── JSON Tree View ──────────────────────────────────────────────────────────

const TREE_MONO = "'RoundedFixedsys', var(--font-geist-mono), monospace";

function TreePrimitive({ value }: { value: unknown }) {
  if (value === null)
    return <span style={{ color: "var(--code-comment)" }}>null</span>;
  if (typeof value === "boolean")
    return <span style={{ color: "var(--code-red)" }}>{String(value)}</span>;
  if (typeof value === "number")
    return <span style={{ color: "var(--code-orange)" }}>{String(value)}</span>;
  if (typeof value === "string")
    return <span style={{ color: "var(--code-yellow)" }}>&quot;{value}&quot;</span>;
  return <span>{String(value)}</span>;
}

function JsonTreeNode({
  nodeKey,
  value,
  depth,
  isLast,
  path,
  searchQuery,
}: {
  nodeKey?: string | number;
  value: unknown;
  depth: number;
  isLast: boolean;
  path: string;
  searchQuery: string;
}) {
  const isArr = Array.isArray(value);
  const isObj = value !== null && typeof value === "object" && !isArr;
  const isExpandable = isArr || isObj;
  const [open, setOpen] = useState(depth < 2);
  const [pathCopied, setPathCopied] = useState(false);

  const isOpen = searchQuery.trim() ? true : open;

  const entries: [string | number, unknown][] = isArr
    ? (value as unknown[]).map((v, i) => [i, v])
    : isObj
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const count = entries.length;
  const brackets: [string, string] = isArr ? ["[", "]"] : ["{", "}"];

  const q = searchQuery.trim().toLowerCase();
  const keyStr = nodeKey !== undefined ? String(nodeKey) : "";
  const isKeyMatch = Boolean(q && keyStr.toLowerCase().includes(q));
  const valStr =
    !isExpandable && value !== null && typeof value !== "object"
      ? String(value)
      : "";
  const isValMatch = Boolean(q && !isExpandable && valStr.toLowerCase().includes(q));
  const dimmed = Boolean(q && !isKeyMatch && !isValMatch && !isExpandable);

  function handleCopyPath(e: React.MouseEvent) {
    e.stopPropagation();
    if (!path) return;
    navigator.clipboard.writeText(path).catch(() => {});
    setPathCopied(true);
    setTimeout(() => setPathCopied(false), 1500);
  }

  function getChildPath(childKey: string | number): string {
    if (typeof childKey === "number") return `${path}[${childKey}]`;
    return path ? `${path}.${String(childKey)}` : String(childKey);
  }

  const isNumericKey = typeof nodeKey === "number";

  const keyLabel =
    nodeKey !== undefined ? (
      <span
        style={{
          color: isKeyMatch
            ? "var(--terminal-green)"
            : isNumericKey
            ? "var(--code-comment)"
            : "var(--electric-blue)",
          opacity: isNumericKey ? 0.5 : 1,
          fontStyle: isNumericKey ? "italic" : undefined,
          cursor: path ? "pointer" : "default",
          backgroundColor: isKeyMatch ? "rgba(0,255,136,0.12)" : "transparent",
          borderRadius: "3px",
          padding: isKeyMatch ? "0 2px" : undefined,
        }}
        title={path ? `Click to copy path: ${path}` : undefined}
        onClick={path ? handleCopyPath : undefined}
      >
        {isNumericKey ? nodeKey : `"${nodeKey}"`}
        {pathCopied && (
          <span
            style={{
              color: "var(--terminal-green)",
              fontSize: "0.62rem",
              marginLeft: "7px",
              opacity: 0.85,
              fontStyle: "normal",
            }}
          >
            ✓ copied
          </span>
        )}
      </span>
    ) : null;

  const colon =
    nodeKey !== undefined ? (
      <span style={{ color: "var(--code-comment)", opacity: 0.55 }}>: </span>
    ) : null;

  const comma = !isLast ? (
    <span style={{ color: "var(--code-comment)", opacity: 0.45 }}>,</span>
  ) : null;

  if (!isExpandable) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "2px",
          fontFamily: TREE_MONO,
          fontSize: "0.82rem",
          lineHeight: "1.75",
          paddingLeft: "18px",
          opacity: dimmed ? 0.22 : 1,
          transition: "opacity 0.12s",
        }}
      >
        {keyLabel}
        {colon}
        <span
          style={{
            backgroundColor: isValMatch ? "rgba(0,255,136,0.12)" : "transparent",
            borderRadius: "3px",
            padding: isValMatch ? "0 2px" : undefined,
          }}
        >
          <TreePrimitive value={value} />
        </span>
        {comma}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          fontFamily: TREE_MONO,
          fontSize: "0.82rem",
          lineHeight: "1.75",
          paddingLeft: "2px",
          userSelect: "none",
        }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          style={{
            color: "var(--terminal-green)",
            opacity: 0.5,
            fontSize: "0.58rem",
            marginRight: "3px",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          ▶
        </span>
        {keyLabel}
        {colon}
        <span
          onClick={() => setOpen(true)}
          style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: "2px" }}
        >
          <span style={{ color: "var(--terminal-green)", opacity: 0.6 }}>{brackets[0]}</span>
          <span style={{ color: "var(--code-comment)", fontSize: "0.72rem", opacity: 0.6 }}>
            {" "}{count} {isArr ? "items" : "keys"}{" "}
          </span>
          <span style={{ color: "var(--terminal-green)", opacity: 0.6 }}>{brackets[1]}</span>
        </span>
        {comma}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: TREE_MONO, fontSize: "0.82rem", lineHeight: "1.75" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          paddingLeft: "2px",
          userSelect: "none",
        }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); if (!searchQuery) setOpen(false); }}
          style={{
            color: "var(--terminal-green)",
            opacity: 0.5,
            fontSize: "0.58rem",
            marginRight: "3px",
            flexShrink: 0,
            cursor: searchQuery ? "default" : "pointer",
          }}
        >
          ▼
        </span>
        {keyLabel}
        {colon}
        <span
          onClick={() => { if (!searchQuery) setOpen(false); }}
          style={{ cursor: searchQuery ? "default" : "pointer", display: "flex", alignItems: "baseline", gap: "2px" }}
        >
          <span style={{ color: "var(--terminal-green)", opacity: 0.6 }}>{brackets[0]}</span>
          <span style={{ color: "var(--code-comment)", fontSize: "0.68rem", opacity: 0.35 }}>
            {" "}{count} {isArr ? "items" : "keys"}
          </span>
        </span>
      </div>

      <div
        style={{
          paddingLeft: "20px",
          borderLeft: "1px solid rgba(0,255,136,0.1)",
          marginLeft: "5px",
        }}
      >
        {entries.map(([k, v], i) => (
          <JsonTreeNode
            key={String(k)}
            nodeKey={k}
            value={v}
            depth={depth + 1}
            isLast={i === count - 1}
            path={getChildPath(k)}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      <div style={{ paddingLeft: "18px", display: "flex", alignItems: "baseline", gap: "2px" }}>
        <span style={{ color: "var(--terminal-green)", opacity: 0.6 }}>{brackets[1]}</span>
        {comma}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function buildErrorContext(err: unknown, raw: string): ErrorContext {
  const msg = err instanceof Error ? err.message : "Invalid JSON";
  const allLines = raw.split("\n");

  let line = 0;
  let col = 0;

  const lineColMatch = msg.match(/at line (\d+) column (\d+)/);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    col = parseInt(lineColMatch[2], 10);
  } else {
    const posMatch = msg.match(/at position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const before = raw.slice(0, pos);
      line = (before.match(/\n/g) ?? []).length + 1;
      const lastNewline = before.lastIndexOf("\n");
      col = pos - lastNewline;
    }
  }

  const summary =
    line > 0
      ? `Syntax error — line ${line}, col ${col}`
      : msg.replace(/ in JSON at position \d+/, "").replace(/\u2019/g, "'");

  if (line === 0) return { summary, lines: [], col: 0 };

  const errorIdx = line - 1;
  const contextLines: ErrorContextLine[] = [];
  for (
    let i = Math.max(0, errorIdx - 2);
    i <= Math.min(allLines.length - 1, errorIdx + 1);
    i++
  ) {
    contextLines.push({ num: i + 1, content: allLines[i], isError: i === errorIdx });
  }

  return { summary, lines: contextLines, col };
}

function computeStats(text: string) {
  if (!text) return { chars: 0, lines: 0, kb: "0.00" };
  return {
    chars: text.length,
    lines: text.split("\n").length,
    kb: (new TextEncoder().encode(text).byteLength / 1024).toFixed(2),
  };
}

// 문자열 내부 컨텐츠를 제거해 구조 토큰만 남김 (콤마/괄호 카운팅 정확도 향상)
function stripStringContents(s: string): string {
  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === '"') {
      out += '"';
      i++;
      while (i < s.length) {
        if (s[i] === "\\" && i + 1 < s.length) {
          i += 2;
          continue;
        }
        if (s[i] === '"') {
          out += '"';
          i++;
          break;
        }
        i++;
      }
    } else {
      out += s[i];
      i++;
    }
  }
  return out;
}

// 원본과 수정본을 비교해서 어떤 오류가 수정됐는지 감지
function detectFixes(original: string, repaired: string): FixItem[] {
  const items: FixItem[] = [];
  const strippedOrig = stripStringContents(original);
  const strippedRep = stripStringContents(repaired);

  // 단일 따옴표 → 이중 따옴표 (원본에 있고 수정본에서 사라진 경우만)
  if (/(?<!\\)'/.test(original) && !/(?<!\\)'/.test(repaired)) {
    items.push({
      label: "Single quotes converted",
      description: "Single quotes replaced with double quotes",
    });
  }

  // 후행 쉼표 — 문자열 밖에서 검사
  if (/,\s*[}\]]/.test(strippedOrig) && !/,\s*[}\]]/.test(strippedRep)) {
    const count = (strippedOrig.match(/,\s*[}\]]/g) ?? []).length;
    items.push({
      label: "Trailing commas removed",
      description: `${count} trailing comma${count !== 1 ? "s" : ""} before } or ] were removed`,
    });
  }

  // 주석 제거 (// or /* */)
  if (/\/\/[^\n]*|\/\*[\s\S]*?\*\//.test(original)) {
    items.push({
      label: "Comments removed",
      description: "// and /* */ style comments were stripped",
    });
  }

  // 따옴표 없는 key — 문자열 밖에서 카운트 비교
  const unquotedKeyRx = /[{,]\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  const origUnquotedKeys = (strippedOrig.match(unquotedKeyRx) ?? []).length;
  const repUnquotedKeys = (strippedRep.match(unquotedKeyRx) ?? []).length;
  if (origUnquotedKeys > repUnquotedKeys) {
    const n = origUnquotedKeys - repUnquotedKeys;
    items.push({
      label: "Unquoted keys quoted",
      description: `${n} object key${n !== 1 ? "s" : ""} without quotes were wrapped in double quotes`,
    });
  }

  // 누락된 쉼표 — 구조 토큰 기준으로 카운트
  const origCommas = (strippedOrig.match(/,/g) ?? []).length;
  const repCommas = (strippedRep.match(/,/g) ?? []).length;
  if (repCommas > origCommas) {
    const n = repCommas - origCommas;
    items.push({
      label: "Missing commas inserted",
      description: `${n} missing comma${n !== 1 ? "s" : ""} were added between elements`,
    });
  }

  // 따옴표 없는 string 값 (unquoted string values) — 구조 기준
  const unquotedValRx = /:\s*(?!true\b|false\b|null\b|-?\d)([a-zA-Z][a-zA-Z0-9_]*)/g;
  const origUnquotedVals = (strippedOrig.match(unquotedValRx) ?? []).length;
  const repUnquotedVals = (strippedRep.match(unquotedValRx) ?? []).length;
  if (origUnquotedVals > repUnquotedVals) {
    const n = origUnquotedVals - repUnquotedVals;
    items.push({
      label: "Unquoted string values quoted",
      description: `${n} string value${n !== 1 ? "s" : ""} without quotes were wrapped in double quotes`,
    });
  }

  // 따옴표 짝이 맞지 않는 경우 — 구조 밖 따옴표 홀짝 검사
  const origQuoteCount = (strippedOrig.match(/"/g) ?? []).length;
  const repQuoteCount = (strippedRep.match(/"/g) ?? []).length;
  if (origQuoteCount % 2 !== 0 && repQuoteCount % 2 === 0) {
    items.push({
      label: "Unclosed quotes fixed",
      description: "Missing closing quote mark(s) were added",
    });
  }

  // 괄호/브래킷 불균형 — 수정본에서 해소된 경우만
  const origOpens = (strippedOrig.match(/[{[]/g) ?? []).length;
  const origCloses = (strippedOrig.match(/[}\]]/g) ?? []).length;
  const repOpens = (strippedRep.match(/[{[]/g) ?? []).length;
  const repCloses = (strippedRep.match(/[}\]]/g) ?? []).length;
  const origImbalance = Math.abs(origOpens - origCloses);
  const repImbalance = Math.abs(repOpens - repCloses);
  if (origImbalance > 0 && repImbalance < origImbalance) {
    items.push({
      label: "Mismatched brackets fixed",
      description: `${origImbalance} missing ${origOpens > origCloses ? "closing" : "opening"} bracket${origImbalance !== 1 ? "s" : ""} were added`,
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

// jsonrepair가 실패했을 때 원인 분석
function diagnoseUnfixable(input: string): string {
  // 중첩 레벨 추적 (문자열 밖에서만)
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") braceDepth++;
    else if (c === "}") braceDepth--;
    else if (c === "[") bracketDepth++;
    else if (c === "]") bracketDepth--;
  }

  const imbalance = Math.abs(braceDepth) + Math.abs(bracketDepth);
  if (imbalance > 6) {
    return `Severely unbalanced brackets (${imbalance} unmatched) — structure is too damaged to repair automatically. Try fixing {} and [] manually first.`;
  }

  // 템플릿 리터럴 (백틱)
  if (/`/.test(input)) {
    return "Contains template literal (` backtick string) — not valid in JSON. Replace with regular double-quoted strings.";
  }

  // JS 모듈 구문
  if (/\b(import|export|require|module\.exports)\b/.test(input)) {
    return "Contains JavaScript module syntax — not valid in JSON. Remove import/export/require statements.";
  }

  // Symbol, BigInt 등
  if (/\bSymbol\s*\(|\bBigInt\s*\(/.test(input)) {
    return "Contains JavaScript-only types (Symbol, BigInt) — these have no JSON equivalent. Replace with strings or numbers.";
  }

  // 여전히 남은 function 키워드 (전처리 후에도 있다면)
  if (/\bfunction\s*\(/.test(input)) {
    return "Contains a JavaScript function expression with syntax that could not be parsed. Remove or replace with null manually.";
  }

  return "Structure is too damaged to repair automatically. Check for deeply nested errors or non-JSON syntax and fix manually.";
}

// jsonrepair 전처리 — JS 전용 구문을 JSON 호환 값으로 치환
function preprocessJsConstructs(input: string): {
  result: string;
  replacedFunctions: number;
  replacedEmptySlots: number;
} {
  let out = "";
  let i = 0;
  let replacedFunctions = 0;
  let replacedEmptySlots = 0;

  while (i < input.length) {
    const ch = input[i];

    // 문자열 내부는 통째로 통과 (오탐 방지)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      out += ch;
      i++;
      while (i < input.length) {
        const c = input[i];
        out += c;
        if (c === "\\" && i + 1 < input.length) {
          i++;
          out += input[i];
        } else if (c === quote) {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // 연속 콤마 (빈 배열 슬롯): [1, 2, , 4] → [1, 2, null, 4]
    if (ch === ",") {
      out += ch;
      i++;
      // 공백 보존
      let ws = "";
      while (i < input.length && /\s/.test(input[i])) {
        ws += input[i];
        i++;
      }
      if (i < input.length && input[i] === ",") {
        // 빈 슬롯 — null 삽입 (공백 포함)
        out += ws + "null";
        replacedEmptySlots++;
      } else {
        out += ws;
      }
      continue;
    }

    // function 키워드 감지
    if (
      input.slice(i, i + 8) === "function" &&
      (i === 0 || /\W/.test(input[i - 1])) &&
      /[\s(]/.test(input[i + 8] ?? " ")
    ) {
      // '(' 찾기
      let j = i + 8;
      while (j < input.length && input[j] !== "(") j++;
      // ')' 찾기 (중첩 괄호 처리)
      let parenDepth = 1;
      j++;
      while (j < input.length && parenDepth > 0) {
        if (input[j] === "(") parenDepth++;
        else if (input[j] === ")") parenDepth--;
        j++;
      }
      // 함수 바디 '{' 찾기
      while (j < input.length && input[j] !== "{") j++;
      if (j < input.length) {
        // 중첩 브레이스 카운팅으로 정확한 닫힘 위치 탐색
        let depth = 1;
        let k = j + 1;
        while (k < input.length && depth > 0) {
          if (input[k] === "{") depth++;
          else if (input[k] === "}") depth--;
          k++;
        }
        out += "null";
        i = k;
        replacedFunctions++;
        continue;
      }
    }

    out += ch;
    i++;
  }

  return { result: out, replacedFunctions, replacedEmptySlots };
}

// LCS 기반 라인 diff
function computeLineDiff(a: string, b: string): DiffLine[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length;
  const n = bLines.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        aLines[i - 1] === bLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m,
    j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.unshift({ type: "same", content: aLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", content: bLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", content: aLines[i - 1] });
      i--;
    }
  }
  return result;
}

type ContextEntry = DiffLine | { type: "separator" };

function getContextDiff(diffLines: DiffLine[], ctx = 2): ContextEntry[] {
  const visible = new Set<number>();
  diffLines.forEach((line, i) => {
    if (line.type !== "same") {
      for (
        let c = Math.max(0, i - ctx);
        c <= Math.min(diffLines.length - 1, i + ctx);
        c++
      ) {
        visible.add(c);
      }
    }
  });

  const result: ContextEntry[] = [];
  let lastAdded = -1;
  diffLines.forEach((line, i) => {
    if (visible.has(i)) {
      if (lastAdded !== -1 && i > lastAdded + 1) {
        result.push({ type: "separator" });
      }
      result.push(line);
      lastAdded = i;
    }
  });
  return result;
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
        errorContext: null,
        fixItems: [],
        cannotFix: false,
        cannotFixReason: null,
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
        errorContext: null,
        fixItems: [],
        cannotFix: false,
        cannotFixReason: null,
      }));
    } catch (err) {
      const errorContext = buildErrorContext(err, raw);
      setState((prev) => ({
        ...prev,
        output: "",
        highlighted: "",
        status: "error",
        errorMessage: errorContext.summary,
        errorContext,
        fixItems: [],
        cannotFix: false,
        cannotFixReason: null,
      }));
    }
  }

  function handleAutoFix() {
    if (!state.input.trim()) return;
    const originalInput = state.input;
    try {
      const { result: preprocessed, replacedFunctions, replacedEmptySlots } =
        preprocessJsConstructs(originalInput);
      const repaired = jsonrepair(preprocessed);
      const fixes = detectFixes(originalInput, repaired);
      if (replacedEmptySlots > 0) {
        fixes.unshift({
          label: "Empty array slots filled",
          description: `${replacedEmptySlots} empty slot${replacedEmptySlots !== 1 ? "s" : ""} (,,) replaced with null`,
        });
      }
      if (replacedFunctions > 0) {
        fixes.unshift({
          label: "Function expressions replaced",
          description: `${replacedFunctions} JS function expression${replacedFunctions !== 1 ? "s" : ""} replaced with null (functions are not valid JSON)`,
        });
      }
      const diffLines = computeLineDiff(originalInput, repaired);
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
        errorContext: null,
        fixItems: fixes,
        diffLines,
        showDiff: false,
        cannotFix: false,
        cannotFixReason: null,
      }));
    } catch {
      const cannotFixReason = diagnoseUnfixable(originalInput);
      setState((prev) => ({ ...prev, cannotFix: true, cannotFixReason }));
    }
  }

  function handleToggleDiff() {
    setState((prev) => ({ ...prev, showDiff: !prev.showDiff }));
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
        errorContext: null,
        fixItems: [],
        cannotFix: false,
        cannotFixReason: null,
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

  const [viewMode, setViewMode] = useState<"code" | "tree">("code");
  const [searchQuery, setSearchQuery] = useState("");

  const isError = state.status === "error";
  const isFixed = state.status === "fixed";

  const parsedJson = useMemo(() => {
    if (!state.output || isError) return null;
    try { return JSON.parse(state.output); } catch { return null; }
  }, [state.output, isError]);

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
              borderRadius:
                isFixed ||
                (isError && (state.errorContext?.lines.length ?? 0) > 0) ||
                (isError && state.cannotFix)
                  ? "6px 6px 0 0"
                  : "6px",
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
                  (Cannot auto-fix)
                </span>
              )}
            </div>

            {/* View Changes button — only when fixed */}
            {isFixed && state.diffLines.length > 0 && (
              <button
                onClick={handleToggleDiff}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: monoFont,
                  fontSize: "0.72rem",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  border: state.showDiff
                    ? "1px solid rgba(88,166,255,0.5)"
                    : "1px solid rgba(88,166,255,0.25)",
                  backgroundColor: state.showDiff
                    ? "rgba(88,166,255,0.15)"
                    : "rgba(88,166,255,0.06)",
                  color: "var(--electric-blue)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {state.showDiff ? "Hide Changes" : "View Changes"}
              </button>
            )}

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

          {/* Error context panel — line preview with pointer */}
          {isError && state.errorContext && state.errorContext.lines.length > 0 && (
            <div
              style={{
                borderRadius: state.cannotFix ? "0" : "0 0 6px 6px",
                border: "1px solid rgba(255,123,114,0.2)",
                borderTop: "none",
                borderBottom: state.cannotFix ? "none" : "1px solid rgba(255,123,114,0.2)",
                backgroundColor: "#0d1117",
                overflow: "hidden",
              }}
            >
              <div style={{ overflow: "auto" }}>
                {state.errorContext.lines.map(({ num, content, isError: lineIsError }) => {
                  const maxNum = state.errorContext!.lines[state.errorContext!.lines.length - 1].num;
                  const numWidth = String(maxNum).length;
                  const prefix = `${lineIsError ? ">" : " "} ${String(num).padStart(numWidth)} | `;
                  const arrowOffset = prefix.length + state.errorContext!.col - 1;
                  return (
                    <div key={num}>
                      <pre
                        style={{
                          margin: 0,
                          padding: "1px 14px",
                          fontFamily: monoFont,
                          fontSize: "0.78rem",
                          lineHeight: "1.65",
                          whiteSpace: "pre",
                          color: lineIsError ? "var(--code-red)" : "var(--code-comment)",
                          backgroundColor: lineIsError
                            ? "rgba(255,123,114,0.06)"
                            : "transparent",
                          opacity: lineIsError ? 1 : 0.55,
                        }}
                      >
                        {prefix}{content}
                      </pre>
                      {lineIsError && state.errorContext!.col > 0 && (
                        <pre
                          style={{
                            margin: 0,
                            padding: "0 14px 4px",
                            fontFamily: monoFont,
                            fontSize: "0.78rem",
                            lineHeight: 1,
                            whiteSpace: "pre",
                            color: "var(--code-red)",
                            opacity: 0.7,
                          }}
                        >
                          {" ".repeat(arrowOffset)}^
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cannot-fix reason panel */}
          {isError && state.cannotFix && state.cannotFixReason && (
            <div
              style={{
                borderRadius: "0 0 6px 6px",
                border: "1px solid rgba(255,123,114,0.2)",
                borderTop: "none",
                backgroundColor: "rgba(255,123,114,0.04)",
                padding: "7px 14px",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle
                size={12}
                style={{ color: "var(--code-red)", opacity: 0.6, flexShrink: 0, marginTop: "2px" }}
              />
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.7rem",
                  color: "var(--code-comment)",
                  lineHeight: 1.5,
                }}
              >
                {state.cannotFixReason}
              </span>
            </div>
          )}

          {/* Fix detail list — shown after auto-fix */}
          {isFixed && state.fixItems.length > 0 && (
            <div
              style={{
                borderRadius: state.showDiff ? "0" : "0 0 6px 6px",
                border: "1px solid rgba(88,166,255,0.25)",
                borderTop: "none",
                borderBottom: state.showDiff ? "none" : "1px solid rgba(88,166,255,0.25)",
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
                    padding: "9px 16px",
                    borderTop: i > 0 ? "1px solid rgba(88,166,255,0.08)" : undefined,
                  }}
                >
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.85rem",
                      color: "var(--electric-blue)",
                      opacity: 0.7,
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: "0.85rem",
                        color: "var(--electric-blue)",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: "0.78rem",
                        color: "var(--code-comment)",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Diff panel — toggled via "View Changes" */}
          {isFixed && state.showDiff && state.diffLines.length > 0 && (
            <div
              style={{
                borderRadius: "0 0 6px 6px",
                border: "1px solid rgba(88,166,255,0.25)",
                borderTop: "1px solid rgba(88,166,255,0.1)",
                backgroundColor: "#0d1117",
                overflow: "hidden",
              }}
            >
              {/* Diff header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderBottom: "1px solid rgba(88,166,255,0.1)",
                  backgroundColor: "rgba(88,166,255,0.05)",
                }}
              >
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.8rem",
                    color: "var(--code-comment)",
                    letterSpacing: "0.05em",
                  }}
                >
                  --- original &nbsp;&nbsp; +++ repaired
                </span>
              </div>

              {/* Diff lines */}
              <div style={{ overflow: "auto", maxHeight: "420px" }}>
                {getContextDiff(state.diffLines).map((entry, i) => {
                  if (entry.type === "separator") {
                    return (
                      <div
                        key={`sep-${i}`}
                        style={{
                          padding: "3px 18px",
                          fontFamily: monoFont,
                          fontSize: "0.88rem",
                          color: "var(--code-comment)",
                          opacity: 0.5,
                          userSelect: "none",
                          borderTop: "1px solid rgba(88,166,255,0.06)",
                          borderBottom: "1px solid rgba(88,166,255,0.06)",
                        }}
                      >
                        ...
                      </div>
                    );
                  }

                  const line = entry as DiffLine;
                  const isAdded = line.type === "added";
                  const isRemoved = line.type === "removed";

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0",
                        backgroundColor: isAdded
                          ? "rgba(0,255,136,0.08)"
                          : isRemoved
                          ? "rgba(255,123,114,0.09)"
                          : "transparent",
                        borderLeft: isAdded
                          ? "3px solid rgba(0,255,136,0.6)"
                          : isRemoved
                          ? "3px solid rgba(255,123,114,0.6)"
                          : "3px solid transparent",
                      }}
                    >
                      {/* Gutter: sign */}
                      <span
                        style={{
                          fontFamily: monoFont,
                          fontSize: "0.95rem",
                          lineHeight: "1.7",
                          padding: "2px 14px",
                          color: isAdded
                            ? "var(--terminal-green)"
                            : isRemoved
                            ? "var(--code-red)"
                            : "transparent",
                          userSelect: "none",
                          flexShrink: 0,
                          minWidth: "36px",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        {isAdded ? "+" : isRemoved ? "-" : " "}
                      </span>

                      {/* Content */}
                      <span
                        style={{
                          fontFamily: monoFont,
                          fontSize: "0.9rem",
                          lineHeight: "1.7",
                          padding: "2px 18px 2px 0",
                          color: isAdded
                            ? "var(--terminal-green)"
                            : isRemoved
                            ? "var(--code-red)"
                            : "var(--code-comment)",
                          opacity: line.type === "same" ? 0.5 : 1,
                          whiteSpace: "pre",
                          overflowX: "auto",
                        }}
                      >
                        {line.content || " "}
                      </span>
                    </div>
                  );
                })}
              </div>
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Code / Tree toggle */}
              <div
                style={{
                  display: "flex",
                  border: "1px solid var(--terminal-border-bright)",
                  borderRadius: "5px",
                  overflow: "hidden",
                }}
              >
                {(["code", "tree"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setViewMode(m); if (m !== "tree") setSearchQuery(""); }}
                    style={{
                      fontFamily: monoFont,
                      fontSize: "0.63rem",
                      letterSpacing: "0.06em",
                      padding: "3px 9px",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      backgroundColor:
                        viewMode === m
                          ? "rgba(0,255,136,0.12)"
                          : "transparent",
                      color:
                        viewMode === m
                          ? "var(--terminal-green)"
                          : "var(--code-comment)",
                      borderRight: m === "code" ? "1px solid var(--terminal-border-bright)" : "none",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <StatsBar text={state.output} />
            </div>
          </div>

          {/* Search bar — tree mode only */}
          {viewMode === "tree" && (
            <div
              style={{
                padding: "7px 12px",
                borderBottom: "1px solid var(--terminal-border)",
                backgroundColor: "var(--terminal-surface-2)",
              }}
            >
              <input
                type="text"
                placeholder="Search keys and values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid ${searchQuery ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "4px",
                  padding: "5px 10px",
                  fontFamily: TREE_MONO,
                  fontSize: "0.75rem",
                  color: "var(--foreground)",
                  outline: "none",
                  caretColor: "var(--terminal-green)",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

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
            ) : parsedJson !== null && viewMode === "tree" ? (
              <div
                style={{
                  padding: "14px 16px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <JsonTreeNode
                  value={parsedJson}
                  depth={0}
                  isLast={true}
                  path=""
                  searchQuery={searchQuery}
                />
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
