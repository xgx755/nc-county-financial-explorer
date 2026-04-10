import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DATA from "./data/counties.json";

// ─── Constants ───────────────────────────────────────────────────────────────

const REV_CATS = [
  "Property Taxes", "Other Taxes", "Sales Tax",
  "Sales & Services", "Intergovernmental", "Debt Proceeds", "Other Misc",
];
const EXP_CATS = [
  "Education", "Debt Service", "Human Services",
  "General Government", "Public Safety", "Other",
];

const PALETTE = {
  "Property Taxes":     "#1B4965",
  "Other Taxes":        "#5FA8D3",
  "Sales Tax":          "#62B6CB",
  "Sales & Services":   "#BEE9E8",
  "Intergovernmental":  "#CAE9FF",
  "Debt Proceeds":      "#95B8D1",
  "Other Misc":         "#D6E2E9",
  "Education":          "#9B2226",
  "Debt Service":       "#AE2012",
  "Human Services":     "#BB3E03",
  "General Government": "#CA6702",
  "Public Safety":      "#EE9B00",
  "Other":              "#E9D8A6",
};

// O(1) name→index lookup used by table row clicks
const NAME_TO_IDX = Object.fromEntries(DATA.map((d, i) => [d.name, i]));

const TABLE_COLS = [
  { key: "name",    label: "County",              sort: (d) => d.name,                     numeric: false },
  { key: "pop",     label: "Population",          sort: (d) => d.pop,                      numeric: true  },
  { key: "group",   label: "Group",               sort: (d) => d.pg,                       numeric: false },
  { key: "rev_pc",  label: "Revenue / Capita",    sort: (d) => d.pr["Total Revenue"],      numeric: true  },
  { key: "exp_pc",  label: "Expenditure / Capita",sort: (d) => d.pe["Total Expenditures"], numeric: true  },
  { key: "grp_rev", label: "Group Avg Rev",       sort: (d) => d.gr["Total Revenue"],      numeric: true  },
  { key: "grp_exp", label: "Group Avg Exp",       sort: (d) => d.ge["Total Expenditures"], numeric: true  },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt    = (n) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};
const fmtPop = (n) => n.toLocaleString();
const fmtPC  = (n) => `$${Math.round(n).toLocaleString()}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", color: "#e0e8f0", fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name || d.payload?.name}</div>
      <div>{fmt(d.value)}</div>
    </div>
  );
};

const PCTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", color: "#e0e8f0", fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span>{p.dataKey}: {fmtPC(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: "20px 24px", border: "1px solid #1a3456", flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#6b8aad", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: accent ?? "#e8f1f8", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#5a7d9a", marginTop: 4 }}>{sub}</div>}
  </div>
);

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SortIcon = ({ active, dir }) => (
  <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 9 }}>
    {active && dir === "asc" ? "▲" : "▼"}
  </span>
);

// Reusable panel: donut + bar side by side
const ChartPanel = ({ title, pieData, barData, cats, countyName, compareCounty, barColor, compareColor }) => (
  <div style={{ marginBottom: 40 }}>
    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#e8f1f8", marginBottom: 16, fontWeight: 700 }}>
      {title}
    </h3>
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: "0 0 300px", background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: 20, border: "1px solid #1a3456" }}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={110} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={2} stroke="#060e1a">
              {pieData.map((d, i) => <Cell key={i} fill={PALETTE[d.name]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
          {cats.map(c => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8aa4bc" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[c], display: "inline-block" }} />
              {c}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 300, background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: 20, border: "1px solid #1a3456" }}>
        <div style={{ fontSize: 12, color: "#6b8aad", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Per Capita vs Group Average
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#152840" />
            <XAxis dataKey="name" tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={{ stroke: "#1a3456" }} tickLine={false} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={{ stroke: "#1a3456" }} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip content={<PCTooltip />} />
            <Bar dataKey="County" fill={barColor} radius={[3, 3, 0, 0]} name={countyName} />
            <Bar dataKey="Group Avg" fill="#2a4a6b" radius={[3, 3, 0, 0]} />
            {compareCounty && <Bar dataKey={compareCounty.name} fill={compareColor} radius={[3, 3, 0, 0]} />}
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b8aad" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NCCountyFinancials() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [compareIdx,  setCompareIdx]  = useState(-1);
  const [view,        setView]        = useState("overview");
  const [searchTerm,  setSearchTerm]  = useState("");
  const [sortKey,     setSortKey]     = useState("rev_pc");
  const [sortDir,     setSortDir]     = useState("desc");

  const county  = DATA[selectedIdx];
  // Prevent accidental self-comparison when selectedIdx changes
  const compare = compareIdx >= 0 && compareIdx !== selectedIdx ? DATA[compareIdx] : null;

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

  // Memoized sort — only re-runs when sort params change, not on every render
  const sortedData = useMemo(() => {
    const col = TABLE_COLS.find(c => c.key === sortKey) ?? TABLE_COLS[3];
    return [...DATA].sort((a, b) => {
      const av = col.sort(a);
      const bv = col.sort(b);
      if (!col.numeric) return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const balance   = county.r["Total Revenue"] - county.e["Total Expenditures"];
  const isSurplus = balance >= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#060e1a", color: "#c8d8e8", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #0a1628 0%, #060e1a 100%)", borderBottom: "1px solid #12253d", padding: "28px 32px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#3a7ca5", fontWeight: 600 }}>North Carolina</span>
            <span style={{ fontSize: 11, color: "#2a4a6b" }}>|</span>
            <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#2a4a6b" }}>FY 2024–25 AFIR Data</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#e8f1f8", margin: 0, letterSpacing: -0.5 }}>
            County Financial Explorer
          </h1>
          <p style={{ fontSize: 13, color: "#4a6d8c", marginTop: 6, maxWidth: 600 }}>
            {DATA.length} counties — revenue sources, expenditure functions, and per capita comparisons from the Annual Financial Information Reports.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>

        {/* Selector row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#4a6d8c", display: "block", marginBottom: 6 }}>Select County</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search counties…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={() => setTimeout(() => setSearchTerm(""), 150)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "#0d1f3c", border: "1px solid #1a3456", borderRadius: 8, color: "#e0e8f0", fontSize: 14, outline: "none" }}
              />
              {searchTerm && filtered.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0d1f3c", border: "1px solid #1a3456", borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 200, overflowY: "auto", zIndex: 10 }}>
                  {filtered.map(d => (
                    <div
                      key={d.idx}
                      onMouseDown={() => { setSelectedIdx(d.idx); setSearchTerm(""); }}
                      style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #0f2640", color: d.idx === selectedIdx ? "#5FA8D3" : "#c8d8e8" }}
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

          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#4a6d8c", display: "block", marginBottom: 6 }}>Compare With</label>
            <select
              value={compareIdx}
              onChange={e => setCompareIdx(Number(e.target.value))}
              style={{ width: "100%", padding: "10px 14px", background: "#0d1f3c", border: "1px solid #1a3456", borderRadius: 8, color: "#e0e8f0", fontSize: 14, outline: "none" }}
            >
              <option value={-1}>None</option>
              {DATA.map((d, i) => i !== selectedIdx && (
                <option key={i} value={i}>{d.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 4, flex: "0 0 auto" }}>
            {["overview", "revenue", "spending"].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "10px 18px", borderRadius: 8,
                  border: "1px solid " + (view === v ? "#3a7ca5" : "#1a3456"),
                  background: view === v ? "#132744" : "transparent",
                  color: view === v ? "#5FA8D3" : "#4a6d8c",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 1,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* County name */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#e8f1f8", margin: 0 }}>
            {county.name}
            <span style={{ fontSize: 16, fontWeight: 400, color: "#4a6d8c", marginLeft: 10, fontFamily: "'DM Sans', sans-serif" }}>County</span>
          </h2>
          {compare && <span style={{ fontSize: 14, color: "#EE9B00", fontWeight: 600 }}>vs {compare.name}</span>}
        </div>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <StatCard label="Population"         value={fmtPop(county.pop)} sub={county.pg} />
          <StatCard label="Total Revenue"      value={fmt(county.r["Total Revenue"])}      sub={`${fmtPC(county.pr["Total Revenue"])} per capita`} />
          <StatCard label="Total Expenditures" value={fmt(county.e["Total Expenditures"])} sub={`${fmtPC(county.pe["Total Expenditures"])} per capita`} />
          <StatCard
            label="Net Balance"
            value={`${isSurplus ? "+" : "−"}${fmt(Math.abs(balance))}`}
            sub={isSurplus ? "Surplus" : "Deficit"}
            accent={isSurplus ? "#62B6CB" : "#AE2012"}
          />
        </div>

        {/* Charts */}
        {(view === "overview" || view === "revenue") && (
          <ChartPanel
            title="Revenue Composition"
            pieData={revPieData}
            barData={pcCompareRevData}
            cats={REV_CATS}
            countyName={county.name}
            compareCounty={compare}
            barColor="#5FA8D3"
            compareColor="#EE9B00"
          />
        )}

        {(view === "overview" || view === "spending") && (
          <ChartPanel
            title="Expenditure Allocation"
            pieData={expPieData}
            barData={pcCompareExpData}
            cats={EXP_CATS}
            countyName={county.name}
            compareCounty={compare}
            barColor="#EE9B00"
            compareColor="#5FA8D3"
          />
        )}

        {/* Sortable ranking table */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#e8f1f8", marginBottom: 16, fontWeight: 700 }}>
            All Counties
          </h3>
          <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, border: "1px solid #1a3456", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a3456" }}>
                    {TABLE_COLS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: "12px 16px", textAlign: "left", fontSize: 10,
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
                        onClick={() => { setSelectedIdx(idx); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{
                          borderBottom: "1px solid #0f2640",
                          background: isSelected ? "#132744" : isCompare ? "#1a2810" : "transparent",
                          cursor: "pointer", transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (!isSelected && !isCompare) e.currentTarget.style.background = "#0f1e35"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isSelected ? "#132744" : isCompare ? "#1a2810" : "transparent"; }}
                      >
                        <td style={{ padding: "10px 16px", fontWeight: isSelected ? 700 : 400, color: isSelected ? "#5FA8D3" : isCompare ? "#EE9B00" : "#c8d8e8" }}>
                          {d.name}
                        </td>
                        <td style={{ padding: "10px 16px", color: "#8aa4bc" }}>{fmtPop(d.pop)}</td>
                        <td style={{ padding: "10px 16px", color: "#6b8aad", fontSize: 11 }}>{d.pg}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "#e8f1f8" }}>{fmtPC(d.pr["Total Revenue"])}</td>
                        <td style={{ padding: "10px 16px", color: "#c8d8e8" }}>{fmtPC(d.pe["Total Expenditures"])}</td>
                        <td style={{ padding: "10px 16px", color: "#4a6d8c" }}>{fmtPC(d.gr["Total Revenue"])}</td>
                        <td style={{ padding: "10px 16px", color: "#4a6d8c" }}>{fmtPC(d.ge["Total Expenditures"])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0 40px", borderTop: "1px solid #12253d", fontSize: 11, color: "#2a4a6b" }}>
          Source: NC Department of State Treasurer — Annual Financial Information Reports (AFIR) · Fiscal Year ending 6/30/2025
        </div>

      </div>
    </div>
  );
}
