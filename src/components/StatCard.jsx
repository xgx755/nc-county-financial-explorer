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
        stroke="#60A5FA"
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
        background: "#152030",
        borderRadius: 12,
        padding: isMobile ? "16px 18px" : "22px 24px",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.25)",
        flex: 1,
        minWidth: isMobile ? "calc(50% - 6px)" : 160,
        boxSizing: "border-box",
      }}
    >
      <div style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: "#4A6480",
        marginBottom: 8,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? 26 : 36,
        fontWeight: 700,
        color: accent ?? "#FFFFFF",
        fontFamily: "'Barlow', 'DM Sans', sans-serif",
        lineHeight: 1.1,
        letterSpacing: "-0.5px",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: 12,
          color: "#7A9AB8",
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
