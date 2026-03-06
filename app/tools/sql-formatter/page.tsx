import type { Metadata } from "next";
import SqlFormatterClient from "@/components/tools/sql-formatter/sql-formatter-client";
import ToolNavSidebar from "@/components/layout/tool-nav-sidebar";
import AdUnit from "@/components/ads/ad-unit";

export const metadata: Metadata = {
  title: "The Best SQL Formatter — Free, Instant, Secured, No Server | OmniDev",
  description:
    "Format, beautify, and minify SQL queries instantly in your browser. Supports MySQL, PostgreSQL, T-SQL, SQLite, BigQuery, and more. Keyword case, indentation, syntax highlighting — no server required.",
  keywords: [
    "sql formatter",
    "sql beautifier",
    "sql minifier",
    "format sql online",
    "mysql formatter",
    "postgresql formatter",
    "tsql formatter",
    "sql query formatter",
    "online sql tool",
    "sql syntax highlighter",
  ],
  openGraph: {
    title: "The Best SQL Formatter — Free, Instant, Secured, No Server | OmniDev",
    description:
      "Format, beautify, and minify SQL queries instantly in your browser. Supports MySQL, PostgreSQL, T-SQL, SQLite, BigQuery, and more.",
    url: "https://www.omnidevtools.com/tools/sql-formatter",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "OmniDev SQL Formatter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Best SQL Formatter — Free, Instant, Secured, No Server | OmniDev",
    description:
      "Format, beautify, and minify SQL queries instantly in your browser. Supports MySQL, PostgreSQL, T-SQL, SQLite, BigQuery, and more.",
    images: ["/og-image.jpg"],
  },
};

const monoFont = "'RoundedFixedsys', var(--font-geist-mono), monospace";

export default function SqlFormatterPage() {
  return (
    <main
      className="tool-page-main"
      style={{
        backgroundColor: "var(--terminal-bg)",
        minHeight: "100vh",
        paddingTop: "56px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "SQL Formatter",
            description:
              "Format, beautify, and minify SQL queries instantly in your browser. Supports MySQL, PostgreSQL, T-SQL, SQLite, BigQuery, MariaDB, Spark, Hive, PL/SQL, Snowflake, and Redshift.",
            url: "https://www.omnidevtools.com/tools/sql-formatter",
            image: "https://www.omnidevtools.com/og-image.jpg",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <div
        className="grid-lines-bg"
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />

      <div
        style={{
          maxWidth: "1480px",
          margin: "0 auto",
          padding: "40px 24px 60px",
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: "32px",
          alignItems: "flex-start",
        }}
        className="tool-page-layout"
      >
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Page header */}
          <div
            style={{
              marginBottom: "28px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {/* Left: title */}
            <div>
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.72rem",
                  color: "var(--code-comment)",
                  marginBottom: "10px",
                  letterSpacing: "0.04em",
                }}
              >
                <span style={{ color: "var(--terminal-green)" }}>~</span>
                <span style={{ opacity: 0.5 }}>/tools/</span>
                <span style={{ color: "var(--electric-blue)" }}>sql-formatter</span>
              </p>

              <h1
                style={{
                  fontFamily: monoFont,
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  fontWeight: 700,
                  color: "var(--terminal-green)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  marginBottom: "8px",
                }}
              >
                SQL{" "}
                <span style={{ color: "var(--code-comment)", fontWeight: 400 }}>
                  Formatter
                </span>
              </h1>

              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.82rem",
                  color: "var(--code-comment)",
                  lineHeight: 1.6,
                  maxWidth: "560px",
                }}
              >
                Format, beautify, and minify{" "}
                <span style={{ color: "var(--terminal-green)", opacity: 0.8 }}>
                  SQL queries
                </span>{" "}
                with dialect-aware formatting. Supports MySQL, PostgreSQL, T-SQL, SQLite, BigQuery, and more. Runs entirely in your browser.
              </p>
            </div>

            {/* Right: How to use */}
            <div
              style={{
                border: "1px solid rgba(88,166,255,0.18)",
                borderRadius: "7px",
                backgroundColor: "rgba(88,166,255,0.03)",
                overflow: "hidden",
                flexShrink: 0,
                minWidth: "220px",
                maxWidth: "300px",
              }}
            >
              <div
                style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid rgba(88,166,255,0.12)",
                  backgroundColor: "rgba(88,166,255,0.06)",
                  fontFamily: monoFont,
                  fontSize: "0.65rem",
                  color: "#58a6ff",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                // How to use
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "10px 14px",
                  fontFamily: monoFont,
                  fontSize: "0.7rem",
                  lineHeight: "1.85",
                  color: "var(--code-comment)",
                  whiteSpace: "pre",
                }}
              >
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>1.</span>{" Paste SQL or upload a .sql file\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>2.</span>{" Choose dialect & keyword case\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>3.</span>{" Pick indent (2/4 spaces or tab)\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>4.</span>{" Copy output or download .sql\n"}
                <span style={{ color: "var(--terminal-green)", opacity: 0.7 }}>5.</span>{" Use Minify to compress SQL\n"}
                <span style={{ color: "rgba(88,166,255,0.5)", fontSize: "0.62rem" }}>* all processing happens in browser</span>
              </pre>
            </div>
          </div>

          {/* Tool */}
          <SqlFormatterClient />

          <AdUnit />

          {/* Description section */}
          <div style={{ marginTop: "60px" }}>
            <div style={{ height: "1px", backgroundColor: "rgba(0,255,136,0.1)", marginBottom: "40px" }} />

            <h2
              style={{
                fontFamily: monoFont, fontSize: "1.1rem", fontWeight: 700,
                color: "var(--terminal-green)", marginBottom: "16px",
              }}
            >
              What is a SQL Formatter?
            </h2>
            <p
              style={{
                fontFamily: monoFont, fontSize: "0.82rem", color: "var(--code-comment)",
                lineHeight: 1.85, marginBottom: "14px", maxWidth: "720px",
              }}
            >
              A SQL formatter (also called a SQL beautifier) automatically restructures raw SQL queries into a consistent, readable format. It enforces indentation, keyword casing, and line breaks so queries are easy to read, review, and maintain — regardless of how they were originally written.
            </p>
            <p
              style={{
                fontFamily: monoFont, fontSize: "0.82rem", color: "var(--code-comment)",
                lineHeight: 1.85, marginBottom: "28px", maxWidth: "720px",
              }}
            >
              SQL formatting is critical in professional environments where multiple developers write queries — consistent style reduces cognitive load during code review, makes diffs easier to read, and helps catch logical errors that are obscured by poor indentation.
            </p>

            <h2
              style={{
                fontFamily: monoFont, fontSize: "1.1rem", fontWeight: 700,
                color: "var(--terminal-green)", marginBottom: "16px",
              }}
            >
              Supported Dialects
            </h2>

            <div
              style={{
                border: "1px solid rgba(88,166,255,0.12)",
                borderRadius: "6px",
                backgroundColor: "rgba(88,166,255,0.02)",
                overflow: "hidden",
                marginBottom: "28px",
                maxWidth: "720px",
              }}
            >
              {[
                { dialect: "Standard SQL", desc: "ANSI SQL — the base standard supported by all major databases. Best for generic queries that don't rely on vendor-specific syntax." },
                { dialect: "MySQL / MariaDB", desc: "Supports backtick identifiers, MySQL-specific functions (GROUP_CONCAT, IFNULL), and MariaDB extensions. The most widely deployed open-source RDBMS." },
                { dialect: "PostgreSQL", desc: "Supports dollar-quoting, RETURNING clauses, CTEs, window functions, JSONB operators, and the full feature set of the most advanced open-source database." },
                { dialect: "T-SQL (MSSQL)", desc: "Microsoft SQL Server syntax including TOP, square bracket identifiers, OUTPUT clauses, CROSS APPLY, OUTER APPLY, and system objects." },
                { dialect: "SQLite", desc: "Lightweight embedded database dialect. Useful for mobile apps, Electron apps, and local-first tools. Subset of SQL with some unique pragmas." },
                { dialect: "BigQuery", desc: "Google BigQuery SQL with backtick project.dataset.table identifiers, ARRAY/STRUCT types, UNNEST, QUALIFY, and partitioned table syntax." },
                { dialect: "Spark SQL / Hive", desc: "Distributed query engines used in big data pipelines. Support LATERAL VIEW, MAP/REDUCE hints, and partitioned I/O syntax." },
                { dialect: "PL/SQL (Oracle)", desc: "Oracle's procedural extension to SQL, including BEGIN/END blocks, cursors, ROWNUM/ROWID pseudocolumns, and Oracle-specific date arithmetic." },
                { dialect: "Snowflake / Redshift", desc: "Cloud data warehouse dialects with semi-structured data support (VARIANT, SUPER), COPY commands, and analytics-specific syntax." },
              ].map(({ dialect, desc }, i) => (
                <div
                  key={dialect}
                  style={{
                    display: "flex", gap: "16px", padding: "12px 18px",
                    borderBottom: i < 8 ? "1px solid rgba(88,166,255,0.06)" : undefined,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flexShrink: 0, width: "130px" }}>
                    <code style={{ fontFamily: monoFont, fontSize: "0.75rem", fontWeight: 700, color: "var(--terminal-green)" }}>
                      {dialect}
                    </code>
                  </div>
                  <p style={{ fontFamily: monoFont, fontSize: "0.72rem", color: "var(--code-comment)", lineHeight: 1.65, opacity: 0.75 }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <h2
              style={{
                fontFamily: monoFont, fontSize: "1.1rem", fontWeight: 700,
                color: "var(--terminal-green)", marginBottom: "16px",
              }}
            >
              Format vs Minify
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "10px", maxWidth: "720px", marginBottom: "28px",
              }}
            >
              {[
                { title: "Format (Beautify)", desc: "Expands a compressed or unformatted query into a multi-line, indented, human-readable form. Best for code review, debugging, and documentation." },
                { title: "Minify (Compress)", desc: "Collapses a formatted query into a single line with minimal whitespace. Useful for embedding SQL in code strings, reducing payload size, or obfuscating query structure." },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  style={{
                    padding: "14px 16px",
                    border: "1px solid rgba(0,255,136,0.08)",
                    borderRadius: "6px",
                    backgroundColor: "rgba(0,255,136,0.02)",
                  }}
                >
                  <p style={{ fontFamily: monoFont, fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: "6px" }}>
                    {title}
                  </p>
                  <p style={{ fontFamily: monoFont, fontSize: "0.72rem", color: "var(--code-comment)", lineHeight: 1.6, opacity: 0.75 }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <h2
              style={{
                fontFamily: monoFont, fontSize: "1.1rem", fontWeight: 700,
                color: "var(--terminal-green)", marginBottom: "16px",
              }}
            >
              Common Use Cases
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "10px", maxWidth: "720px",
              }}
            >
              {[
                { title: "Code Review", desc: "Normalize query formatting before committing to version control so diffs reflect logic changes rather than whitespace differences." },
                { title: "ORM Output Cleanup", desc: "ORMs like Hibernate, ActiveRecord, and Prisma often generate hard-to-read SQL. Format the logged query to understand what's being executed." },
                { title: "Legacy Query Migration", desc: "Clean up old, inconsistent SQL when migrating from one database system to another or refactoring stored procedures." },
                { title: "Documentation", desc: "Format queries for README files, blog posts, or internal wikis so readers can follow query structure without effort." },
                { title: "Query Debugging", desc: "Unminify a compressed SQL string from a log file or error report to identify exactly which clause caused the issue." },
                { title: "Interview Prep", desc: "Practice writing clean, consistently formatted SQL that meets professional coding standards expected in technical interviews." },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(0,255,136,0.08)",
                    borderRadius: "6px",
                    backgroundColor: "rgba(0,255,136,0.02)",
                  }}
                >
                  <p style={{ fontFamily: monoFont, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: "5px" }}>
                    {title}
                  </p>
                  <p style={{ fontFamily: monoFont, fontSize: "0.72rem", color: "var(--code-comment)", lineHeight: 1.6, opacity: 0.75 }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <ToolNavSidebar currentTool="sql-formatter" />
      </div>
    </main>
  );
}
