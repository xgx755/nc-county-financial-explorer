// Heavy chunk — imported lazily so Recharts is excluded from the initial bundle.
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Palette (only needed by chart rendering) ─────────────────────────────────

const PALETTE = {
  "Property Taxes":     "#1E40AF",
  "Other Taxes":        "#2563EB",
  "Sales Tax":          "#0284C7",
  "Sales & Services":   "#0891B2",
  "Intergovernmental":  "#0D9488",
  "Debt Proceeds":      "#64748B",
  "Other Misc":         "#94A3B8",
  "Education":          "#7F1D1D",
  "Debt Service":       "#B91C1C",
  "Human Services":     "#9A3412",
  "General Government": "#C2410C",
  "Public Safety":      "#D97706",
  "Other":              "#A8A29E",
};

// ─── Internal tooltip components ──────────────────────────────────────────────

const fmt = (n) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};

const fmtPC = (n) => `$${Math.round(n).toLocaleString()}`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E7E4", borderRadius: 8, padding: "10px 14px", color: "#111827", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name || d.payload?.name}</div>
      <div style={{ color: "#6B7280" }}>{fmt(d.value)}</div>
    </div>
  );
};

const PCTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E7E4", borderRadius: 8, padding: "10px 14px", color: "#111827", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, color: "#6B7280" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span>{p.dataKey}: {fmtPC(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

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

// ─── ChartPanel ───────────────────────────────────────────────────────────────

export default function ChartPanel({
  title, pieData, barData, cats,
  countyName, compareCounty, barColor, compareColor, isMobile,
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 17, color: "#111827", marginBottom: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", gap: 14, flexDirection: isMobile ? "column" : "row" }}>

        {/* Donut */}
        <div
          className="card-hover"
          style={{
            flex: isMobile ? "1 1 auto" : "0 0 300px",
            background: "#FFFFFF",
            borderRadius: 12, padding: isMobile ? 14 : 20,
            border: "1px solid #E8E7E4",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}
        >
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                innerRadius={isMobile ? 40 : 55} outerRadius={isMobile ? 80 : 105}
                dataKey="value" labelLine={false} label={PieLabel}
                strokeWidth={2} stroke="#FFFFFF"
              >
                {pieData.map((d, i) => <Cell key={i} fill={PALETTE[d.name]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
            {cats.map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9CA3AF" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[c], display: "inline-block", flexShrink: 0 }} />
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div
          className="card-hover"
          style={{
            flex: 1, minWidth: 0,
            background: "#FFFFFF",
            borderRadius: 12, padding: isMobile ? 14 : 20,
            border: "1px solid #E8E7E4",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Per Capita vs Group Average
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <BarChart data={barData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: isMobile ? 9 : 10 }}
                axisLine={{ stroke: "#E8E7E4" }} tickLine={false}
                angle={-30} textAnchor="end" height={isMobile ? 48 : 60}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: isMobile ? 9 : 10 }}
                axisLine={{ stroke: "#E8E7E4" }} tickLine={false}
                tickFormatter={v => `$${v}`}
                width={isMobile ? 42 : 60}
              />
              <Tooltip content={<PCTooltip />} />
              <Bar dataKey="County" fill={barColor} radius={[3, 3, 0, 0]} name={countyName} />
              <Bar dataKey="Group Avg" fill="#D1D5DB" radius={[3, 3, 0, 0]} />
              {compareCounty && (
                <Bar dataKey={compareCounty.name} fill={compareColor} radius={[3, 3, 0, 0]} />
              )}
              <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
