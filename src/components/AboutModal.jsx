// Feature 5 — About This Data Modal
// Dismissible informational overlay with source, coverage, and fund balance notes.

import { useEffect, useRef } from "react";

const TREASURER_URL = "https://www.nctreasurer.gov/lgc/Pages/AFIR.aspx";

export default function AboutModal({ onClose }) {
  const closeRef = useRef(null);
  const titleId = "about-modal-title";

  // Focus management on open
  useEffect(() => {
    closeRef.current?.focus();
    return () => {};
  }, []);

  // Escape key to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Trap focus inside modal
  const handleKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      e.currentTarget.querySelectorAll('a[href], button, [tabindex="0"]')
    ).filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        style={{
          maxWidth: 560, width: "100%",
          background: "#0d1e2e",
          border: "1px solid #2a3a4a",
          borderRadius: 8,
          padding: 32,
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            color: "#8aa4bc", fontSize: 22, cursor: "pointer",
            lineHeight: 1, padding: "2px 6px", borderRadius: 4,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#e8f1f8"}
          onMouseLeave={e => e.currentTarget.style.color = "#8aa4bc"}
        >
          ×
        </button>

        {/* Title */}
        <h2
          id={titleId}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, fontWeight: 900,
            color: "#e8f1f8", margin: "0 0 24px",
          }}
        >
          About This Data
        </h2>

        {/* Sections */}
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
            style={{ color: "#5FA8D3", fontSize: 13 }}
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
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#5FA8D3", fontWeight: 600, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#8aa4bc", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}
