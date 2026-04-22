// Feature 3 — Choropleth Map Tab
//
// Bug fixes applied here:
// 1. INITIAL COLOR BUG — svgVersion counter (not boolean) ensures Effect 2 re-runs
//    after *every* SVG injection. React StrictMode double-invokes Effect 1, which
//    re-injects a fresh SVG (wiping inline styles) but the old boolean was already
//    true so Effect 2 never re-ran. A counter always increments → always triggers Effect 2.
//
// 2. CLICK-ZOOM BUG — container gets aspect-ratio: 2/1 so its height never changes.
//    SVG uses height:100% instead of height:auto. Zoom is a smooth animated viewBox
//    shift (28% in, with a horizontal offset to leave room for the sidebar).
//    The sidebar is a full-height panel (left or right based on county position)
//    instead of a bottom overlay. Clicking background or same county zooms back out.

import { useState, useEffect, useRef, useMemo } from "react";

const METRIC_OPTIONS = [
  { key: "pr.Total Revenue",      label: "Revenue / capita" },
  { key: "pe.Total Expenditures", label: "Spending / capita" },
  { key: "net_surplus",           label: "Net Surplus"       },
  { key: "fb.pct",                label: "Fund Balance %"    },
  { key: "tax.effective_rate",    label: "Tax Rate"          },
];

const POP_GROUPS = [
  { key: "all",              label: "All counties"      },
  { key: "Below 25,000",     label: "Below 25,000"      },
  { key: "25,000 to 49,999", label: "25,000 – 49,999"   },
  { key: "50,000 to 99,999", label: "50,000 – 99,999"   },
  { key: "100,000 or Above", label: "100,000 or above"  },
];

function getMetricValue(county, metricKey) {
  if (metricKey === "pr.Total Revenue")      return county.pr?.["Total Revenue"]      ?? null;
  if (metricKey === "pe.Total Expenditures") return county.pe?.["Total Expenditures"] ?? null;
  if (metricKey === "net_surplus")           return (county.pr?.["Total Revenue"] ?? 0) - (county.pe?.["Total Expenditures"] ?? 0);
  if (metricKey === "fb.pct")               return county.fb?.pct ?? null;
  if (metricKey === "tax.effective_rate")   return county.tax?.effective_rate ?? null;
  return null;
}

function fmtTooltipValue(value, metricKey) {
  if (value == null) return null;
  if (metricKey === "fb.pct") return (value * 100).toFixed(1) + "% fund balance";
  if (metricKey === "net_surplus") {
    const abs = Math.abs(Math.round(value));
    return (value >= 0 ? "+" : "−") + "$" + abs.toLocaleString() + " / capita";
  }
  if (metricKey === "tax.effective_rate") return "$" + value.toFixed(3) + " eff.";
  return "$" + Math.round(value).toLocaleString() + " / capita";
}

function fmtPC(n)    { return n != null ? "$" + Math.round(n).toLocaleString() : "—"; }
function fmtPop(n)   { return n != null ? n.toLocaleString() : "—"; }
function fmtFbPct(v) { return v != null ? (v * 100).toFixed(1) + "%" : "—"; }

const COLOR_STEPS   = ["#1e4d8c", "#1878b8", "#0fadd4", "#55d4e8", "#c2eaf5"];
const COLOR_MISSING = "#1E2E40";
const COLOR_DIMMED  = "#152030";

function interpolateColor(t) {
  const n = COLOR_STEPS.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = t * n - i;
  const c1 = COLOR_STEPS[i], c2 = COLOR_STEPS[i + 1];
  const ch = (c, h) => parseInt(h.slice(c, c + 2), 16);
  const mix = (a, b) => Math.round(a + (b - a) * f);
  return `rgb(${mix(ch(1,c1),ch(1,c2))},${mix(ch(3,c1),ch(3,c2))},${mix(ch(5,c1),ch(5,c2))})`;
}

const selectStyle = {
  background: "#0E1922",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#E8EFF8",
  fontSize: 12,
  fontWeight: 600,
  padding: "7px 28px 7px 12px",
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%234A6480'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  minWidth: 160,
};

// Smooth eased viewBox animation — interpolates from current viewBox to target.
// Pure DOM, zero React state, so it never triggers a re-render.
function animateViewBox(svg, targetVBStr, duration = 300) {
  const current = (svg.getAttribute("viewBox") ?? "0 0 960 480").split(" ").map(Number);
  const target  = targetVBStr.split(" ").map(Number);
  const t0      = performance.now();
  function ease(t) { return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t; } // easeInOutQuad
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = ease(p);
    svg.setAttribute("viewBox", current.map((v, i) => v + (target[i]-v)*e).join(" "));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export default function ChoroplethMap({ data, selectedCounty, onCountyClick, jumpToCounty }) {
  const [svgVersion,   setSvgVersion]   = useState(0);
  const [mapMetric,    setMapMetric]    = useState("tax.effective_rate");
  const [compareGroup, setCompareGroup] = useState("all");
  const [panelCounty,  setPanelCounty]  = useState(null);
  const [panelSide,    setPanelSide]    = useState("right");
  const [panelVisible, setPanelVisible] = useState(false);

  const containerRef   = useRef(null);
  const outerRef       = useRef(null);
  const tooltipRef     = useRef(null);
  const svgRef         = useRef(null);
  const origViewBoxRef = useRef(null);

  const dataByName = useMemo(() =>
    Object.fromEntries(data.map(d => [d.name, d])), [data]);

  const { domain, nameToColor } = useMemo(() => {
    const groupData = compareGroup === "all"
      ? data
      : data.filter(d => d.pg === compareGroup);
    const vals = groupData
      .map(d => ({ name: d.name, v: getMetricValue(d, mapMetric) }))
      .filter(x => x.v != null);
    if (!vals.length) return { domain: [0, 1], nameToColor: {} };
    const min   = Math.min(...vals.map(x => x.v));
    const max   = Math.max(...vals.map(x => x.v));
    const range = max - min || 1;
    const nameToColor = {};
    for (const { name, v } of vals) nameToColor[name] = interpolateColor((v - min) / range);
    return { domain: [min, max], nameToColor };
  }, [data, mapMetric, compareGroup]);

  // ── Effect 1: Fetch SVG, inject into DOM ────────────────────────────────
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "nc-counties.svg")
      .then(r => r.text())
      .then(markup => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = markup;
        const svg = containerRef.current.querySelector("svg");
        if (svg) {
          svg.removeAttribute("width");
          svg.removeAttribute("height");
          svg.style.cssText = "width:100%;height:100%;display:block;";
          origViewBoxRef.current = svg.getAttribute("viewBox") ?? "0 0 960 480";
          svgRef.current = svg;
        }
        setSvgVersion(v => v + 1);
      })
      .catch(console.error);
  }, []);

  // ── Effect 2: Paint colors + wire event delegation ───────────────────────
  useEffect(() => {
    if (svgVersion === 0 || !containerRef.current) return;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    // ── Color all paths ──────────────────────────────────────────────────
    svg.querySelectorAll("path").forEach(path => {
      const countyName  = (path.getAttribute("id") || "").replace(/_/g, " ");
      const county      = dataByName[countyName];
      const isPanel     = panelCounty?.name === countyName;
      const isSelected  = selectedCounty === countyName;
      const inGroup     = compareGroup === "all" || county?.pg === compareGroup;

      if (!county) {
        path.style.fill        = COLOR_MISSING;
        path.style.stroke      = "rgba(255,255,255,0.15)";
        path.style.strokeWidth = "0.8";
        path.style.opacity     = "1";
        path.style.cursor      = "default";
        return;
      }
      if (!inGroup) {
        path.style.fill        = COLOR_DIMMED;
        path.style.stroke      = "rgba(255,255,255,0.08)";
        path.style.strokeWidth = "0.8";
        path.style.opacity     = "0.6";
        path.style.cursor      = "default";
        return;
      }
      path.style.opacity     = "1";
      path.style.fill        = mapMetric === "fb.pct" && county.fb?.pct == null
        ? COLOR_MISSING
        : (nameToColor[countyName] || COLOR_MISSING);
      path.style.stroke      = isPanel ? "#FFFFFF" : isSelected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.15)";
      path.style.strokeWidth = isPanel ? "3"      : isSelected ? "2"                       : "0.8";
      path.style.cursor      = "pointer";
    });

    const ac = new AbortController();
    const { signal } = ac;

    // ── Tooltip ──────────────────────────────────────────────────────────
    svg.addEventListener("mouseover", (e) => {
      const path = e.target.closest("path");
      if (!path) return;
      const countyName = (path.getAttribute("id") || "").replace(/_/g, " ");
      const county     = dataByName[countyName];
      const inGroup    = compareGroup === "all" || county?.pg === compareGroup;
      if (!inGroup) return;
      path.style.opacity = "0.75";
      const val = county ? getMetricValue(county, mapMetric) : null;
      const tt  = tooltipRef.current;
      if (!tt) return;
      const extraLine = mapMetric === "tax.effective_rate" && county?.tax
        ? `<br/><span style="color:#4A6480;font-size:11px">nominal: $${county.tax.county_rate.toFixed(3)}</span>`
        : "";
      tt.innerHTML = county
        ? `<strong style="color:#E8EFF8">${countyName}</strong>`
          + `<span style="color:#7A9AB8"> — ${fmtTooltipValue(val, mapMetric) ?? "N/A"}</span>`
          + extraLine
        : `<strong style="color:#E8EFF8">${countyName}</strong>`
          + `<span style="color:#4A6480"> — Not in AFIR dataset</span>`;
      tt.style.display = "block";
    }, { signal });

    svg.addEventListener("mousemove", (e) => {
      const tt    = tooltipRef.current;
      const outer = outerRef.current;
      if (!tt || !outer) return;
      const rect = outer.getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top  - 10;
      if (x + 220 > rect.width) x = e.clientX - rect.left - 220;
      if (y < 4)                y = e.clientY - rect.top  + 22;
      tt.style.left = x + "px";
      tt.style.top  = y + "px";
    }, { signal });

    svg.addEventListener("mouseout", (e) => {
      const path = e.target.closest("path");
      if (path) {
        const countyName = (path.getAttribute("id") || "").replace(/_/g, " ");
        const county     = dataByName[countyName];
        const inGroup    = compareGroup === "all" || county?.pg === compareGroup;
        path.style.opacity = inGroup ? "1" : "0.6";
      }
      const tt = tooltipRef.current;
      if (tt) tt.style.display = "none";
    }, { signal });

    // ── Click: zoom + sidebar ────────────────────────────────────────────
    svg.addEventListener("click", (e) => {
      const path = e.target.closest("path");

      if (!path) {
        if (panelCounty && origViewBoxRef.current && svgRef.current) {
          animateViewBox(svgRef.current, origViewBoxRef.current);
          setPanelCounty(null);
        }
        return;
      }

      const countyName = (path.getAttribute("id") || "").replace(/_/g, " ");
      const county     = dataByName[countyName];
      const inGroup    = compareGroup === "all" || county?.pg === compareGroup;

      if (!county || !inGroup) {
        if (panelCounty && origViewBoxRef.current && svgRef.current) {
          animateViewBox(svgRef.current, origViewBoxRef.current);
          setPanelCounty(null);
        }
        return;
      }

      if (panelCounty?.name === countyName) {
        animateViewBox(svgRef.current, origViewBoxRef.current);
        setPanelCounty(null);
        return;
      }

      if (!origViewBoxRef.current || !svgRef.current) return;
      const [ox, oy, ow, oh] = origViewBoxRef.current.split(" ").map(Number);
      const bbox = path.getBBox();
      const cx   = bbox.x + bbox.width  / 2;
      const cy   = bbox.y + bbox.height / 2;

      const zW = ow * 0.75;
      const zH = oh * 0.75;

      const isRightCounty = cx > ow / 2;
      const side = isRightCounty ? "left" : "right";

      const P_x  = isRightCounty ? 0.62 : 0.38;
      const rawX = cx - zW * P_x;
      const rawY = cy - zH * 0.5;

      const vbX = Math.max(ox - 40, Math.min(ox + ow - zW + 40, rawX));
      const vbY = Math.max(oy - 20, Math.min(oy + oh - zH + 20, rawY));

      animateViewBox(svgRef.current, `${vbX} ${vbY} ${zW} ${zH}`);
      setPanelCounty(county);
      setPanelSide(side);
    }, { signal });

    return () => ac.abort();
  }, [svgVersion, nameToColor, panelCounty, selectedCounty, mapMetric, compareGroup, dataByName]);

  // ── Effect 3: Jump to county from external search ────────────────────────
  useEffect(() => {
    if (!jumpToCounty?.name || svgVersion === 0 || !svgRef.current || !origViewBoxRef.current) return;
    const county = dataByName[jumpToCounty.name];
    if (!county) return;
    const svg = svgRef.current;
    const path = svg.querySelector(`path[id="${jumpToCounty.name.replace(/ /g, "_")}"]`);
    if (!path) return;
    const [ox, oy, ow, oh] = origViewBoxRef.current.split(" ").map(Number);
    const bbox = path.getBBox();
    const cx = bbox.x + bbox.width  / 2;
    const cy = bbox.y + bbox.height / 2;
    const zW = ow * 0.75;
    const zH = oh * 0.75;
    const isRightCounty = cx > ow / 2;
    const side = isRightCounty ? "left" : "right";
    const P_x  = isRightCounty ? 0.62 : 0.38;
    const rawX = cx - zW * P_x;
    const rawY = cy - zH * 0.5;
    const vbX  = Math.max(ox - 40, Math.min(ox + ow - zW + 40, rawX));
    const vbY  = Math.max(oy - 20, Math.min(oy + oh - zH + 20, rawY));
    animateViewBox(svg, `${vbX} ${vbY} ${zW} ${zH}`);
    setPanelCounty(county);
    setPanelSide(side);
  }, [jumpToCounty, svgVersion, dataByName]);

  // Legend formatter
  const fmtLegend = (v) => {
    if (v == null) return "";
    if (mapMetric === "fb.pct")             return (v * 100).toFixed(1) + "%";
    if (mapMetric === "net_surplus")        return (v >= 0 ? "+" : "") + "$" + Math.round(v).toLocaleString();
    if (mapMetric === "tax.effective_rate") return "$" + v.toFixed(3);
    return "$" + Math.round(v).toLocaleString();
  };

  // Trigger slide-in one frame after panelCounty is set so the browser paints
  // the initial off-screen transform before transitioning to translateX(0).
  useEffect(() => {
    if (!panelCounty) { setPanelVisible(false); return; }
    const id = requestAnimationFrame(() => setPanelVisible(true));
    return () => cancelAnimationFrame(id);
  }, [panelCounty]);

  const closePanel = () => {
    if (svgRef.current && origViewBoxRef.current)
      animateViewBox(svgRef.current, origViewBoxRef.current, 300);
    setPanelCounty(null);
  };

  return (
    <div>
      {/* ── Controls row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#4A6480", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, whiteSpace: "nowrap" }}>
            Color by
          </span>
          <div style={{ position: "relative" }}>
            <select value={mapMetric} onChange={e => setMapMetric(e.target.value)} style={selectStyle}>
              {METRIC_OPTIONS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#4A6480", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, whiteSpace: "nowrap" }}>
            Compare group
          </span>
          <div style={{ position: "relative" }}>
            <select
              value={compareGroup}
              onChange={e => {
                if (svgRef.current && origViewBoxRef.current)
                  animateViewBox(svgRef.current, origViewBoxRef.current, 250);
                setCompareGroup(e.target.value);
                setPanelCounty(null);
              }}
              style={selectStyle}
            >
              {POP_GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Map container ── */}
      <div
        ref={outerRef}
        style={{
          position: "relative",
          background: "#0A1520",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          aspectRatio: "2 / 1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.25)",
        }}
      >
        {svgVersion === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#4A6480", fontSize: 13,
          }}>
            Loading map…
          </div>
        )}

        {/* SVG injected here by Effect 1 */}
        <div ref={containerRef} style={{ position: "absolute", inset: 0, lineHeight: 0 }} />

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          style={{
            display: "none", position: "absolute",
            background: "#1A2840", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "6px 10px",
            fontSize: 12, color: "#E8EFF8",
            pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          }}
        />

        {/* ── Sidebar panel ── */}
        {panelCounty && (() => {
          const d = dataByName[panelCounty.name];
          if (!d) return null;
          const fbPct      = d.fb?.pct;
          const fbColor    = fbPct == null ? "#A8C4D8" : fbPct < 0.08 ? "#F87171" : fbPct <= 0.25 ? "#FBBF24" : "#34D399";
          const rows = [
            { label: "Population",   value: fmtPop(d.pop),                                   color: "#E8EFF8" },
            { label: "Revenue",      value: fmtPC(d.pr["Total Revenue"]) + " / pp",           color: "#E8EFF8" },
            { label: "Expenditures", value: fmtPC(d.pe["Total Expenditures"]) + " / pp",      color: "#E8EFF8" },
            { label: "Tax Rate",     value: d.tax ? `$${d.tax.county_rate.toFixed(3)}` : "—", color: "#E8EFF8" },
            { label: "Fund Balance", value: fmtFbPct(fbPct),                                  color: fbColor   },
          ];
          const isRight = panelSide === "right";
          return (
            <div
              className={`map-sidebar-${panelSide}`}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                [panelSide]: 0,
                width: 300,
                zIndex: 20,
                background: "#1E3A52",
                backdropFilter: "blur(12px)",
                borderLeft:  isRight ? "4px solid rgba(255,255,255,0.3)" : "none",
                borderRight: isRight ? "none" : "4px solid rgba(255,255,255,0.3)",
                boxShadow: isRight
                  ? "-12px 0 48px rgba(0,0,0,0.75)"
                  : "12px 0 48px rgba(0,0,0,0.75)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                padding: "24px 20px 20px",
                boxSizing: "border-box",
                transform: panelVisible
                  ? "translateX(0)"
                  : isRight ? "translateX(100%)" : "translateX(-100%)",
                transition: "transform 0.3s cubic-bezier(0.16, 1, 0.32, 1)",
              }}
            >
              {/* Close button — absolute corner */}
              <button
                onClick={closePanel}
                title="Close"
                style={{
                  position: "absolute", top: 12, right: 12,
                  background: "none", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 5, color: "#A8C4D8", cursor: "pointer",
                  padding: "3px 7px", fontSize: 11, lineHeight: 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = "#E8EFF8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#A8C4D8"; }}
              >
                ✕
              </button>

              {/* County name headline */}
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, fontWeight: 400,
                color: "#FFFFFF", lineHeight: 1.15,
                marginBottom: 4, paddingRight: 32,
              }}>
                {d.name}
              </div>
              <div style={{ fontSize: 11, color: "#A8C4D8", marginBottom: 18, letterSpacing: 0.3 }}>
                {d.pg ?? "No AFIR snapshot"}
              </div>

              {/* Stat rows */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {rows.map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#A8C4D8" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Full data button — solid primary */}
              <button
                onClick={() => {
                  closePanel();
                  setTimeout(() => onCountyClick(d.name), 320);
                }}
                style={{
                  marginTop: 20,
                  background: "#2563EB", border: "none",
                  borderRadius: 7, color: "#FFFFFF", cursor: "pointer",
                  padding: "9px 14px", fontSize: 12, fontWeight: 600,
                  whiteSpace: "nowrap", width: "100%",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#2563EB"; }}
              >
                View full data →
              </button>
            </div>
          );
        })()}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, marginBottom: 8, flexWrap: "wrap" }}>
        {compareGroup !== "all" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: COLOR_DIMMED, border: "1px solid rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: 10, color: "#4A6480" }}>Outside group</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 120, height: 12, borderRadius: 4,
            background: `linear-gradient(to right, ${COLOR_STEPS[0]}, ${COLOR_STEPS[COLOR_STEPS.length - 1]})`,
          }} />
          <span style={{ fontSize: 10, color: "#7A9AB8" }}>
            {fmtLegend(domain[0])} — {fmtLegend(domain[1])}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: COLOR_MISSING, border: "1px solid rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: 10, color: "#4A6480" }}>Not in AFIR dataset</span>
        </div>
        {mapMetric === "fb.pct" && (
          <span style={{ fontSize: 10, color: "#4A6480", fontStyle: "italic" }}>
            † Fund balance unavailable for Bladen &amp; Greene counties
          </span>
        )}
        {mapMetric === "tax.effective_rate" && (
          <span style={{ fontSize: 10, color: "#4A6480", fontStyle: "italic" }}>
            † Effective rates adjust for reappraisal cycle differences · Source: NC Dept. of Revenue 2025–26
          </span>
        )}
      </div>
    </div>
  );
}
