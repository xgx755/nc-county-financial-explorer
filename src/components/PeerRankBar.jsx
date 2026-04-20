import { useMemo } from "react";

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
  if (metricKey === "pr.Total Revenue")      return "Revenue / capita";
  if (metricKey === "pe.Total Expenditures") return "Expenditure / capita";
  if (metricKey === "fb.pct")                return "Fund Balance %";
  if (metricKey === "tax.effective_rate")    return "Effective tax rate";
  return metricKey;
}

const SHOW_ALL_THRESHOLD = 9;
const EDGE_ROWS          = 2;
const NEIGHBOR_WINDOW    = 2;

export default function PeerRankBar({ DATA, county, compare, metricKey, standalone = true }) {
  const primaryNull = metricKey === "fb.pct" && county.fb == null;

  const peers = useMemo(
    () => DATA.filter(c => c.pg === county.pg),
    [DATA, county.pg]
  );
  const validPeers = useMemo(
    () => peers.filter(c => getMetricValue(c, metricKey) != null),
    [peers, metricKey]
  );

  if (peers.length < 2 || primaryNull) return null;

  const sorted = useMemo(
    () => [...validPeers].sort((a, b) => getMetricValue(b, metricKey) - getMetricValue(a, metricKey)),
    [validPeers, metricKey]
  );
  const total = sorted.length;

  const myIdx     = sorted.findIndex(c => c.name === county.name);
  const myRank    = myIdx + 1;
  const myVal     = getMetricValue(county, metricKey);
  const isTie     = validPeers.filter(c => getMetricValue(c, metricKey) === myVal).length > 1;
  const rankLabel = `${isTie ? "T-" : ""}${ordinal(myRank)} of ${total}`;

  const sameGroup  = compare && compare.pg === county.pg;
  const compareIdx = sameGroup ? sorted.findIndex(c => c.name === compare.name) : -1;

  const displayRows = useMemo(() => {
    if (total <= SHOW_ALL_THRESHOLD) {
      return sorted.map((c, i) => ({ county: c, rank: i + 1 }));
    }

    const show = new Set();
    for (let i = 0; i < Math.min(EDGE_ROWS, total); i++) show.add(i);
    for (let i = Math.max(0, total - EDGE_ROWS); i < total; i++) show.add(i);
    for (let i = Math.max(0, myIdx - NEIGHBOR_WINDOW); i <= Math.min(total - 1, myIdx + NEIGHBOR_WINDOW); i++) show.add(i);
    if (compareIdx >= 0) {
      for (let i = Math.max(0, compareIdx - 1); i <= Math.min(total - 1, compareIdx + 1); i++) show.add(i);
    }

    const indices = [...show].sort((a, b) => a - b);
    const result = [];
    for (let j = 0; j < indices.length; j++) {
      if (j > 0 && indices[j] !== indices[j - 1] + 1) {
        result.push({ ellipsis: true, key: `gap-${j}` });
      }
      result.push({ county: sorted[indices[j]], rank: indices[j] + 1 });
    }
    return result;
  }, [sorted, total, myIdx, compareIdx]);

  const content = (
    <>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 10, flexWrap: "wrap", gap: 4,
      }}>
        <span style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
          {metricLabel(metricKey)}
          {standalone && ` — ${county.pg}`}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8" }}>
          {rankLabel}
        </span>
      </div>

      <div>
        {displayRows.map((row, i) => {
          if (row.ellipsis) {
            return (
              <div key={row.key} style={{
                fontSize: 11, color: "#D1D5DB",
                padding: "2px 0 2px 30px",
                letterSpacing: 1,
              }}>
                ···
              </div>
            );
          }

          const isSelected = row.county.name === county.name;
          const isCompare  = sameGroup && compare && row.county.name === compare.name;
          const val        = getMetricValue(row.county, metricKey);

          return (
            <div key={row.county.name} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "3px 6px",
              borderRadius: 5,
              marginBottom: 1,
              background: isSelected
                ? "rgba(29, 78, 216, 0.06)"
                : isCompare
                ? "rgba(180, 83, 9, 0.06)"
                : "transparent",
              borderLeft: isSelected
                ? "2px solid #1D4ED8"
                : isCompare
                ? "2px solid #B45309"
                : "2px solid transparent",
            }}>
              <span style={{
                width: 18,
                fontSize: 10,
                color: isSelected ? "#1D4ED8" : isCompare ? "#B45309" : "#D1D5DB",
                textAlign: "right",
                flexShrink: 0,
                fontVariantNumeric: "tabular-nums",
              }}>
                {row.rank}
              </span>
              <span style={{
                flex: 1,
                fontSize: 12,
                color: isSelected ? "#1D4ED8" : isCompare ? "#B45309" : "#6B7280",
                fontWeight: isSelected || isCompare ? 700 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {row.county.name}
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: isSelected || isCompare ? 700 : 400,
                color: isSelected ? "#1D4ED8" : isCompare ? "#B45309" : "#9CA3AF",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}>
                {fmtMetricValue(val, metricKey)}
              </span>
            </div>
          );
        })}
      </div>

      {compare && !sameGroup && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#9CA3AF", fontStyle: "italic" }}>
          {compare.name} ({compare.pg}) — different group, not ranked here.
        </div>
      )}
    </>
  );

  if (!standalone) return content;

  return (
    <div
      className="card-hover"
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: "16px 20px",
        border: "1px solid #E8E7E4",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}
    >
      {content}
    </div>
  );
}
