// Feature 5 — About This Data Modal

import { useEffect, useRef } from "react";

const TREASURER_URL = "https://www.nctreasurer.gov/lgc/Pages/AFIR.aspx";

export default function AboutModal({ onClose }) {
  const closeRef = useRef(null);
  const titleId  = "about-modal-title";

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      e.currentTarget.querySelectorAll('a[href], button, [tabindex="0"]')
    ).filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="fade-in-up"
        style={{
          maxWidth: 560, width: "100%",
          background: "#FFFFFF",
          border: "1px solid #E8E7E4",
          borderRadius: 12,
          padding: "32px 36px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="btn-interactive"
          style={{
            position: "absolute", top: 16, right: 16,
            background: "#F3F2F0",
            border: "none",
            color: "#6B7280",
            fontSize: 18,
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px 8px",
            borderRadius: 6,
            width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#E8E7E4"; e.currentTarget.style.color = "#111827"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#F3F2F0"; e.currentTarget.style.color = "#6B7280"; }}
        >
          ×
        </button>

        <h2
          id={titleId}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 28px",
            letterSpacing: "-0.3px",
          }}
        >
          About This Data
        </h2>

        <Section title="Source">
          This tool uses data from the Annual Financial Information Report (AFIR),
          published by the NC Department of State Treasurer. AFIR collects financial
          data submitted directly by local governments.
        </Section>

        <Section title="Fiscal Year">
          Data reflects fiscal year ending June 30, 2025.
        </Section>

        <Section title="Coverage">
          75 of North Carolina's 100 counties are included. Counties may be absent
          because they had not yet filed their audit at the time of data export, or
          because their AFIR submission was incomplete.
        </Section>

        <Section title="Fund Balance">
          <p style={{ margin: "0 0 10px" }}>
            Fund balance data reflects General Fund Balance Available (FBA) as reported
            in each county's audit. Bladen and Greene counties are included in the dataset
            but did not file audits captured by this AFIR export — fund balance figures
            are unavailable for these two counties.
          </p>
          <p style={{ margin: 0 }}>
            The NC Local Government Commission recommends that counties maintain a
            General Fund balance of at least 8% of net expenditures (G.S. 159-8).
          </p>
        </Section>

        <Section title="Learn More">
          <a
            href={TREASURER_URL}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={0}
            style={{
              color: "#1D4ED8",
              fontSize: 13,
              textDecoration: "none",
              borderBottom: "1px solid rgba(29,78,216,0.3)",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#1D4ED8"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(29,78,216,0.3)"}
          >
            NC Department of State Treasurer — Local Government Financial Data
          </a>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: "#1D4ED8",
        fontWeight: 700,
        marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
