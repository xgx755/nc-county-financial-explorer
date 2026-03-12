import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DATA = [{ "name": "Alexander", "pop": 35958, "pg": "25,000 to 49,999", "r": { "Property Taxes": 27204270, "Other Taxes": 2415597, "Sales Tax": 13606848, "Sales & Services": 9447165, "Intergovernmental": 22580868, "Debt Proceeds": 518431, "Other Misc": 3674033, "Total Revenue": 79447212 }, "e": { "Education": 12842910, "Debt Service": 1989142, "Human Services": 11939978, "General Government": 8814407, "Public Safety": 20849460, "Other": 10456935, "Total Expenditures": 66892832 }, "pr": { "Property Taxes": 756.56, "Other Taxes": 67.18, "Sales Tax": 378.41, "Sales & Services": 262.73, "Intergovernmental": 627.98, "Debt Proceeds": 14.42, "Other Misc": 102.18, "Total Revenue": 2209.44 }, "pe": { "Education": 357.16, "Debt Service": 55.32, "Human Services": 332.05, "General Government": 245.13, "Public Safety": 579.83, "Other": 290.81, "Total Expenditures": 1860.3 }, "gr": { "Property Taxes": 1010.78, "Other Taxes": 172.54, "Sales Tax": 425.65, "Sales & Services": 343.25, "Intergovernmental": 554.88, "Debt Proceeds": 205.14, "Other Misc": 152.72, "Total Revenue": 2864.97 }, "ge": { "Education": 581.33, "Debt Service": 152.76, "Human Services": 423.56, "General Government": 340.33, "Public Safety": 714.77, "Other": 547.72, "Total Expenditures": 2760.49 } }, { "name": "Alleghany", "pop": 11504, "pg": "Below 25,000", "r": { "Property Taxes": 12904485, "Other Taxes": 1351362, "Sales Tax": 4242044, "Sales & Services": 2328080, "Intergovernmental": 13963504, "Debt Proceeds": 6849620, "Other Misc": 2051916, "Total Revenue": 43691011 }, "e": { "Education": 11628164, "Debt Service": 865702, "Human Services": 4949198, "General Government": 6230341, "Public Safety": 8081417, "Other": 1849406, "Total Expenditures": 33604228 }, "pr": { "Property Taxes": 1121.74, "Other Taxes": 117.47, "Sales Tax": 368.75, "Sales & Services": 202.37, "Intergovernmental": 1213.8, "Debt Proceeds": 595.41, "Other Misc": 178.37, "Total Revenue": 3797.9 }, "pe": { "Education": 1010.79, "Debt Service": 75.25, "Human Services": 430.22, "General Government": 541.58, "Public Safety": 702.49, "Other": 160.76, "Total Expenditures": 2921.09 }, "gr": { "Property Taxes": 923.69, "Other Taxes": 85.61, "Sales Tax": 284.65, "Sales & Services": 420.36, "Intergovernmental": 1519.44, "Debt Proceeds": 416.68, "Other Misc": 142.89, "Total Revenue": 3793.32 }, "ge": { "Education": 1579.88, "Debt Service": 83.17, "Human Services": 390.25, "General Government": 303.16, "Public Safety": 617.27, "Other": 467.38, "Total Expenditures": 3441.11 } }, { "name": "Anson", "pop": 21900, "pg": "Below 25,000", "r": { "Property Taxes": 18846871, "Other Taxes": 1931661, "Sales Tax": 4613718, "Sales & Services": 13868985, "Intergovernmental": 28506710, "Debt Proceeds": 0, "Other Misc": 2503023, "Total Revenue": 70270968 }, "e": { "Education": 31794237, "Debt Service": 789271, "Human Services": 8726127, "General Government": 6473557, "Public Safety": 15475613, "Other": 14428325, "Total Expenditures": 77687130 }, "pr": { "Property Taxes": 860.59, "Other Taxes": 88.2, "Sales Tax": 210.67, "Sales & Services": 633.29, "Intergovernmental": 1301.68, "Debt Proceeds": 0, "Other Misc": 114.29, "Total Revenue": 3208.72 }, "pe": { "Education": 1451.79, "Debt Service": 36.04, "Human Services": 398.45, "General Government": 295.6, "Public Safety": 706.65, "Other": 658.83, "Total Expenditures": 3547.36 }, "gr": { "Property Taxes": 923.69, "Other Taxes": 85.61, "Sales Tax": 284.65, "Sales & Services": 420.36, "Intergovernmental": 1519.44, "Debt Proceeds": 416.68, "Other Misc": 142.89, "Total Revenue": 3793.32 }, "ge": { "Education": 1579.88, "Debt Service": 83.17, "Human Services": 390.25, "General Government": 303.16, "Public Safety": 617.27, "Other": 467.38, "Total Expenditures": 3441.11 } }, { "name": "Ashe", "pop": 26431, "pg": "25,000 to 49,999", "r": { "Property Taxes": 27096989, "Other Taxes": 1168800, "Sales Tax": 11631113, "Sales & Services": 2138725, "Intergovernmental": 17728970, "Debt Proceeds": 45721160, "Other Misc": 3900475, "Total Revenue": 109386232 }, "e": { "Education": 12193069, "Debt Service": 3306855, "Human Services": 13237861, "General Government": 11487850, "Public Safety": 17126249, "Other": 9231719, "Total Expenditures": 66583603 }, "pr": { "Property Taxes": 1025.2, "Other Taxes": 44.22, "Sales Tax": 440.06, "Sales & Services": 80.92, "Intergovernmental": 670.76, "Debt Proceeds": 1729.83, "Other Misc": 147.57, "Total Revenue": 4138.56 }, "pe": { "Education": 461.32, "Debt Service": 125.11, "Human Services": 500.85, "General Government": 434.64, "Public Safety": 647.96, "Other": 349.28, "Total Expenditures": 2519.15 }, "gr": { "Property Taxes": 1010.78, "Other Taxes": 172.54, "Sales Tax": 425.65, "Sales & Services": 343.25, "Intergovernmental": 554.88, "Debt Proceeds": 205.14, "Other Misc": 152.72, "Total Revenue": 2864.97 }, "ge": { "Education": 581.33, "Debt Service": 152.76, "Human Services": 423.56, "General Government": 340.33, "Public Safety": 714.77, "Other": 547.72, "Total Expenditures": 2760.49 } }, { "name": "Bladen", "pop": 29393, "pg": "25,000 to 49,999", "r": { "Property Taxes": 30853222, "Other Taxes": 437293, "Sales Tax": 9578536, "Sales & Services": 15727218, "Intergovernmental": 9380201, "Debt Proceeds": 0, "Other Misc": 3855365, "Total Revenue": 69831835 }, "e": { "Education": 11607494, "Debt Service": 3206047, "Human Services": 15784103, "General Government": 8697980, "Public Safety": 22686481, "Other": 11236842, "Total Expenditures": 73218947 }, "pr": { "Property Taxes": 1049.68, "Other Taxes": 14.88, "Sales Tax": 325.88, "Sales & Services": 535.07, "Intergovernmental": 319.13, "Debt Proceeds": 0, "Other Misc": 131.17, "Total Revenue": 2375.8 }, "pe": { "Education": 394.91, "Debt Service": 109.08, "Human Services": 537, "General Government": 295.92, "Public Safety": 771.83, "Other": 382.3, "Total Expenditures": 2491.03 }, "gr": { "Property Taxes": 1010.78, "Other Taxes": 172.54, "Sales Tax": 425.65, "Sales & Services": 343.25, "Intergovernmental": 554.88, "Debt Proceeds": 205.14, "Other Misc": 152.72, "Total Revenue": 2864.97 }, "ge": { "Education": 581.33, "Debt Service": 152.76, "Human Services": 423.56, "General Government": 340.33, "Public Safety": 714.77, "Other": 547.72, "Total Expenditures": 2760.49 } }];

const REV_CATS = ["Property Taxes", "Other Taxes", "Sales Tax", "Sales & Services", "Intergovernmental", "Debt Proceeds", "Other Misc"];
const EXP_CATS = ["Education", "Debt Service", "Human Services", "General Government", "Public Safety", "Other"];

const PALETTE = {
    "Property Taxes": "#1B4965",
    "Other Taxes": "#5FA8D3",
    "Sales Tax": "#62B6CB",
    "Sales & Services": "#BEE9E8",
    "Intergovernmental": "#CAE9FF",
    "Debt Proceeds": "#95B8D1",
    "Other Misc": "#D6E2E9",
    "Education": "#9B2226",
    "Debt Service": "#AE2012",
    "Human Services": "#BB3E03",
    "General Government": "#CA6702",
    "Public Safety": "#EE9B00",
    "Other": "#E9D8A6",
};

const fmt = (n) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${Math.round(n)}`;
};
const fmtPop = (n) => n.toLocaleString();
const fmtPC = (n) => `$${Math.round(n).toLocaleString()}`;

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

const StatCard = ({ label, value, sub }) => (
    <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: "20px 24px", border: "1px solid #1a3456", flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#6b8aad", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#e8f1f8", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "#5a7d9a", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
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

export default function NCCountyFinancials() {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [compareIdx, setCompareIdx] = useState(-1);
    const [view, setView] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");

    const county = DATA[selectedIdx];
    const compare = compareIdx >= 0 ? DATA[compareIdx] : null;

    const filtered = useMemo(() =>
        DATA.map((d, i) => ({ ...d, idx: i })).filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
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
        REV_CATS.map(c => ({ name: c.length > 14 ? c.slice(0, 12) + "…" : c, fullName: c, County: county.pr[c], "Group Avg": county.gr[c], ...(compare ? { [compare.name]: compare.pr[c] } : {}) })),
        [county, compare]
    );
    const pcCompareExpData = useMemo(() =>
        EXP_CATS.map(c => ({ name: c.length > 14 ? c.slice(0, 12) + "…" : c, fullName: c, County: county.pe[c], "Group Avg": county.ge[c], ...(compare ? { [compare.name]: compare.pe[c] } : {}) })),
        [county, compare]
    );

    const balance = county.r["Total Revenue"] - county.e["Total Expenditures"];

    return (
        <div style={{ minHeight: "100vh", background: "#060e1a", color: "#c8d8e8", fontFamily: "'DM Sans', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

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
                        Annual Financial Information Report — Showing placeholder sample of counties. Revenue sources, expenditure functions, and per capita comparisons.
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
                {/* County Selector Row */}
                <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 240px" }}>
                        <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#4a6d8c", display: "block", marginBottom: 6 }}>Select County</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Search counties…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", background: "#0d1f3c", border: "1px solid #1a3456", borderRadius: 8, color: "#e0e8f0", fontSize: 14, outline: "none" }}
                            />
                            {searchTerm && (
                                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0d1f3c", border: "1px solid #1a3456", borderRadius: "0 0 8px 8px", maxHeight: 200, overflow: "auto", zIndex: 10 }}>
                                    {filtered.map(d => (
                                        <div
                                            key={d.idx}
                                            onClick={() => { setSelectedIdx(d.idx); setSearchTerm(""); }}
                                            style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #0f2640", color: d.idx === selectedIdx ? "#5FA8D3" : "#c8d8e8" }}
                                            onMouseEnter={e => e.target.style.background = "#132744"}
                                            onMouseLeave={e => e.target.style.background = "transparent"}
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
                            {DATA.map((d, i) => i !== selectedIdx && <option key={i} value={i}>{d.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: 4, flex: "0 0 auto" }}>
                        {["overview", "revenue", "spending"].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                style={{
                                    padding: "10px 18px", borderRadius: 8, border: "1px solid " + (view === v ? "#3a7ca5" : "#1a3456"),
                                    background: view === v ? "#132744" : "transparent", color: view === v ? "#5FA8D3" : "#4a6d8c",
                                    cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans', sans-serif"
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* County Name Banner */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "#e8f1f8", margin: 0 }}>
                        {county.name}
                        <span style={{ fontSize: 16, fontWeight: 400, color: "#4a6d8c", marginLeft: 10, fontFamily: "'DM Sans', sans-serif" }}>County</span>
                    </h2>
                    {compare && (
                        <span style={{ fontSize: 14, color: "#EE9B00", fontWeight: 600 }}>vs {compare.name}</span>
                    )}
                </div>

                {/* Stat Cards */}
                <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
                    <StatCard label="Population" value={fmtPop(county.pop)} sub={county.pg} />
                    <StatCard label="Total Revenue" value={fmt(county.r["Total Revenue"])} sub={`${fmtPC(county.pr["Total Revenue"])} per capita`} />
                    <StatCard label="Total Expenditures" value={fmt(county.e["Total Expenditures"])} sub={`${fmtPC(county.pe["Total Expenditures"])} per capita`} />
                    <StatCard
                        label="Net Balance"
                        value={fmt(Math.abs(balance))}
                        sub={balance >= 0 ? "Surplus" : "Deficit"}
                    />
                </div>

                {/* Overview / Revenue / Spending */}
                {(view === "overview" || view === "revenue") && (
                    <div style={{ marginBottom: 40 }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#e8f1f8", marginBottom: 16, fontWeight: 700 }}>
                            Revenue Composition
                        </h3>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <div style={{ flex: "0 0 300px", background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: 20, border: "1px solid #1a3456" }}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={revPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={110} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={2} stroke="#060e1a">
                                            {revPieData.map((d, i) => <Cell key={i} fill={PALETTE[d.name]} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
                                    {REV_CATS.map(c => (
                                        <div key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8aa4bc" }}>
                                            <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[c], display: "inline-block" }} />
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 300, background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: 20, border: "1px solid #1a3456" }}>
                                <div style={{ fontSize: 12, color: "#6b8aad", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Per Capita Revenue vs Group Average</div>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={pcCompareRevData} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#152840" />
                                        <XAxis dataKey="name" tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={{ stroke: "#1a3456" }} tickLine={false} angle={-30} textAnchor="end" height={60} />
                                        <YAxis tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={{ stroke: "#1a3456" }} tickLine={false} tickFormatter={v => `$${v}`} />
                                        <Tooltip content={<PCTooltip />} />
                                        <Bar dataKey="County" fill="#5FA8D3" radius={[3, 3, 0, 0]} name={county.name} />
                                        <Bar dataKey="Group Avg" fill="#2a4a6b" radius={[3, 3, 0, 0]} />
                                        {compare && <Bar dataKey={compare.name} fill="#EE9B00" radius={[3, 3, 0, 0]} />}
                                        <Legend wrapperStyle={{ fontSize: 11, color: "#6b8aad" }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {(view === "overview" || view === "spending") && (
                    <div style={{ marginBottom: 40 }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#e8f1f8", marginBottom: 16, fontWeight: 700 }}>
                            Expenditure Allocation
                        </h3>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <div style={{ flex: "0 0 300px", background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: 20, border: "1px solid #1a3456" }}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={expPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={110} dataKey="value" labelLine={false} label={PieLabel} strokeWidth={2} stroke="#060e1a">
                                            {expPieData.map((d, i) => <Cell key={i} fill={PALETTE[d.name]} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
                                    {EXP_CATS.map(c => (
                                        <div key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8aa4bc" }}>
                                            <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[c], display: "inline-block" }} />
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 300, background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, padding: 20, border: "1px solid #1a3456" }}>
                                <div style={{ fontSize: 12, color: "#6b8aad", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Per Capita Spending vs Group Average</div>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={pcCompareExpData} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#152840" />
                                        <XAxis dataKey="name" tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={{ stroke: "#1a3456" }} tickLine={false} angle={-30} textAnchor="end" height={60} />
                                        <YAxis tick={{ fill: "#6b8aad", fontSize: 10 }} axisLine={{ stroke: "#1a3456" }} tickLine={false} tickFormatter={v => `$${v}`} />
                                        <Tooltip content={<PCTooltip />} />
                                        <Bar dataKey="County" fill="#EE9B00" radius={[3, 3, 0, 0]} name={county.name} />
                                        <Bar dataKey="Group Avg" fill="#2a4a6b" radius={[3, 3, 0, 0]} />
                                        {compare && <Bar dataKey={compare.name} fill="#5FA8D3" radius={[3, 3, 0, 0]} />}
                                        <Legend wrapperStyle={{ fontSize: 11, color: "#6b8aad" }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Ranking Table */}
                <div style={{ marginBottom: 40 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#e8f1f8", marginBottom: 16, fontWeight: 700 }}>
                        All Counties — Per Capita Total Revenue
                    </h3>
                    <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)", borderRadius: 12, border: "1px solid #1a3456", overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #1a3456" }}>
                                        {["County", "Population", "Group", "Revenue PC", "Expenditure PC", "Group Avg Rev", "Group Avg Exp"].map(h => (
                                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#4a6d8c", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...DATA].sort((a, b) => b.pr["Total Revenue"] - a.pr["Total Revenue"]).map((d, i) => {
                                        const isSelected = d.name === county.name;
                                        const isCompare = compare && d.name === compare.name;
                                        return (
                                            <tr
                                                key={d.name}
                                                onClick={() => { setSelectedIdx(DATA.indexOf(d)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                                style={{
                                                    borderBottom: "1px solid #0f2640",
                                                    background: isSelected ? "#132744" : isCompare ? "#1a2a10" : "transparent",
                                                    cursor: "pointer",
                                                    transition: "background 0.15s"
                                                }}
                                                onMouseEnter={e => { if (!isSelected && !isCompare) e.currentTarget.style.background = "#0f1e35"; }}
                                                onMouseLeave={e => { if (!isSelected && !isCompare) e.currentTarget.style.background = "transparent"; }}
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
                    Source: NC Department of State Treasurer — Annual Financial Information Reports (AFIR) as of 6/30/2025
                </div>
            </div>
        </div>
    );
}
