// Feature 1 — Fund Balance Gauge
// Displays a county's FBA % against LGC minimum (8%) and group/state averages.

const LGC_FBA_MIN = 0.08;

function fmtFbPct(val) {
  return (val * 100).toFixed(1) + "%";
}

function trackDomain(county, compare) {
  const vals = [
    LGC_FBA_MIN,
    county.fb?.pct,
    county.fb?.grp_pct,
    county.fb?.state_pct,
    compare?.fb?.pct,
    compare?.fb?.grp_pct,
  ].filter((v) => v != null && v > 0);
  if (!vals.length) return 1;
  return Math.max(Math.min(Math.max(...vals) * 1.35, 1), LGC_FBA_MIN * 3);
}

function fillColor(pct) {
  if (pct < LGC_FBA_MIN) return "#DC2626";
  if (pct <= 0.25) return "#D97706";
  return "#059669";
}

function statusLabel(pct) {
  if (pct < LGC_FBA_MIN) return "Below minimum";
  if (pct <= 0.25) return "At risk";
  return "Healthy";
}

function GaugeTrack({ fb, countyName, domain, thin = false }) {
  if (!fb || fb.pct == null) return null;

  const { pct, grp_pct, state_pct } = fb;
  const toX = (v) => `${Math.min((v / domain) * 100, 100)}%`;

  const trackH  = thin ? 7 : 10;
  const color   = fillColor(pct);

  return (
    <div style={{ position: "relative", marginBottom: thin ? 6 : 20 }}>
      {/* State avg label */}
      {!thin && state_pct != null && (
        <div style={{
          position: "absolute", right: 0, top: -16,
          fontSize: 10, color: "#9CA3AF",
        }}>
          State avg: {fmtFbPct(state_pct)}
        </div>
      )}

      {/* County % label above fill */}
      {!thin && (
        <div style={{
          position: "absolute",
          left: toX(pct),
          top: -16,
          transform: "translateX(-50%)",
          fontSize: 11,
          fontWeight: 700,
          color: color,
          whiteSpace: "nowrap",
        }}>
          {fmtFbPct(pct)}
        </div>
      )}

      {/* Track */}
      <div style={{
        position: "relative",
        height: trackH,
        background: "#EEF0F2",
        borderRadius: 6,
        overflow: "visible",
      }}>
        {/* Fill */}
        <div style={{
          position: "absolute",
          left: 0, top: 0,
          height: "100%",
          width: toX(pct),
          background: color,
          borderRadius: 6,
          transition: "width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          opacity: 0.85,
        }} />

        {/* LGC min tick */}
        <div style={{
          position: "absolute",
          left: toX(LGC_FBA_MIN),
          top: -3,
          width: 2,
          height: trackH + 6,
          background: "rgba(0,0,0,0.2)",
          borderRadius: 1,
        }} />

        {/* Group avg tick */}
        {grp_pct != null && (
          <div style={{
            position: "absolute",
            left: toX(grp_pct),
            top: -3,
            width: 2,
            height: trackH + 6,
            background: "#D97706",
            borderRadius: 1,
          }} />
        )}
      </div>

      {/* Labels below track */}
      <div style={{
        position: "relative",
        height: 20,
        marginTop: 4,
        fontSize: 10,
        color: "#9CA3AF",
      }}>
        <span style={{
          position: "absolute",
          left: toX(LGC_FBA_MIN),
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          color: "#6B7280",
        }}>
          LGC Min 8%
        </span>

        {grp_pct != null && (
          <span style={{
            position: "absolute",
            left: toX(grp_pct),
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            color: "#D97706",
          }}>
            Group Avg {fmtFbPct(grp_pct)}
          </span>
        )}
      </div>

      {thin && (
        <div style={{ fontSize: 11, color: color, marginTop: 4 }}>
          {countyName}: {fmtFbPct(pct)}
        </div>
      )}
    </div>
  );
}

export default function FundBalanceGauge({ county, compare }) {
  const hasFb  = county.fb && county.fb.pct != null;
  const domain = trackDomain(county, compare);

  return (
    <div
      className="card-hover"
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: "22px 24px",
        border: "1px solid #E8E7E4",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        height: "100%",
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
      }}>
        Fund Balance
      </div>

      {hasFb && (
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: fillColor(county.fb.pct),
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.1,
          marginBottom: 18,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
          letterSpacing: "-0.5px",
        }}>
          {fmtFbPct(county.fb.pct)}
          <span style={{ fontSize: 12, fontWeight: 400, color: fillColor(county.fb.pct), fontFamily: "'DM Sans', sans-serif" }}>
            {statusLabel(county.fb.pct)}
          </span>
          {county.fb.grp_pct != null && (
            <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3AF" }}>
              Group avg {fmtFbPct(county.fb.grp_pct)}
            </span>
          )}
        </div>
      )}

      {!hasFb ? (
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderLeft: "3px solid #D97706",
          padding: "12px 14px",
          borderRadius: 6,
        }}>
          <span style={{ color: "#D97706", marginRight: 8 }}>⚠</span>
          <strong style={{ color: "#92400E", fontSize: 13 }}>
            Fund balance data not available
          </strong>
          <p style={{ color: "#92400E", margin: "6px 0 0", fontSize: 12, opacity: 0.8 }}>
            {county.name} County did not file an audit that was included in
            this AFIR dataset.
          </p>
        </div>
      ) : (
        <>
          <GaugeTrack
            fb={county.fb}
            countyName={county.name}
            domain={domain}
            thin={false}
          />

          {compare && compare.fb && compare.fb.pct != null && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                fontSize: 10,
                color: "#B45309",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontWeight: 600,
              }}>
                {compare.name} (compare)
              </div>
              <GaugeTrack
                fb={compare.fb}
                countyName={compare.name}
                domain={domain}
                thin={true}
              />
            </div>
          )}

          {compare && (!compare.fb || compare.fb.pct == null) && (
            <div style={{
              marginTop: 10,
              fontSize: 12,
              color: "#92400E",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderLeft: "3px solid #D97706",
              padding: "8px 12px",
              borderRadius: 4,
            }}>
              <span style={{ color: "#D97706", marginRight: 6 }}>⚠</span>
              Fund balance data not available for {compare.name} County.
            </div>
          )}
        </>
      )}
    </div>
  );
}
