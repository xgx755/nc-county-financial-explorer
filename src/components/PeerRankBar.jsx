// Feature 2 — Peer Group Rankings Bar
// Hover to explore peer counties (tooltip follows cursor).
// Click to pin a county in place — pinned info persists after hover ends.
// The selected county's dot and labels always remain visible.

import { useMemo, useState, useRef, useCallback } from "react";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtMetricValue(value, metricKey) {
  if (value == null) return "N/A";
  if (metricKey === "fb.pct") return (value * 100).toFixed(1) + "%";
  if (metricKey === "tax.effective_rate") return "$" + value.toFixed(3);
  return "$" + Math.round(value).toLocaleString();
}

function getMetricValue(county, metricKey) {
  if (metricKey === "pr.Total Revenue")      return county.pr?.["Total Revenue"]      ?? null;
  if (metricKey === "pe.Total Expenditures") return county.pe?.["Total Expenditures"] ?? null;
  if (metricKey === "fb.pct")                return county.fb?.pct ?? null;
  if (metricKey === "tax.effective_rate")    return county.tax?.effective_rate ?? null;
  return null;
}

function metricLabel(metricKey) {
  if (metricKey === "pr.Total Revenue")      return "Revenue per capita";
  if (metricKey === "pe.Total Expenditures") return "Expenditure per capita";
  if (metricKey === "fb.pct")                return "Fund Balance %";
  if (metricKey === "tax.effective_rate")    return "Effective county tax rate";
  return metricKey;
}

// Derive county-at-rank info from a sorted array + index
function countyInfoFromIdx(idx, sorted, validPeers, metricKey, total) {
  if (idx === null || idx === undefined) return null;
  const c     = sorted[idx];
  const val   = getMetricValue(c, metricKey);
  const rank  = validPeers.filter(p => getMetricValue(p, metricKey) > val).length + 1;
  const isTie = validPeers.filter(p => getMetricValue(p, metricKey) === val).length > 1;
  const pos   = total > 1 ? idx / (total - 1) : 0;
  return { county: c, val, rank, isTie, rankLabel: `${isTie ? "T-" : ""}${ordinal(rank)} of ${total}`, pos };
}

export default function PeerRankBar({ DATA, county, compare, metricKey }) {
  const [hoverIdx,  setHoverIdx]  = useState(null); // follows mouse
  const [lockedIdx, setLockedIdx] = useState(null); // pinned on click
  const trackRef = useRef(null);

  const primaryNull = metricKey === "fb.pct" && county.fb == null;

  const peers = useMemo(
    () => DATA.filter(c => c.pg === county.pg),
    [DATA, county.pg]
  );
  const validPeers = useMemo(
    () => peers.filter(c => getMetricValue(c, metricKey) != null),
    [peers, metricKey]
  );
  const sorted = useMemo(
    () => [...validPeers].sort((a, b) => getMetricValue(a, metricKey) - getMetricValue(b, metricKey)),
    [validPeers, metricKey]
  );
  const total = sorted.length;

  if (peers.length < 2 || primaryNull) return null;

  // ── Primary county ────────────────────────────────────────────────────────
  const myVal      = getMetricValue(county, metricKey);
  const ascRankIdx = sorted.findIndex(c => getMetricValue(c, metricKey) >= myVal);
  const position   = total > 1 ? (ascRankIdx === -1 ? 1 : ascRankIdx / (total - 1)) : 0;
  const rank       = validPeers.filter(c => getMetricValue(c, metricKey) > myVal).length + 1;
  const isTie      = validPeers.filter(c => getMetricValue(c, metricKey) === myVal).length > 1;
  const rankLabel  = `${isTie ? "T-" : ""}${ordinal(rank)} of ${total}`;

  // ── Compare county ────────────────────────────────────────────────────────
  const sameGroup    = compare && compare.pg === county.pg;
  const compareValue = compare ? getMetricValue(compare, metricKey) : null;
  const compareAscIdx = sameGroup && compareValue != null
    ? sorted.findIndex(c => getMetricValue(c, metricKey) >= compareValue) : -1;
  const comparePosition = compareAscIdx !== -1 && total > 1
    ? compareAscIdx / (total - 1)
    : compareValue != null && total > 1 ? 1 : null;
  const compareRank = sameGroup && compareValue != null
    ? validPeers.filter(c => getMetricValue(c, metricKey) > compareValue).length + 1 : null;
  const compareTie  = sameGroup && compareValue != null &&
    validPeers.filter(c => getMetricValue(c, metricKey) === compareValue).length > 1;

  // ── Index from mouse event ────────────────────────────────────────────────
  const getIdxFromEvent = useCallback((e) => {
    if (!trackRef.current || total < 2) return null;
    const rect = trackRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.max(0, Math.min(total - 1, Math.round(pct * (total - 1))));
  }, [total]);

  const handleMouseMove = useCallback((e) => {
    const idx = getIdxFromEvent(e);
    if (idx !== null) setHoverIdx(idx);
  }, [getIdxFromEvent]);

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
  }, []);

  const handleClick = useCallback((e) => {
    const idx = getIdxFromEvent(e);
    if (idx === null) return;
    // Clicking the same locked spot unlocks; any other spot moves/sets the lock
    setLockedIdx(prev => (prev === idx ? null : idx));
  }, [getIdxFromEvent]);

  // ── Derived explorer info ─────────────────────────────────────────────────
  const hoverInfo  = countyInfoFromIdx(hoverIdx,  sorted, validPeers, metricKey, total);
  const lockedInfo = countyInfoFromIdx(lockedIdx, sorted, validPeers, metricKey, total);

  // Tooltip follows hover; when not hovering but locked, show tooltip over locked dot
  const tooltipInfo = hoverInfo ?? (lockedIdx !== null ? lockedInfo : null);

  // Helper: accent color for a county name
  const accentFor = (name) =>
    name === county.name  ? "#5FA8D3" :
    compare && name === compare.name ? "#EE9B00" :
    "#94d4a8";

  // Tooltip horizontal clamping
  const ttPos = tooltipInfo?.pos ?? 0;
  const ttLeft      = ttPos < 0.25 ? "0"    : "50%";
  const ttRight     = ttPos > 0.75 ? "0"    : "auto";
  const ttTransform = ttPos >= 0.25 && ttPos <= 0.75 ? "translateX(-50%)" : "none";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)",
        borderRadius: 12,
        padding: "16px 24px",
        border: "1px solid #1a3456",
        marginBottom: 24,
      }}
    >
      {/* Label row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 10, flexWrap: "wrap", gap: 4,
      }}>
        <span style={{ fontSize: 11, color: "#8aa4bc", textTransform: "uppercase", letterSpacing: 1 }}>
          {metricLabel(metricKey)} rank within group ({county.pg})
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#5FA8D3" }}>{rankLabel}</span>
      </div>

      {/* ── Track ──────────────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          position: "relative",
          height: 28,
          display: "flex",
          alignItems: "center",
          cursor: "crosshair",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Gradient bar */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 8,
          borderRadius: 4,
          background: "linear-gradient(to right, #1a3456, #5FA8D3)",
        }} />

        {/* Tick marks (when ≤ 30 counties) */}
        {total <= 30 && sorted.map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i / (total - 1)) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 2, height: 4,
            background: "rgba(255,255,255,0.13)",
            borderRadius: 1,
            pointerEvents: "none",
          }} />
        ))}

        {/* Compare marker */}
        {comparePosition != null && (
          <div style={{
            position: "absolute",
            left: `${comparePosition * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 12, height: 12,
            borderRadius: "50%",
            background: "#e8f1f8",
            border: "2px solid #EE9B00",
            zIndex: 2, pointerEvents: "none",
          }} />
        )}

        {/* Primary marker */}
        <div style={{
          position: "absolute",
          left: `${position * 100}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 14, height: 14,
          borderRadius: "50%",
          background: "#e8f1f8",
          border: "2px solid #5FA8D3",
          zIndex: 3, pointerEvents: "none",
        }} />

        {/* Locked dot — pinned, shown even when not hovering */}
        {lockedInfo && (
          <div style={{
            position: "absolute",
            left: `${lockedInfo.pos * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 4, pointerEvents: "none",
          }}>
            <div style={{
              width: 16, height: 16,
              borderRadius: "50%",
              background: "#0d1e2e",
              border: `2.5px solid ${accentFor(lockedInfo.county.name)}`,
              boxShadow: `0 0 0 3px rgba(148,212,168,0.18), 0 0 8px rgba(148,212,168,0.3)`,
            }} />
            {/* Pin indicator (small dot at top) */}
            <div style={{
              position: "absolute",
              top: -6, left: "50%",
              transform: "translateX(-50%)",
              width: 4, height: 4,
              borderRadius: "50%",
              background: accentFor(lockedInfo.county.name),
              boxShadow: `0 0 4px ${accentFor(lockedInfo.county.name)}`,
            }} />
          </div>
        )}

        {/* Hover dot — follows mouse, only visible while hovering */}
        {hoverInfo && hoverIdx !== lockedIdx && (
          <div style={{
            position: "absolute",
            left: `${hoverInfo.pos * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5, pointerEvents: "none",
          }}>
            <div style={{
              width: 14, height: 14,
              borderRadius: "50%",
              background: "#0d1e2e",
              border: `2px solid ${accentFor(hoverInfo.county.name)}`,
              opacity: 0.75,
            }} />
          </div>
        )}

        {/* Tooltip — follows hover dot; falls back to locked dot when not hovering */}
        {tooltipInfo && (
          <div style={{
            position: "absolute",
            left: `${tooltipInfo.pos * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10, pointerEvents: "none",
          }}>
            {/* Invisible spacer to position tooltip above the dot */}
            <div style={{ width: 0, height: 0, position: "relative" }}>
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 18px)",
                left:      ttLeft,
                right:     ttRight,
                transform: ttTransform,
                background: "#091525",
                border: "1px solid #2a4a6a",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "#e8f1f8",
                whiteSpace: "nowrap",
                boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
              }}>
                <div style={{
                  fontWeight: 700,
                  color: accentFor(tooltipInfo.county.name),
                  marginBottom: 3,
                  fontSize: 13,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {tooltipInfo.county.name}
                  {lockedIdx !== null && tooltipInfo === lockedInfo && hoverInfo == null && (
                    <span style={{ fontSize: 9, fontWeight: 400, color: "#4a6a8a", background: "#112233", padding: "1px 5px", borderRadius: 4 }}>
                      pinned
                    </span>
                  )}
                  {tooltipInfo.county.name === county.name && (
                    <span style={{ fontSize: 9, fontWeight: 400, color: "#4a6a8a", background: "#112233", padding: "1px 5px", borderRadius: 4 }}>selected</span>
                  )}
                  {compare && tooltipInfo.county.name === compare.name && tooltipInfo.county.name !== county.name && (
                    <span style={{ fontSize: 9, fontWeight: 400, color: "#4a6a8a", background: "#112233", padding: "1px 5px", borderRadius: 4 }}>compare</span>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, color: "#c8d8e8" }}>
                  <span style={{ color: "#8aa4bc" }}>{tooltipInfo.rankLabel}</span>
                  <span style={{ fontWeight: 600 }}>{fmtMetricValue(tooltipInfo.val, metricKey)}</span>
                </div>
                {/* Caret */}
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left:  ttLeft === "0" ? 9 : ttRight === "0" ? "auto" : "50%",
                  right: ttRight === "0" ? 9 : "auto",
                  transform: (ttLeft !== "0" && ttRight !== "0") ? "translateX(-50%)" : "none",
                  width: 0, height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid #2a4a6a",
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 10, color: "#4a6d8c" }}>
        <span>Lowest</span>
        <span>Highest</span>
      </div>

      {/* Hint */}
      {lockedIdx === null && (
        <div style={{ marginTop: 5, fontSize: 10, color: "#3a5a7a", fontStyle: "italic" }}>
          Hover to explore · Click to pin
        </div>
      )}

      {/* ── Pinned info panel ── */}
      {lockedInfo && (
        <div style={{
          marginTop: 8,
          padding: "8px 12px",
          background: "#08121e",
          borderRadius: 8,
          border: `1px solid #1e3a28`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}>
          {/* Pin icon */}
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="5" cy="4" r="3.5" stroke={accentFor(lockedInfo.county.name)} strokeWidth="1.5"/>
            <line x1="5" y1="7.5" x2="5" y2="11.5" stroke={accentFor(lockedInfo.county.name)} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: accentFor(lockedInfo.county.name) }}>
            {lockedInfo.county.name}
          </span>
          <span style={{ fontSize: 11, color: "#6a8aaa" }}>{lockedInfo.rankLabel}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e8f1f8", marginLeft: "auto" }}>
            {fmtMetricValue(lockedInfo.val, metricKey)}
          </span>
          {/* Unlock button */}
          <button
            onClick={(e) => { e.stopPropagation(); setLockedIdx(null); }}
            title="Unpin"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#4a6a8a", fontSize: 14, lineHeight: 1,
              padding: "0 2px", marginLeft: 4,
              display: "flex", alignItems: "center",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Always-visible primary + compare labels */}
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <div style={{
          fontSize: 12, color: "#c8d8e8",
          background: "#0d1e2e", padding: "5px 10px",
          borderRadius: 6, border: "1px solid #2a3a4a",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8f1f8", border: "2px solid #5FA8D3", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontWeight: 600 }}>{county.name}:</span>
          <span>{fmtMetricValue(myVal, metricKey)}</span>
          {isTie && <span style={{ color: "#EE9B00", fontSize: 11 }}>(tied)</span>}
        </div>

        {comparePosition != null && compare && compareValue != null && (
          <div style={{
            fontSize: 12, color: "#c8d8e8",
            background: "#0d1e2e", padding: "5px 10px",
            borderRadius: 6, border: "1px solid #2a3a4a",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8f1f8", border: "2px solid #EE9B00", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontWeight: 600, color: "#EE9B00" }}>{compare.name}:</span>
            <span>{fmtMetricValue(compareValue, metricKey)}</span>
            {compareTie && <span style={{ color: "#EE9B00", fontSize: 11 }}>(tied)</span>}
            <span style={{ color: "#8aa4bc" }}>— {compareTie ? "T-" : ""}{ordinal(compareRank)} of {total}</span>
          </div>
        )}
      </div>

      {/* Different group note */}
      {compare && !sameGroup && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#4a6d8c", fontStyle: "italic" }}>
          {compare.name} is in a different population group ({compare.pg}) — not shown on this track.
        </div>
      )}
    </div>
  );
}
