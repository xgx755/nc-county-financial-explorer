// Heavy chunk — imported lazily so Recharts is excluded from the initial bundle.
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Palette (only needed by chart rendering) ─────────────────────────────────

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
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, color: "#e8f1f8", marginBottom: 16, fontWeight: 700 }}>
        {title}
      </h3>
      <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row" }}>

        {/* Donut */}
        <div style={{
          flex: isMobile ? "1 1 auto" : "0 0 300px",
          background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)",
          borderRadius: 12, padding: isMobile ? 14 : 20, border: "1px solid #1a3456",
        }}>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                innerRadius={isMobile ? 40 : 55} outerRadius={isMobile ? 80 : 110}
                dataKey="value" labelLine={false} label={PieLabel}
                strokeWidth={2} stroke="#060e1a"
              >
                {pieData.map((d, i) => <Cell key={i} fill={PALETTE[d.name]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
            {cats.map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8aa4bc" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[c], display: "inline-block", flexShrink: 0 }} />
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{
          flex: 1, minWidth: 0,
          background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)",
          borderRadius: 12, padding: isMobile ? 14 : 20, border: "1px solid #1a3456",
        }}>
          <div style={{ fontSize: 12, color: "#6b8aad", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Per Capita vs Group Average
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
            <BarChart data={barData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#152840" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b8aad", fontSize: isMobile ? 9 : 10 }}
                axisLine={{ stroke: "#1a3456" }} tickLine={false}
                angle={-30} textAnchor="end" height={isMobile ? 48 : 60}
              />
              <YAxis
                tick={{ fill: "#6b8aad", fontSize: isMobile ? 9 : 10 }}
                axisLine={{ stroke: "#1a3456" }} tickLine={false}
                tickFormatter={v => `$${v}`}
                width={isMobile ? 42 : 60}
              />
              <Tooltip content={<PCTooltip />} />
              <Bar dataKey="County" fill={barColor} radius={[3, 3, 0, 0]} name={countyName} />
              <Bar dataKey="Group Avg" fill="#2a4a6b" radius={[3, 3, 0, 0]} />
              {compareCounty && (
                <Bar dataKey={compareCounty.name} fill={compareColor} radius={[3, 3, 0, 0]} />
              )}
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b8aad" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
