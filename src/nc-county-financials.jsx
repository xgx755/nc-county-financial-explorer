import { useState, useMemo, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import DATA from "./data/counties.json";
import StatCard from "./components/StatCard";
import FundBalanceGauge from "./components/FundBalanceGauge";
import PeerRankBar from "./components/PeerRankBar";
import AboutModal from "./components/AboutModal";

// ChartPanel and ChoroplethMap are lazy-loaded (large chunks)
const ChartPanel    = lazy(() => import("./components/ChartPanel"));
const ChoroplethMap = lazy(() => import("./components/ChoroplethMap"));

// ─── Constants ────────────────────────────────────────────────────────────────

const AFIR_FISCAL_YEAR = "FY2025";

const REV_CATS = [
  "Property Taxes", "Other Taxes", "Sales Tax",
  "Sales & Services", "Intergovernmental", "Debt Proceeds", "Other Misc",
];
const EXP_CATS = [
  "Education", "Debt Service", "Human Services",
  "General Government", "Public Safety", "Other",
];

const NAME_TO_IDX = Object.fromEntries(DATA.map((d, i) => [d.name, i]));

const TABLE_COLS = [
  { key: "name",    label: "County",               sort: (d) => d.name,                      numeric: false },
  { key: "pop",     label: "Population",           sort: (d) => d.pop,                       numeric: true  },
  { key: "group",   label: "Group",                sort: (d) => d.pg,                        numeric: false },
  { key: "rev_pc",  label: "Revenue / Capita",     sort: (d) => d.pr["Total Revenue"],       numeric: true  },
  { key: "exp_pc",  label: "Expenditure / Capita", sort: (d) => d.pe["Total Expenditures"],  numeric: true  },
  { key: "grp_rev", label: "Group Avg Rev",        sort: (d) => d.gr["Total Revenue"],       numeric: true  },
  { key: "grp_exp", label: "Group Avg Exp",        sort: (d) => d.ge["Total Expenditures"],  numeric: true  },
  { key: "fb_pct",  label: "Fund Balance %",       sort: (d) => d.fb?.pct ?? -1,             numeric: true  },
  { key: "tax_rate", label: "Tax Rate",          sort: (d) => d.tax?.county_rate ?? -1,    numeric: true  },
];

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt    = (n) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};
const fmtPop   = (n) => n.toLocaleString();
const fmtPC    = (n) => `$${Math.round(n).toLocaleString()}`;
const fmtFbPct    = (v) => v != null ? (v * 100).toFixed(1) + "%" : "—";
const fmtTaxRate      = (r) => r != null ? `$${r.toFixed(3)}` : "—";
const fmtTaxRateShort = (r) => r != null ? `$${r.toFixed(3)}` : "—";

// ─── CSV export ───────────────────────────────────────────────────────────────

function escapeCSV(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function downloadCSV(rows) {
  const headers = [
    "County", "Population", "Population Group",
    "Revenue / Capita", "Expenditure / Capita", "Net Surplus/Deficit / Capita",
    "Group Avg Revenue / Capita", "Group Avg Expenditure / Capita",
    "Fund Balance %", "Group Avg FBA %", "Tax Rate ($/100)",
  ];
  const lines = [
    headers.join(","),
    ...rows.map(d => [
      escapeCSV(d.name),
      escapeCSV(d.pop),
      escapeCSV(d.pg),
      escapeCSV(Math.round(d.pr["Total Revenue"])),
      escapeCSV(Math.round(d.pe["Total Expenditures"])),
      escapeCSV(Math.round(d.pr["Total Revenue"] - d.pe["Total Expenditures"])),
      escapeCSV(Math.round(d.gr["Total Revenue"])),
      escapeCSV(Math.round(d.ge["Total Expenditures"])),
      escapeCSV(d.fb?.pct != null ? (d.fb.pct * 100).toFixed(1) : ""),
      escapeCSV(d.fb?.grp_pct != null ? (d.fb.grp_pct * 100).toFixed(1) : ""),
      escapeCSV(d.tax?.county_rate?.toFixed(3) ?? ""),
    ].join(","))
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `nc-county-financials-${AFIR_FISCAL_YEAR}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Small internal components ────────────────────────────────────────────────

const SortIcon = ({ active, dir }) => (
  <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 9 }}>
    {active && dir === "asc" ? "▲" : "▼"}
  </span>
);

const ChartSkeleton = ({ isMobile }) => (
  <div style={{
    height: isMobile ? 240 : 340,
    borderRadius: 12, border: "1px solid #1a3456",
    background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#4a6d8c", fontSize: 13, marginBottom: 32,
  }}>
    Loading…
  </div>
);

// ─── Tab bar (3 tabs) ─────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab, isMobile }) {
  const tabs = [["data", "Data View"], ["map", "Map View"], ["list", "List View"]];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          aria-pressed={activeTab === key}
          style={{
            padding: isMobile ? "8px 12px" : "9px 20px",
            borderRadius: 8,
            border: "1px solid " + (activeTab === key ? "#3a7ca5" : "#1a3456"),
            background: activeTab === key ? "#132744" : "transparent",
            color: activeTab === key ? "#5FA8D3" : "#4a6d8c",
            cursor: "pointer", fontSize: isMobile ? 11 : 12,
            fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NCCountyFinancials() {
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth < 768;
  const isTablet    = windowWidth >= 768 && windowWidth < 1024;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [compareIdx,  setCompareIdx]  = useState(-1);
  const [view,        setView]        = useState("overview");
  const [searchTerm,  setSearchTerm]  = useState("");
  const [sortKey,     setSortKey]     = useState("rev_pc");
  const [sortDir,     setSortDir]     = useState("desc");
  const [activeTab,   setActiveTab]   = useState("data");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const headerRef = useRef(null);
  const infoRef   = useRef(null);

  const county  = DATA[selectedIdx];
  const compare = compareIdx >= 0 && compareIdx !== selectedIdx ? DATA[compareIdx] : null;

  // ── URL param read on load ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const countyName  = params.get("county");
    const compareName = params.get("compare");
    const viewParam   = params.get("view");
    const tabParam    = params.get("tab");

    if (countyName  && NAME_TO_IDX[countyName]  != null) setSelectedIdx(NAME_TO_IDX[countyName]);
    if (compareName && NAME_TO_IDX[compareName] != null && compareName !== countyName) setCompareIdx(NAME_TO_IDX[compareName]);
    if (viewParam   && ["overview", "revenue", "spending"].includes(viewParam)) setView(viewParam);
    if (tabParam    && ["data", "map", "list"].includes(tabParam)) setActiveTab(tabParam);
  }, []);

  // ── URL param sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedIdx >= 0) params.set("county", DATA[selectedIdx].name);
    if (compareIdx >= 0 && compareIdx !== selectedIdx) params.set("compare", DATA[compareIdx].name);
    params.set("view", view);
    if (activeTab !== "data") params.set("tab", activeTab);
    history.replaceState(null, "", "?" + params.toString());
  }, [selectedIdx, compareIdx, view, activeTab]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const filtered = useMemo(() =>
    DATA.map((d, i) => ({ ...d, idx: i }))
        .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const revPieData = useMemo(() =>
    REV_CATS.filter(c => county.r[c] > 0).map(c => ({ name: c, value: county.r[c] })),
    [county]
  );
  const expPieData = useMemo(() =>
    EXP_CATS.map(c => ({ name: c, value: county.e[c] })),
    [county]
  );
  const pcCompareRevData = useMemo(() =>
    REV_CATS.map(c => ({
      name: c.length > 14 ? c.slice(0, 12) + "…" : c,
      County: county.pr[c],
      "Group Avg": county.gr[c],
      ...(compare ? { [compare.name]: compare.pr[c] } : {}),
    })),
    [county, compare]
  );
  const pcCompareExpData = useMemo(() =>
    EXP_CATS.map(c => ({
      name: c.length > 14 ? c.slice(0, 12) + "…" : c,
      County: county.pe[c],
      "Group Avg": county.ge[c],
      ...(compare ? { [compare.name]: compare.pe[c] } : {}),
    })),
    [county, compare]
  );

  const compareOptions = useMemo(() =>
    DATA.map((d, i) => ({ name: d.name, i })).filter(({ i }) => i !== selectedIdx),
    [selectedIdx]
  );

  const sortedData = useMemo(() => {
    const col = TABLE_COLS.find(c => c.key === sortKey) ?? TABLE_COLS[3];
    return [...DATA].sort((a, b) => {
      const av = col.sort(a), bv = col.sort(b);
      if (!col.numeric) return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const selectCounty = (idx) => {
    setSelectedIdx(idx);
    setSearchTerm("");
    setTimeout(() => headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleMapCountyClick = useCallback((name) => {
    const idx = NAME_TO_IDX[name];
    if (idx != null) {
      setSelectedIdx(idx);
      setActiveTab("data");
      setTimeout(() => headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, []);

  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => infoRef.current?.focus(), 50);
  };

  const balance   = county.r["Total Revenue"] - county.e["Total Expenditures"];
  const isSurplus = balance >= 0;
  const px        = isMobile ? "16px" : isTablet ? "24px" : "32px";

  // In map view, hide the data-only controls
  const isMapView  = activeTab === "map";
  const isDataView = activeTab === "data";

  return (
    <div style={{ minHeight: "100vh", background: "#060e1a", color: "#c8d8e8", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header (contains title, tabs, actions) ── */}
      <div
        ref={headerRef}
        style={{
          background: "linear-gradient(180deg, #0a1628 0%, #060e1a 100%)",
          borderBottom: "1px solid #12253d",
          padding: isMobile ? `14px ${px} 0` : `28px ${px} 0`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#3a7ca5", fontWeight: 600 }}>North Carolina</span>
                <span style={{ fontSize: 11, color: "#2a4a6b" }}>|</span>
                <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#2a4a6b" }}>FY 2024–25 AFIR Data</span>
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 22 : 32, fontWeight: 900, color: "#e8f1f8", margin: 0, letterSpacing: -0.5 }}>
                County Financial Explorer
              </h1>
              {!isMobile && (
                <p style={{ fontSize: 13, color: "#4a6d8c", marginTop: 6, maxWidth: 600 }}>
                  {DATA.length} counties — revenue sources, expenditure functions, and per capita comparisons from the Annual Financial Information Reports.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={handleShare}
                  title="Copy shareable link"
                  style={{
                    background: "none", border: "1px solid #1a3456",
                    borderRadius: 8, color: "#4a6d8c", cursor: "pointer",
                    padding: "7px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 5,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#3a7ca5"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3456"}
                >
                  {!isMobile && "Share"}
                  {isMobile && "Share"}
                </button>
                {shareCopied && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "#132744", border: "1px solid #2a3a4a",
                    borderRadius: 6, padding: "4px 10px", fontSize: 11,
                    color: "#62B6CB", whiteSpace: "nowrap", zIndex: 20,
                  }}>
                    Copied!
                  </div>
                )}
              </div>

              <button
                ref={infoRef}
                onClick={() => setModalOpen(true)}
                aria-label="About this data"
                style={{
                  background: "none", border: "1px solid #1a3456",
                  borderRadius: "50%", color: "#4a6d8c", cursor: "pointer",
                  width: 34, height: 34, fontSize: 16, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#3a7ca5"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3456"}
              >
                ⓘ
              </button>
            </div>
          </div>

          {/* Tab bar — flush with bottom of header */}
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: `20px ${px}` }}>

        {/* ── Selector row — hidden in map view ── */}
        {!isMapView && (
          <div style={{
            display: "flex", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 18 : 24,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "flex-end",
            flexWrap: isMobile ? "nowrap" : "wrap",
          }}>
            <div style={{ flex: isMobile ? "none" : "1 1 240px" }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#4a6d8c", display: "block", marginBottom: 6 }}>
                Select County
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search counties…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onBlur={() => setTimeout(() => setSearchTerm(""), 150)}
                  aria-label="Search for a county"
                  aria-autocomplete="list"
                  aria-expanded={searchTerm.length > 0 && filtered.length > 0}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "10px 14px",
                    background: "#0d1f3c", border: "1px solid #1a3456",
                    borderRadius: 8, color: "#e0e8f0", fontSize: 14, outline: "none",
                  }}
                />
                {searchTerm && filtered.length > 0 && (
                  <div
                    role="listbox"
                    aria-label="County suggestions"
                    style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      background: "#0d1f3c", border: "1px solid #1a3456",
                      borderTop: "none", borderRadius: "0 0 8px 8px",
                      maxHeight: 200, overflowY: "auto", zIndex: 10,
                    }}
                  >
                    {filtered.map(d => (
                      <div
                        key={d.idx}
                        role="option"
                        aria-selected={d.idx === selectedIdx}
                        onMouseDown={e => { e.preventDefault(); selectCounty(d.idx); }}
                        style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #0f2640", color: d.idx === selectedIdx ? "#5FA8D3" : "#c8d8e8" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#132744"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {d.name} <span style={{ color: "#4a6d8c", fontSize: 11 }}>({fmtPop(d.pop)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compare With — data view only */}
            {isDataView && (
              <div style={{ flex: isMobile ? "none" : "1 1 240px" }}>
                <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#4a6d8c", display: "block", marginBottom: 6 }}>
                  Compare With
                </label>
                <select
                  value={compareIdx}
                  onChange={e => setCompareIdx(Number(e.target.value))}
                  aria-label="Compare with another county"
                  style={{
                    width: "100%", padding: "10px 14px",
                    background: "#0d1f3c", border: "1px solid #1a3456",
                    borderRadius: 8, color: "#e0e8f0", fontSize: 14, outline: "none",
                  }}
                >
                  <option value={-1}>None</option>
                  {compareOptions.map(({ name, i }) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Overview / Revenue / Spending — data view only */}
            {isDataView && (
              <div style={{ display: "flex", gap: 4, flex: "0 0 auto", ...(isMobile ? { width: "100%" } : {}) }}>
                {["overview", "revenue", "spending"].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    style={{
                      flex: isMobile ? 1 : "0 0 auto",
                      padding: isMobile ? "10px 6px" : "10px 18px",
                      borderRadius: 8,
                      border: "1px solid " + (view === v ? "#3a7ca5" : "#1a3456"),
                      background: view === v ? "#132744" : "transparent",
                      color: view === v ? "#5FA8D3" : "#4a6d8c",
                      cursor: "pointer", fontSize: isMobile ? 11 : 12,
                      fontWeight: 600, textTransform: "uppercase", letterSpacing: 1,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ DATA TAB ══════════════════════════════════════════════════════════ */}
        {activeTab === "data" && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 26 : 40, fontWeight: 900, color: "#e8f1f8", margin: 0 }}>
                {county.name}
                <span style={{ fontSize: isMobile ? 13 : 16, fontWeight: 400, color: "#4a6d8c", marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>County</span>
              </h2>
              {compare && <span style={{ fontSize: 14, color: "#EE9B00", fontWeight: 600 }}>vs {compare.name}</span>}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <StatCard isMobile={isMobile} label="Population"         value={fmtPop(county.pop)} sub={county.pg} />
              <StatCard isMobile={isMobile} label="Total Revenue"      value={fmt(county.r["Total Revenue"])}      sub={`${fmtPC(county.pr["Total Revenue"])} / capita`} />
              <StatCard isMobile={isMobile} label="Total Expenditures" value={fmt(county.e["Total Expenditures"])} sub={`${fmtPC(county.pe["Total Expenditures"])} / capita`} />
              <StatCard
                isMobile={isMobile}
                label="Net Balance"
                value={`${isSurplus ? "+" : "−"}${fmt(Math.abs(balance))}`}
                sub={isSurplus ? "✓ Surplus" : "⚠ Deficit"}
                accent={isSurplus ? "#62B6CB" : "#AE2012"}
              />
            
              <StatCard
                isMobile={isMobile}
                label="Tax Rate (\$/100)"
                value={fmtTaxRate(county.tax?.county_rate)}
                sub={county.tax
                  ? `eff. $${county.tax.effective_rate.toFixed(3)}`
                  : undefined}
              />
            </div>

            {/* Fund Balance Gauge */}
            <FundBalanceGauge county={county} compare={compare} />

            {/* Revenue section */}
            <Suspense fallback={<ChartSkeleton isMobile={isMobile} />}>
              {(view === "overview" || view === "revenue") && (
                <>
                  <ChartPanel
                    isMobile={isMobile}
                    title="Revenue Composition"
                    pieData={revPieData}
                    barData={pcCompareRevData}
                    cats={REV_CATS}
                    countyName={county.name}
                    compareCounty={compare}
                    barColor="#5FA8D3"
                    compareColor="#EE9B00"
                  />
                  <PeerRankBar
                    DATA={DATA}
                    county={county}
                    compare={compare}
                    metricKey="pr.Total Revenue"
                  />
                  {county.tax != null && (
                    <PeerRankBar
                      DATA={DATA}
                      county={county}
                      compare={compare}
                      metricKey="tax.effective_rate"
                    />
                  )}
                </>
              )}
            </Suspense>

            {/* Spending section */}
            <Suspense fallback={<ChartSkeleton isMobile={isMobile} />}>
              {(view === "overview" || view === "spending") && (
                <>
                  <ChartPanel
                    isMobile={isMobile}
                    title="Expenditure Allocation"
                    pieData={expPieData}
                    barData={pcCompareExpData}
                    cats={EXP_CATS}
                    countyName={county.name}
                    compareCounty={compare}
                    barColor="#EE9B00"
                    compareColor="#5FA8D3"
                  />
                  <PeerRankBar
                    DATA={DATA}
                    county={county}
                    compare={compare}
                    metricKey="pe.Total Expenditures"
                  />
                </>
              )}
            </Suspense>
          </>
        )}

        {/* ══ MAP TAB ═══════════════════════════════════════════════════════════ */}
        {activeTab === "map" && (
          <Suspense fallback={<ChartSkeleton isMobile={isMobile} />}>
            <ChoroplethMap
              data={DATA}
              selectedCounty={county.name}
              onCountyClick={handleMapCountyClick}
            />
          </Suspense>
        )}

        {/* ══ LIST TAB ══════════════════════════════════════════════════════════ */}
        {activeTab === "list" && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, color: "#e8f1f8", margin: 0, fontWeight: 700 }}>
                All Counties
              </h3>
              <button
                onClick={() => downloadCSV(sortedData)}
                style={{
                  padding: "7px 14px", borderRadius: 8,
                  border: "1px solid #1a3456", background: "transparent",
                  color: "#4a6d8c", cursor: "pointer", fontSize: 12,
                  fontWeight: 600, letterSpacing: 0.5,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#3a7ca5"; e.currentTarget.style.color = "#5FA8D3"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a3456"; e.currentTarget.style.color = "#4a6d8c"; }}
              >
                ↓ CSV
              </button>
            </div>
            <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, border: "1px solid #1a3456", overflow: "hidden" }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 12 : 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a3456" }}>
                      {TABLE_COLS.map(col => (
                        <th
                          key={col.key}
                          scope="col"
                          onClick={() => handleSort(col.key)}
                          style={{
                            padding: isMobile ? "10px 10px" : "12px 16px",
                            textAlign: "left", fontSize: 10,
                            textTransform: "uppercase", letterSpacing: 1,
                            color: sortKey === col.key ? "#5FA8D3" : "#4a6d8c",
                            fontWeight: 600, whiteSpace: "nowrap",
                            cursor: "pointer", userSelect: "none",
                          }}
                        >
                          {col.label}
                          <SortIcon active={sortKey === col.key} dir={sortDir} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map(d => {
                      const idx        = NAME_TO_IDX[d.name];
                      const isSelected = d.name === county.name;
                      const isCompare  = compare && d.name === compare.name;
                      return (
                        <tr
                          key={d.name}
                          onClick={() => { selectCounty(idx); setActiveTab("data"); }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Select ${d.name} County`}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCounty(idx); setActiveTab("data"); } }}
                          style={{
                            borderBottom: "1px solid #0f2640",
                            background: isSelected ? "#132744" : isCompare ? "#1a2810" : "transparent",
                            cursor: "pointer", transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (!isSelected && !isCompare) e.currentTarget.style.background = "#0f1e35"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isSelected ? "#132744" : isCompare ? "#1a2810" : "transparent"; }}
                        >
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", fontWeight: isSelected ? 700 : 400, color: isSelected ? "#5FA8D3" : isCompare ? "#EE9B00" : "#c8d8e8", whiteSpace: "nowrap" }}>{d.name}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#8aa4bc", whiteSpace: "nowrap" }}>{fmtPop(d.pop)}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#6b8aad", fontSize: 11, whiteSpace: "nowrap" }}>{d.pg}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", fontWeight: 600, color: "#e8f1f8", whiteSpace: "nowrap" }}>{fmtPC(d.pr["Total Revenue"])}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#c8d8e8", whiteSpace: "nowrap" }}>{fmtPC(d.pe["Total Expenditures"])}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#4a6d8c", whiteSpace: "nowrap" }}>{fmtPC(d.gr["Total Revenue"])}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#4a6d8c", whiteSpace: "nowrap" }}>{fmtPC(d.ge["Total Expenditures"])}</td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: d.fb?.pct != null ? (d.fb.pct < 0.08 ? "#AE2012" : d.fb.pct <= 0.25 ? "#EE9B00" : "#62B6CB") : "#2a4a6b", whiteSpace: "nowrap" }}>
                            {fmtFbPct(d.fb?.pct)}
                          </td>
                          <td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#c8d8e8", whiteSpace: "nowrap" }}>
                            {fmtTaxRateShort(d.tax?.county_rate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {isMobile && (
              <p style={{ fontSize: 11, color: "#2a4a6b", marginTop: 8, textAlign: "center" }}>
                ← Scroll horizontally to see all columns
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 0 32px", borderTop: "1px solid #12253d", fontSize: 11, color: "#2a4a6b", marginTop: 16 }}>
          Source: NC Department of State Treasurer — Annual Financial Information Reports (AFIR) · Fiscal Year ending 6/30/2025
        </div>

      </div>

      {/* About Modal */}
      {modalOpen && <AboutModal onClose={handleModalClose} />}
    </div>
  );
}
