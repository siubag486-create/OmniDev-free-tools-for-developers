"use client";

import { useState } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwIeFhidRD8ztFopSQJEg06XTzhDT1rP6yxMT_ZngnNrnXbjRs1cqtgxKIAptMy65NkkQ/exec";

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

type MessageType = "feature_request" | "bug_report" | "general";

const TYPES: MessageType[] = ["feature_request", "bug_report", "general"];

export default function ContactFormClient() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<MessageType>("feature_request");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<"email" | "message" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setPending(true);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email,
          Type: type,
          "Feature Request": message,
        }),
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          border: "1px solid rgba(0,255,136,0.2)",
          borderRadius: "8px",
          backgroundColor: "rgba(0,0,0,0.3)",
          padding: "28px 24px",
          fontFamily: monoFont,
        }}
      >
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--comment-gray)",
            marginBottom: "16px",
          }}
        >
          <span style={{ color: "var(--terminal-green)" }}>$</span>{" "}
          ./send_message --exec
        </p>
        <div style={{ lineHeight: 2 }}>
          <p style={{ fontSize: "0.78rem", color: "var(--comment-gray)" }}>
            &gt; Connecting...
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--terminal-green)" }}>
            ✓ Message queued successfully.
          </p>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--comment-gray)",
              opacity: 0.6,
              marginTop: "4px",
            }}
          >
            # Reply will be sent to{" "}
            <span style={{ color: "var(--electric-blue)" }}>{email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          border: "1px solid rgba(0,255,136,0.15)",
          borderRadius: "8px",
          backgroundColor: "rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Terminal title bar */}
        <div
          style={{
            borderBottom: "1px solid rgba(0,255,136,0.1)",
            padding: "9px 16px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            backgroundColor: "rgba(0,255,136,0.025)",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              display: "inline-block",
              backgroundColor: "rgba(255,95,86,0.65)",
            }}
          />
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              display: "inline-block",
              backgroundColor: "rgba(255,189,46,0.65)",
            }}
          />
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              display: "inline-block",
              backgroundColor: "rgba(39,201,63,0.65)",
            }}
          />
          <span
            style={{
              fontFamily: monoFont,
              fontSize: "0.63rem",
              color: "var(--comment-gray)",
              opacity: 0.45,
              marginLeft: "10px",
            }}
          >
            send_message.sh
          </span>
        </div>

        {/* Form body */}
        <div style={{ padding: "24px 22px 26px" }}>
          {/* Email field */}
          <div style={{ marginBottom: "26px" }}>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: "0.7rem",
                color: "var(--comment-gray)",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "var(--terminal-green)", opacity: 0.85 }}>
                root@omnidev
              </span>
              <span style={{ opacity: 0.4 }}>:~$</span>{" "}
              <span style={{ color: "rgba(88,166,255,0.8)" }}>--email</span>
              <span style={{ color: "var(--comment-gray)", opacity: 0.3 }}>
                {" "}
                &lt;your@email.com&gt;
              </span>
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: `1px solid ${
                  focused === "email"
                    ? "rgba(0,255,136,0.45)"
                    : "rgba(0,255,136,0.12)"
                }`,
                paddingBottom: "7px",
                transition: "border-color 0.15s",
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.82rem",
                  color: "var(--terminal-green)",
                  opacity: 0.9,
                  flexShrink: 0,
                }}
              >
                &gt;
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="your@email.com"
                className="terminal-input"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: monoFont,
                  fontSize: "0.82rem",
                  color: "rgba(255,255,255,0.88)",
                  caretColor: "var(--terminal-green)",
                }}
              />
            </div>
          </div>

          {/* Type field */}
          <div style={{ marginBottom: "26px" }}>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: "0.7rem",
                color: "var(--comment-gray)",
                marginBottom: "12px",
              }}
            >
              <span style={{ color: "var(--terminal-green)", opacity: 0.85 }}>
                root@omnidev
              </span>
              <span style={{ opacity: 0.4 }}>:~$</span>{" "}
              <span style={{ color: "rgba(88,166,255,0.8)" }}>--type</span>
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                paddingLeft: "18px",
              }}
            >
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.72rem",
                    padding: "3px 10px",
                    borderRadius: "3px",
                    border: `1px solid ${
                      type === t
                        ? "rgba(0,255,136,0.5)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    backgroundColor:
                      type === t ? "rgba(0,255,136,0.08)" : "transparent",
                    color:
                      type === t ? "var(--terminal-green)" : "var(--comment-gray)",
                    cursor: "pointer",
                    transition: "all 0.12s",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span style={{ opacity: 0.5 }}>[</span>
                  <span
                    style={{
                      color:
                        type === t ? "var(--terminal-green)" : "transparent",
                    }}
                  >
                    x
                  </span>
                  <span style={{ opacity: 0.5 }}>]</span> {t}
                </button>
              ))}
            </div>
          </div>

          {/* Message field */}
          <div style={{ marginBottom: "28px" }}>
            <p
              style={{
                fontFamily: monoFont,
                fontSize: "0.7rem",
                color: "var(--comment-gray)",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "var(--terminal-green)", opacity: 0.85 }}>
                root@omnidev
              </span>
              <span style={{ opacity: 0.4 }}>:~$</span>{" "}
              <span style={{ color: "rgba(88,166,255,0.8)" }}>--message</span>
            </p>
            <div
              style={{
                border: `1px solid ${
                  focused === "message"
                    ? "rgba(0,255,136,0.25)"
                    : "rgba(255,255,255,0.07)"
                }`,
                borderRadius: "4px",
                padding: "10px 12px",
                transition: "border-color 0.15s",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: "0.82rem",
                    color: "var(--terminal-green)",
                    opacity: 0.9,
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  &gt;
                </span>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                  placeholder="Describe your feature request or bug in detail..."
                  rows={5}
                  className="terminal-input"
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontFamily: monoFont,
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.88)",
                    caretColor: "var(--terminal-green)",
                    resize: "vertical",
                    lineHeight: "1.75",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              style={{
                fontFamily: monoFont,
                fontSize: "0.72rem",
                color: "#ff7b72",
                marginBottom: "12px",
              }}
            >
              <span style={{ opacity: 0.6 }}>!</span> {error}
            </p>
          )}

          {/* Submit button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingTop: "4px",
            }}
          >
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "0.72rem",
                color: "var(--comment-gray)",
                opacity: 0.4,
              }}
            >
              $
            </span>
            <button
              type="submit"
              disabled={pending}
              style={{
                fontFamily: monoFont,
                fontSize: "0.78rem",
                color: "#0a0a0a",
                backgroundColor: "var(--terminal-green)",
                border: "none",
                borderRadius: "3px",
                padding: "7px 18px",
                cursor: pending ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
                fontWeight: 700,
                transition: "opacity 0.15s",
                opacity: pending ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!pending) e.currentTarget.style.opacity = "0.82";
              }}
              onMouseLeave={(e) => {
                if (!pending) e.currentTarget.style.opacity = "1";
              }}
            >
              {pending ? "> sending..." : "./send_message --exec →"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
