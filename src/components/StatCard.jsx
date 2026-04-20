function Sparkline({ trend }) {
  if (!trend || trend.length < 2) return null;

  const values = trend.map(([, v]) => v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 60;
  const h = 20;
  const n = values.length;

  const points = values
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block", marginTop: 6 }}>
      <polyline
        points={points}
        fill="none"
        stroke="#1D4ED8"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export default function StatCard({ label, value, sub, accent, isMobile, trend }) {
  return (
    <div
      className="card-hover"
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: isMobile ? "16px 18px" : "22px 24px",
        border: "1px solid #E8E7E4",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        flex: 1,
        minWidth: isMobile ? "calc(50% - 6px)" : 160,
        boxSizing: "border-box",
      }}
    >
      <div style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: "#9CA3AF",
        marginBottom: 8,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? 22 : 28,
        fontWeight: 700,
        color: accent ?? "#111827",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.1,
        letterSpacing: "-0.5px",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: 12,
          color: "#9CA3AF",
          marginTop: 5,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {sub}
        </div>
      )}
      {trend && <Sparkline trend={trend} />}
    </div>
  );
}
