"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Copy, Check, Upload, ShieldCheck, AlertTriangle, X } from "lucide-react";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type OutputFormat = "hex" | "HEX" | "base64";
type Mode = "text" | "file";

const ALGOS: { id: Algorithm; bits: number; secure: boolean }[] = [
  { id: "MD5",     bits: 128, secure: false },
  { id: "SHA-1",   bits: 160, secure: false },
  { id: "SHA-256", bits: 256, secure: true  },
  { id: "SHA-384", bits: 384, secure: true  },
  { id: "SHA-512", bits: 512, secure: true  },
];

// ─── MD5 (RFC 1321) ──────────────────────────────────────────────────────────
function computeMD5(buffer: ArrayBuffer): string {
  const len = buffer.byteLength;
  const zeros = (64 - (len + 9) % 64) % 64;
  const totalLen = len + 9 + zeros;
  const padded = new Uint8Array(totalLen);
  padded.set(new Uint8Array(buffer));
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  const bitLen = len * 8;
  view.setUint32(totalLen - 8, bitLen >>> 0, true);
  view.setUint32(totalLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

  const T = Array.from({ length: 64 }, (_, i) => (Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0);
  const S = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
  ];

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let off = 0; off < totalLen; off += 64) {
    const M = Array.from({ length: 16 }, (_, j) => view.getUint32(off + j * 4, true));
    let a = a0, b = b0, c = c0, d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if      (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d;           g = (3 * i + 5) % 16; }
      else             { f = c ^ (b | ~d);         g = (7 * i) % 16; }
      f = (f + a + T[i] + M[g]) >>> 0;
      a = d; d = c; c = b;
      b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true); ov.setUint32(4, b0, true);
  ov.setUint32(8, c0, true); ov.setUint32(12, d0, true);
  return Array.from(out).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Hash utilities ───────────────────────────────────────────────────────────
function fmtBytes(bytes: Uint8Array, fmt: OutputFormat): string {
  if (fmt === "base64") return btoa(String.fromCharCode(...bytes));
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return fmt === "HEX" ? hex.toUpperCase() : hex;
}

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from({ length: hex.length / 2 }, (_, i) =>
    parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  );
}

async function computeHash(algo: Algorithm, buf: ArrayBuffer, fmt: OutputFormat): Promise<string> {
  if (algo === "MD5") {
    const hex = computeMD5(buf);
    if (fmt === "HEX") return hex.toUpperCase();
    if (fmt === "base64") return btoa(String.fromCharCode(...hexToBytes(hex)));
    return hex;
  }
  const hashBuf = await crypto.subtle.digest(algo, buf);
  return fmtBytes(new Uint8Array(hashBuf), fmt);
}

async function computeHMAC(algo: Algorithm, buf: ArrayBuffer, key: string, fmt: OutputFormat): Promise<string> {
  const keyBytes = new TextEncoder().encode(key || "");
  const blockSize = 64;

  if (algo === "MD5") {
    let k: Uint8Array = keyBytes;
    if (k.length > blockSize) k = hexToBytes(computeMD5(k.buffer as ArrayBuffer));
    const padKey = new Uint8Array(blockSize);
    padKey.set(k);
    const ipad = padKey.map(v => v ^ 0x36);
    const opad = padKey.map(v => v ^ 0x5c);
    const inner = new Uint8Array(blockSize + buf.byteLength);
    inner.set(ipad); inner.set(new Uint8Array(buf), blockSize);
    const innerBytes = hexToBytes(computeMD5(inner.buffer as ArrayBuffer));
    const outer = new Uint8Array(blockSize + 16);
    outer.set(opad); outer.set(innerBytes, blockSize);
    const resultHex = computeMD5(outer.buffer as ArrayBuffer);
    if (fmt === "HEX") return resultHex.toUpperCase();
    if (fmt === "base64") return btoa(String.fromCharCode(...hexToBytes(resultHex)));
    return resultHex;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: algo }, false, ["sign"]
  );
  const signBuf = await crypto.subtle.sign("HMAC", cryptoKey, buf);
  return fmtBytes(new Uint8Array(signBuf), fmt);
}

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(2)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
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
        padding: small ? "3px 8px" : "4px 10px",
        border: `1px solid ${copied ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "4px",
        backgroundColor: copied ? "rgba(0,255,136,0.08)" : "transparent",
        color: copied ? "var(--terminal-green)" : "var(--comment-gray)",
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
        color: active ? "var(--terminal-green)" : "var(--comment-gray)",
        borderColor: active ? "rgba(0,255,136,0.3)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HashGeneratorClient() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [format, setFormat] = useState<OutputFormat>("hex");
  const [hmacEnabled, setHmacEnabled] = useState(false);
  const [hmacKey, setHmacKey] = useState("");
  const [results, setResults] = useState<Partial<Record<Algorithm, string>>>({});
  const [computing, setComputing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compareInput, setCompareInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computeAll = useCallback(async (buf: ArrayBuffer) => {
    setComputing(true);
    const res: Partial<Record<Algorithm, string>> = {};
    for (const { id } of ALGOS) {
      try {
        res[id] = hmacEnabled
          ? await computeHMAC(id, buf, hmacKey, format)
          : await computeHash(id, buf, format);
      } catch {
        res[id] = "— error —";
      }
    }
    setResults(res);
    setComputing(false);
  }, [format, hmacEnabled, hmacKey]);

  // Text mode: debounced auto-compute
  useEffect(() => {
    if (mode !== "text") return;
    if (!text) { setResults({}); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      computeAll(new TextEncoder().encode(text).buffer as ArrayBuffer);
    }, 80);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text, mode, computeAll]);

  // Re-compute on option change (file mode)
  useEffect(() => {
    if (mode === "file" && fileBuffer) computeAll(fileBuffer);
  }, [format, hmacEnabled, hmacKey, mode, fileBuffer, computeAll]);

  const handleFileSelect = async (f: File) => {
    setFile(f);
    const buf = await f.arrayBuffer();
    setFileBuffer(buf);
    computeAll(buf);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setResults({});
    setCompareInput("");
    if (m === "text") { setFile(null); setFileBuffer(null); }
    else { setText(""); }
  };

  // Compare logic
  const cmpTarget = compareInput.trim().toLowerCase().replace(/\s/g, "");
  const matchedAlgo = cmpTarget
    ? ALGOS.find(a => {
        const v = results[a.id];
        if (!v || v === "— error —") return false;
        return v.toLowerCase() === cmpTarget;
      })
    : undefined;
  const noMatch = cmpTarget.length > 0 && !matchedAlgo;
  const hasResults = Object.keys(results).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
          <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "var(--comment-gray)", opacity: 0.6 }}>
            hash — generator
          </span>
          <div style={{ width: "52px" }} />
        </div>

        {/* Controls */}
        <div style={{ padding: "16px 20px 0", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
          {/* Mode */}
          <div>
            <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--comment-gray)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              // Input
            </p>
            <div style={{ display: "flex", gap: "4px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
              <SegBtn active={mode === "text"} onClick={() => switchMode("text")}>Text</SegBtn>
              <SegBtn active={mode === "file"} onClick={() => switchMode("file")}>File</SegBtn>
            </div>
          </div>

          {/* Output format */}
          <div>
            <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--comment-gray)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              // Output
            </p>
            <div style={{ display: "flex", gap: "4px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
              <SegBtn active={format === "hex"}    onClick={() => setFormat("hex")}>hex</SegBtn>
              <SegBtn active={format === "HEX"}    onClick={() => setFormat("HEX")}>HEX</SegBtn>
              <SegBtn active={format === "base64"} onClick={() => setFormat("base64")}>Base64</SegBtn>
            </div>
          </div>

          {/* HMAC */}
          <div>
            <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--comment-gray)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              // HMAC
            </p>
            <div style={{ display: "flex", gap: "4px", padding: "3px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
              <SegBtn active={!hmacEnabled} onClick={() => setHmacEnabled(false)}>off</SegBtn>
              <SegBtn active={hmacEnabled}  onClick={() => setHmacEnabled(true)}>on</SegBtn>
            </div>
          </div>
        </div>

        {/* HMAC key */}
        {hmacEnabled && (
          <div style={{ padding: "14px 20px 0" }}>
            <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--comment-gray)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              // Secret Key
            </p>
            <input
              type="text"
              value={hmacKey}
              onChange={e => setHmacKey(e.target.value)}
              placeholder="Enter HMAC secret key..."
              style={{
                width: "100%", maxWidth: "420px", padding: "8px 12px",
                fontFamily: monoFont, fontSize: "0.8rem",
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(88,166,255,0.2)",
                borderRadius: "5px", color: "rgba(255,255,255,0.8)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: "16px 20px" }}>
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="// Enter text to hash..."
              spellCheck={false}
              style={{
                width: "100%", minHeight: "120px", padding: "12px 14px",
                fontFamily: monoFont, fontSize: "0.82rem", lineHeight: 1.6,
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(0,255,136,0.12)",
                borderRadius: "6px", color: "rgba(255,255,255,0.85)",
                resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "rgba(0,255,136,0.5)" : file ? "rgba(0,255,136,0.25)" : "rgba(0,255,136,0.1)"}`,
                borderRadius: "8px", padding: "40px 20px", textAlign: "center",
                cursor: "pointer",
                backgroundColor: isDragging ? "rgba(0,255,136,0.04)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              {file ? (
                <div>
                  <p style={{ fontFamily: monoFont, fontSize: "0.88rem", color: "var(--terminal-green)", marginBottom: "4px" }}>
                    {file.name}
                  </p>
                  <p style={{ fontFamily: monoFont, fontSize: "0.72rem", color: "var(--comment-gray)", opacity: 0.6, marginBottom: "10px" }}>
                    {fmtSize(file.size)}{file.type ? ` · ${file.type}` : ""}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setFileBuffer(null); setResults({}); }}
                    style={{
                      padding: "4px 10px", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px", backgroundColor: "transparent",
                      color: "var(--comment-gray)", fontFamily: monoFont, fontSize: "0.68rem",
                      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px",
                    }}
                  >
                    <X size={10} /> Clear file
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={28} style={{ color: "rgba(0,255,136,0.3)", marginBottom: "10px" }} />
                  <p style={{ fontFamily: monoFont, fontSize: "0.82rem", color: "var(--comment-gray)" }}>
                    Drop file here or click to browse
                  </p>
                  <p style={{ fontFamily: monoFont, fontSize: "0.7rem", color: "var(--comment-gray)", opacity: 0.4, marginTop: "4px" }}>
                    Any file type supported — computed entirely in-browser
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ padding: "0 20px 20px" }}>
          {computing && (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: monoFont, fontSize: "0.78rem", color: "var(--comment-gray)", opacity: 0.45 }}>
                // Computing hashes...
              </p>
            </div>
          )}

          {!computing && !hasResults && (
            <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed rgba(0,255,136,0.1)", borderRadius: "6px" }}>
              <p style={{ fontFamily: monoFont, fontSize: "0.78rem", color: "var(--comment-gray)", opacity: 0.4 }}>
                {mode === "text" ? "// Start typing to generate hashes" : "// Upload a file to generate hashes"}
              </p>
            </div>
          )}

          {!computing && hasResults && (
            <>
              <div style={{ border: "1px solid rgba(0,255,136,0.1)", borderRadius: "6px", overflow: "hidden" }}>
                {ALGOS.map(({ id, bits, secure }, i) => {
                  const val = results[id];
                  const isMatch = !!(cmpTarget && matchedAlgo?.id === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px 16px",
                        borderBottom: i < ALGOS.length - 1 ? "1px solid rgba(0,255,136,0.06)" : undefined,
                        backgroundColor: isMatch
                          ? "rgba(0,255,136,0.07)"
                          : i % 2 === 0 ? "transparent" : "rgba(0,255,136,0.015)",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* Algorithm label */}
                      <div style={{ width: "82px", flexShrink: 0 }}>
                        <span style={{ fontFamily: monoFont, fontWeight: 700, fontSize: "0.78rem", color: secure ? "var(--terminal-green)" : "rgba(255,190,80,0.85)" }}>
                          {id}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <span style={{ fontFamily: monoFont, fontSize: "0.58rem", color: "var(--comment-gray)", opacity: 0.5 }}>
                            {bits}-bit
                          </span>
                          {!secure && (
                            <span style={{ fontFamily: monoFont, fontSize: "0.54rem", color: "rgba(255,130,50,0.7)", border: "1px solid rgba(255,130,50,0.25)", borderRadius: "2px", padding: "0 3px" }}>
                              LEGACY
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hash value */}
                      <code style={{
                        flex: 1, fontFamily: monoFont, fontSize: "0.73rem",
                        color: isMatch ? "var(--terminal-green)" : "rgba(255,255,255,0.72)",
                        wordBreak: "break-all", minWidth: 0,
                      }}>
                        {val ?? "—"}
                      </code>

                      {/* Match badge */}
                      {isMatch && (
                        <span style={{ fontFamily: monoFont, fontSize: "0.6rem", color: "var(--terminal-green)", border: "1px solid rgba(0,255,136,0.35)", borderRadius: "3px", padding: "1px 5px", flexShrink: 0 }}>
                          MATCH
                        </span>
                      )}

                      {/* Copy */}
                      {val && val !== "— error —" && <CopyBtn text={val} small />}
                    </div>
                  );
                })}
              </div>

              {/* Compare */}
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--comment-gray)", opacity: 0.55, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  // Compare Hash
                </p>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={compareInput}
                    onChange={e => setCompareInput(e.target.value)}
                    placeholder="Paste a hash to verify against computed results..."
                    style={{
                      width: "100%", padding: "9px 36px 9px 14px",
                      fontFamily: monoFont, fontSize: "0.78rem",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      border: `1px solid ${matchedAlgo ? "rgba(0,255,136,0.4)" : noMatch ? "rgba(255,80,80,0.35)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "5px", color: "rgba(255,255,255,0.8)", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {compareInput && (
                    <button
                      onClick={() => setCompareInput("")}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--comment-gray)", opacity: 0.5, padding: "2px" }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {matchedAlgo && (
                  <p style={{ fontFamily: monoFont, fontSize: "0.72rem", color: "var(--terminal-green)", marginTop: "6px" }}>
                    Matched: {matchedAlgo.id} ({matchedAlgo.bits}-bit)
                  </p>
                )}
                {noMatch && (
                  <p style={{ fontFamily: monoFont, fontSize: "0.72rem", color: "rgba(255,100,100,0.75)", marginTop: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <AlertTriangle size={11} /> No match found across all algorithms
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
