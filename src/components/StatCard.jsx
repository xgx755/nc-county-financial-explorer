export default function StatCard({ label, value, sub, accent, isMobile }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0d1f3c 0%, #132744 100%)",
      borderRadius: 12,
      padding: isMobile ? "14px 16px" : "20px 24px",
      border: "1px solid #1a3456",
      flex: 1,
      minWidth: isMobile ? "calc(50% - 6px)" : 160,
      boxSizing: "border-box",
    }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#6b8aad", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? 20 : 26,
        fontWeight: 700,
        color: accent ?? "#e8f1f8",
        fontFamily: "'Playfair Display', serif",
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#5a7d9a", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}
