"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, RefreshCw, ShieldCheck, Clock, Trash2, ChevronDown, Search } from "lucide-react";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

type TabId = "unix-to-date" | "date-to-unix";
type Unit = "seconds" | "milliseconds";

const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "Local (system)", value: "local" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "America/Los_Angeles", value: "America/Los_Angeles" },
  { label: "America/Chicago", value: "America/Chicago" },
  { label: "America/Denver", value: "America/Denver" },
  { label: "America/Toronto", value: "America/Toronto" },
  { label: "America/Vancouver", value: "America/Vancouver" },
  { label: "America/Sao_Paulo", value: "America/Sao_Paulo" },
  { label: "America/Mexico_City", value: "America/Mexico_City" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "Europe/Paris", value: "Europe/Paris" },
  { label: "Europe/Berlin", value: "Europe/Berlin" },
  { label: "Europe/Amsterdam", value: "Europe/Amsterdam" },
  { label: "Europe/Madrid", value: "Europe/Madrid" },
  { label: "Europe/Rome", value: "Europe/Rome" },
  { label: "Europe/Moscow", value: "Europe/Moscow" },
  { label: "Europe/Istanbul", value: "Europe/Istanbul" },
  { label: "Asia/Seoul", value: "Asia/Seoul" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
  { label: "Asia/Shanghai", value: "Asia/Shanghai" },
  { label: "Asia/Hong_Kong", value: "Asia/Hong_Kong" },
  { label: "Asia/Singapore", value: "Asia/Singapore" },
  { label: "Asia/Taipei", value: "Asia/Taipei" },
  { label: "Asia/Bangkok", value: "Asia/Bangkok" },
  { label: "Asia/Jakarta", value: "Asia/Jakarta" },
  { label: "Asia/Kolkata", value: "Asia/Kolkata" },
  { label: "Asia/Dubai", value: "Asia/Dubai" },
  { label: "Asia/Riyadh", value: "Asia/Riyadh" },
  { label: "Asia/Karachi", value: "Asia/Karachi" },
  { label: "Asia/Dhaka", value: "Asia/Dhaka" },
  { label: "Asia/Colombo", value: "Asia/Colombo" },
  { label: "Asia/Kathmandu", value: "Asia/Kathmandu" },
  { label: "Asia/Almaty", value: "Asia/Almaty" },
  { label: "Asia/Tashkent", value: "Asia/Tashkent" },
  { label: "Asia/Beirut", value: "Asia/Beirut" },
  { label: "Asia/Jerusalem", value: "Asia/Jerusalem" },
  { label: "Africa/Cairo", value: "Africa/Cairo" },
  { label: "Africa/Lagos", value: "Africa/Lagos" },
  { label: "Africa/Nairobi", value: "Africa/Nairobi" },
  { label: "Africa/Johannesburg", value: "Africa/Johannesburg" },
  { label: "Australia/Sydney", value: "Australia/Sydney" },
  { label: "Australia/Melbourne", value: "Australia/Melbourne" },
  { label: "Australia/Brisbane", value: "Australia/Brisbane" },
  { label: "Australia/Perth", value: "Australia/Perth" },
  { label: "Pacific/Auckland", value: "Pacific/Auckland" },
  { label: "Pacific/Honolulu", value: "Pacific/Honolulu" },
  { label: "Pacific/Fiji", value: "Pacific/Fiji" },
];

// ── Timezone Searchable Dropdown ──────────────────────────────────────────────

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = TIMEZONES.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.value.toLowerCase().includes(search.toLowerCase())
  );

  const selected = TIMEZONES.find((t) => t.value === value);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 240),
      });
    }
    setOpen((o) => !o);
    setSearch("");
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const dropdown = document.getElementById("tz-dropdown");
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
      id="tz-dropdown"
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
        border: "1px solid rgba(88,166,255,0.2)",
        borderRadius: "8px",
        background: "#0d1117",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
      }}
    >
      {/* Search input */}
      <div style={{ padding: "8px", borderBottom: "1px solid rgba(88,166,255,0.1)", display: "flex", alignItems: "center", gap: "6px" }}>
        <Search size={12} style={{ color: "var(--code-comment)", opacity: 0.5, flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search timezone..."
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontFamily: monoFont, fontSize: "0.72rem", color: "#e6edf3",
          }}
        />
      </div>

      {/* Options */}
      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "12px 14px", fontFamily: monoFont, fontSize: "0.72rem", color: "var(--code-comment)", opacity: 0.5 }}>
            No results
          </div>
        ) : (
          filtered.map((t) => (
            <button
              key={t.value}
              onClick={() => { onChange(t.value); setOpen(false); setSearch(""); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 14px", fontFamily: monoFont, fontSize: "0.72rem",
                border: "none", cursor: "pointer",
                background: t.value === value ? "rgba(0,255,136,0.08)" : "none",
                color: t.value === value ? "var(--terminal-green)" : "var(--code-comment)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (t.value !== value) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (t.value !== value) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {t.label}
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
          fontFamily: monoFont, fontSize: "0.72rem", padding: "5px 10px",
          borderRadius: "6px", border: "1px solid rgba(88,166,255,0.15)",
          background: "rgba(10,14,26,0.8)", color: "var(--code-comment)",
          outline: "none", cursor: "pointer", minWidth: "180px",
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

function formatDate(date: Date, tz: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz === "local" ? undefined : tz,
  };
  return new Intl.DateTimeFormat("en-CA", options).format(date).replace(",", "");
}

function formatISO(date: Date, tz: string): string {
  if (tz === "UTC") return date.toISOString();
  if (tz === "local") return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
  try {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: tz, hour12: false,
    }).format(date);
    return parts.replace(" ", "T");
  } catch {
    return date.toISOString();
  }
}

function getRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const sign = diff >= 0 ? "" : "in ";
  const suffix = diff >= 0 ? " ago" : "";
  if (abs < 60000) return `${sign}${Math.floor(abs / 1000)}s${suffix}`;
  if (abs < 3600000) return `${sign}${Math.floor(abs / 60000)}m${suffix}`;
  if (abs < 86400000) return `${sign}${Math.floor(abs / 3600000)}h${suffix}`;
  if (abs < 2592000000) return `${sign}${Math.floor(abs / 86400000)}d${suffix}`;
  if (abs < 31536000000) return `${sign}${Math.floor(abs / 2592000000)}mo${suffix}`;
  return `${sign}${Math.floor(abs / 31536000000)}y${suffix}`;
}

function WindowDots() {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      {(["#ff5f56", "#ffbd2e", "#27c93f"] as const).map((color) => (
        <div key={color} style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, opacity: 0.85, flexShrink: 0 }} />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: monoFont, fontSize: "0.68rem", padding: "3px 8px", borderRadius: "4px", cursor: "pointer", border: copied ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(88,166,255,0.2)", background: copied ? "rgba(0,255,136,0.08)" : "rgba(88,166,255,0.05)", color: copied ? "var(--terminal-green)" : "var(--code-comment)", transition: "all 0.15s" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(0,255,136,0.06)", gap: "12px" }}>
      <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "rgba(0,255,136,0.5)", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontFamily: monoFont, fontSize: "0.8rem", color: "#e6edf3", wordBreak: "break-all" }}>{value}</span>
      <CopyButton text={value} />
    </div>
  );
}

// ── Unix → Date tab ────────────────────────────────────────────────────────────

function UnixToDateTab() {
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<Unit>("seconds");
  const [tz, setTz] = useState("UTC");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const useNow = () => {
    const ts = unit === "seconds" ? Math.floor(Date.now() / 1000) : Date.now();
    setInput(String(ts));
  };

  const timestamp = input.trim();
  let date: Date | null = null;
  let parseError = "";

  if (timestamp) {
    const num = Number(timestamp);
    if (isNaN(num)) {
      parseError = "Not a valid number";
    } else {
      const ms = unit === "seconds" ? num * 1000 : num;
      if (ms < -8640000000000000 || ms > 8640000000000000) {
        parseError = "Timestamp out of valid range";
      } else {
        date = new Date(ms);
      }
    }
  }

  const targetTz = tz === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* Unit toggle */}
        <div style={{ display: "flex", border: "1px solid rgba(88,166,255,0.15)", borderRadius: "6px", overflow: "hidden" }}>
          {(["seconds", "milliseconds"] as Unit[]).map((u) => (
            <button key={u} onClick={() => setUnit(u)} style={{ fontFamily: monoFont, fontSize: "0.72rem", padding: "5px 14px", border: "none", cursor: "pointer", background: unit === u ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.02)", color: unit === u ? "var(--terminal-green)" : "var(--code-comment)", borderRight: u === "seconds" ? "1px solid rgba(88,166,255,0.15)" : "none", transition: "all 0.15s" }}>
              {u === "seconds" ? "Seconds" : "Milliseconds"}
            </button>
          ))}
        </div>

        {/* Timezone */}
        <TimezoneSelect value={tz} onChange={setTz} />

        <div style={{ flex: 1 }} />

        <button onClick={useNow} style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: monoFont, fontSize: "0.72rem", padding: "5px 12px", borderRadius: "5px", cursor: "pointer", border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.05)", color: "var(--code-comment)", transition: "all 0.15s" }}>
          <Clock size={12} />
          Use Now
        </button>
        <button onClick={() => setInput("")} style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: monoFont, fontSize: "0.72rem", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", border: "1px solid rgba(255,123,114,0.2)", background: "rgba(255,123,114,0.04)", color: "var(--code-comment)", transition: "all 0.15s" }}>
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Input */}
      <div style={{ border: "1px solid rgba(88,166,255,0.15)", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "6px 14px", borderBottom: "1px solid rgba(88,166,255,0.1)", backgroundColor: "rgba(88,166,255,0.04)", fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", letterSpacing: "0.08em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>UNIX TIMESTAMP ({unit.toUpperCase()})</span>
          <span style={{ color: "rgba(0,255,136,0.4)", fontSize: "0.62rem" }}>
            Now: {unit === "seconds" ? Math.floor(now / 1000) : now}
          </span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={unit === "seconds" ? "e.g. 1700000000" : "e.g. 1700000000000"}
          spellCheck={false}
          style={{ width: "100%", padding: "14px", background: "rgba(10,14,26,0.8)", border: "none", outline: "none", fontFamily: monoFont, fontSize: "1rem", color: parseError ? "#ff7b72" : "#e6edf3", boxSizing: "border-box" }}
        />
      </div>

      {/* Error */}
      {parseError && (
        <div style={{ fontFamily: monoFont, fontSize: "0.78rem", color: "#ff7b72", padding: "8px 12px", border: "1px solid rgba(255,123,114,0.2)", borderRadius: "6px", background: "rgba(255,123,114,0.04)" }}>
          {parseError}
        </div>
      )}

      {/* Results */}
      {date && !parseError && (
        <div style={{ border: "1px solid rgba(0,255,136,0.15)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "7px 16px", borderBottom: "1px solid rgba(0,255,136,0.1)", backgroundColor: "rgba(0,255,136,0.05)", fontFamily: monoFont, fontSize: "0.65rem", color: "rgba(0,255,136,0.6)", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>RESULT</span>
            <span style={{ color: "rgba(0,255,136,0.4)" }}>tz: {tz === "local" ? targetTz : tz}</span>
          </div>
          <ResultRow label="Local (readable)" value={formatDate(date, tz)} />
          <ResultRow label="ISO 8601" value={formatISO(date, tz)} />
          <ResultRow label="UTC" value={date.toUTCString()} />
          <ResultRow label="Unix (seconds)" value={String(Math.floor(date.getTime() / 1000))} />
          <ResultRow label="Unix (ms)" value={String(date.getTime())} />
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "rgba(0,255,136,0.5)", letterSpacing: "0.06em", width: "160px" }}>RELATIVE</span>
            <span style={{ fontFamily: monoFont, fontSize: "0.8rem", color: "var(--electric-blue)" }}>{getRelative(date)}</span>
          </div>
        </div>
      )}

      {!input.trim() && (
        <div style={{ fontFamily: monoFont, fontSize: "0.78rem", color: "var(--code-comment)", opacity: 0.4, textAlign: "center", padding: "20px" }}>
          Enter a Unix timestamp to convert
        </div>
      )}
    </div>
  );
}

// ── Date → Unix tab ────────────────────────────────────────────────────────────

function DateToUnixTab() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [tz, setTz] = useState("UTC");

  const useNow = useCallback(() => {
    const n = new Date();
    const fmt = new Intl.DateTimeFormat("sv-SE", {
      timeZone: tz === "local" ? undefined : tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    const parts = fmt.format(n); // "2024-01-15 09:30:00"
    const [d, t] = parts.split(" ");
    setDate(d);
    setTime(t);
  }, [tz]);

  let result: Date | null = null;
  let parseError = "";

  try {
    const iso = `${date}T${time || "00:00:00"}`;

    if (!date) throw new Error("no date");

    if (tz === "UTC") {
      result = new Date(iso + "Z");
    } else if (tz === "local") {
      result = new Date(iso);
    } else {
      // Binary search for the UTC time whose representation in `tz` matches the input.
      // This correctly handles DST transitions.
      const target = iso; // e.g. "2024-03-10T02:30:00"
      const fmt = new Intl.DateTimeFormat("sv-SE", {
        timeZone: tz,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      });
      const toLocal = (utcMs: number) => fmt.format(new Date(utcMs)).replace(" ", "T");

      // Start with a rough estimate: treat input as UTC then shift by timezone offset
      let lo = new Date(iso + "Z").getTime() - 14 * 3600000;
      let hi = new Date(iso + "Z").getTime() + 14 * 3600000;

      for (let i = 0; i < 40; i++) {
        const mid = Math.floor((lo + hi) / 2);
        if (toLocal(mid) < target) lo = mid + 1;
        else hi = mid;
      }

      result = new Date(lo);
      // Validate: the result's local representation must match input
      if (toLocal(lo) !== target) {
        parseError = "This time doesn't exist in the selected timezone (DST gap)";
        result = null;
      }
    }

    if (result && isNaN(result.getTime())) {
      parseError = "Invalid date or time";
      result = null;
    }
  } catch {
    parseError = "Invalid date or time";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <TimezoneSelect value={tz} onChange={setTz} />
        <div style={{ flex: 1 }} />
        <button onClick={useNow} style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: monoFont, fontSize: "0.72rem", padding: "5px 12px", borderRadius: "5px", cursor: "pointer", border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.05)", color: "var(--code-comment)", transition: "all 0.15s" }}>
          <RefreshCw size={12} />
          Use Now
        </button>
        <button onClick={() => { setDate(""); setTime(""); }} style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: monoFont, fontSize: "0.72rem", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", border: "1px solid rgba(255,123,114,0.2)", background: "rgba(255,123,114,0.04)", color: "var(--code-comment)", transition: "all 0.15s" }}>
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Date + Time inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ border: "1px solid rgba(88,166,255,0.15)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "6px 14px", borderBottom: "1px solid rgba(88,166,255,0.1)", backgroundColor: "rgba(88,166,255,0.04)", fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", letterSpacing: "0.08em" }}>DATE (YYYY-MM-DD)</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "12px 14px", background: "rgba(10,14,26,0.8)", border: "none", outline: "none", fontFamily: monoFont, fontSize: "0.9rem", color: "#e6edf3", boxSizing: "border-box", colorScheme: "dark" }} />
        </div>
        <div style={{ border: "1px solid rgba(88,166,255,0.15)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "6px 14px", borderBottom: "1px solid rgba(88,166,255,0.1)", backgroundColor: "rgba(88,166,255,0.04)", fontFamily: monoFont, fontSize: "0.65rem", color: "var(--code-comment)", letterSpacing: "0.08em" }}>TIME (HH:MM:SS)</div>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} step="1" style={{ width: "100%", padding: "12px 14px", background: "rgba(10,14,26,0.8)", border: "none", outline: "none", fontFamily: monoFont, fontSize: "0.9rem", color: "#e6edf3", boxSizing: "border-box", colorScheme: "dark" }} />
        </div>
      </div>

      {parseError && (
        <div style={{ fontFamily: monoFont, fontSize: "0.78rem", color: "#ff7b72", padding: "8px 12px", border: "1px solid rgba(255,123,114,0.2)", borderRadius: "6px", background: "rgba(255,123,114,0.04)" }}>
          {parseError}
        </div>
      )}

      {result && !parseError && (
        <div style={{ border: "1px solid rgba(0,255,136,0.15)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "7px 16px", borderBottom: "1px solid rgba(0,255,136,0.1)", backgroundColor: "rgba(0,255,136,0.05)", fontFamily: monoFont, fontSize: "0.65rem", color: "rgba(0,255,136,0.6)", letterSpacing: "0.1em" }}>
            RESULT
          </div>
          <ResultRow label="Unix (seconds)" value={String(Math.floor(result.getTime() / 1000))} />
          <ResultRow label="Unix (ms)" value={String(result.getTime())} />
          <ResultRow label="ISO 8601 (UTC)" value={result.toISOString()} />
          <ResultRow label="UTC String" value={result.toUTCString()} />
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "rgba(0,255,136,0.5)", letterSpacing: "0.06em", width: "160px" }}>RELATIVE</span>
            <span style={{ fontFamily: monoFont, fontSize: "0.8rem", color: "var(--electric-blue)" }}>{getRelative(result)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "unix-to-date", label: "Unix → Date" },
  { id: "date-to-unix", label: "Date → Unix" },
];

export default function TimestampConverterClient() {
  const [activeTab, setActiveTab] = useState<TabId>("unix-to-date");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(0,255,136,0.15)", backgroundColor: "rgba(0,255,136,0.05)", width: "fit-content" }}>
        <ShieldCheck size={12} style={{ color: "var(--terminal-green)", flexShrink: 0 }} />
        <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "var(--code-comment)" }}>100% client-side — no data leaves your browser</span>
      </div>

      <div style={{ border: "1px solid var(--terminal-border)", borderRadius: "10px", overflow: "hidden", backgroundColor: "rgba(10, 14, 26, 0.6)" }}>
        {/* Titlebar */}
        <div style={{ backgroundColor: "rgba(16, 16, 16, 0.99)", borderBottom: "1px solid var(--terminal-border)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <WindowDots />
          <span style={{ fontFamily: monoFont, fontSize: "0.68rem", color: "var(--code-comment)", opacity: 0.5, letterSpacing: "0.06em" }}>
            timestamp-converter — unix ↔ datetime
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--terminal-border)", backgroundColor: "rgba(16,16,16,0.5)" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily: monoFont, fontSize: "0.72rem", padding: "9px 18px", border: "none", borderBottom: activeTab === tab.id ? "2px solid var(--terminal-green)" : "2px solid transparent", cursor: "pointer", background: "none", color: activeTab === tab.id ? "var(--terminal-green)" : "var(--code-comment)", letterSpacing: "0.04em", transition: "all 0.15s", marginBottom: "-1px" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {activeTab === "unix-to-date" && <UnixToDateTab />}
          {activeTab === "date-to-unix" && <DateToUnixTab />}
        </div>
      </div>
    </div>
  );
}
