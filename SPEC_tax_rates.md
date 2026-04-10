# Spec: Property Tax Rate Integration
**Budget Tool — NC County Financial Explorer**
*Drafted: April 10, 2026*

---

## Overview

Integrate 2025–2026 NC county property tax rates into four locations across the app: the **Data View overview**, the **revenue breakdown ranking bar**, the **list view table**, and the **map view choropleth**. The source data is `2025-2026_Tax_Rates_&_Effective_Tax_Rates.xlsx` (NC Department of Revenue, Local Government Division).

---

## Background & Data Notes

### Source file structure

The file has one relevant sheet: `Tax Rates & Effective Tax Rates`. Each row in that sheet represents a (county, municipality) pairing. The "county only" rows (where the `Municipality` column = `"county only"`) represent the county-wide rate with no municipal overlay — those are the values needed here.

Relevant columns from the "county only" rows:

| Column | Key | Example (Alamance) |
|---|---|---|
| County | `county_name` | `"Alamance"` |
| County Rate [Note 1] | `county_rate` | `0.494` |
| Effective County Rate [Note 2] | `effective_rate` | `0.4592` |
| Year of Latest Appraisal | `appraisal_year` | `2023` |
| 2025 Sales Assessment Ratio | `sales_ratio` | `0.9296` |

**Units:** Rates are expressed as dollars per $100 of assessed value (e.g., `0.494` = $0.494 per $100 assessed value, displayed as `$0.494 / $100`).

**Nominal vs. effective rate — when to use each:**
- **Nominal county rate** (`county_rate`): the rate set by the county's governing board, shown on tax bills. Use for display in the overview stat card and list view column — it's the number residents recognize.
- **Effective county rate** (`effective_rate`): adjusted by the 2025 sales assessment ratio to account for counties being on different reappraisal cycles. A fairer apples-to-apples comparison across counties. Use for the map choropleth coloring and the peer ranking bar.

### Coverage
The tax rate file covers all 100 NC counties. The AFIR dataset (`counties.json`) covers 75 counties. All 75 AFIR counties are present in the tax rate file after one name normalization fix: the tax file records `"Mcdowell"` but the AFIR data uses `"McDowell"` — the extraction script must handle this.

---

## Step 1 — Data Pipeline: Extend `counties.json`

### 1a. Write extraction script

Create `scripts/merge_tax_rates.py`. This script reads the Excel file, extracts county-only rows, and merges the tax fields into `src/data/counties.json`.

**Logic:**

```python
# For each row in the sheet where municipality == "county only":
#   normalize county name (title-case to match AFIR convention)
#   extract: county_rate, effective_rate, appraisal_year, sales_ratio
#
# For each county in counties.json:
#   look up by name; add a "tax" key:
#   {
#     "county_rate":   <float>,   # e.g. 0.494
#     "effective_rate": <float>,  # e.g. 0.4592
#     "appraisal_year": <int>,    # e.g. 2023
#     "sales_ratio":   <float>    # e.g. 0.9296
#   }
#   if no match found: set "tax" to null and log a warning
```

**Name normalization:** Apply `.title()` to the raw Excel county name before lookup. This converts `"Mcdowell"` → `"Mcdowell"` — also apply a specific override map: `{"Mcdowell": "McDowell"}` to match AFIR casing.

### 1b. Updated schema

After running the script, each record in `counties.json` gains a `tax` field:

```json
{
  "name": "Alamance",
  "pop": 175213,
  "pg": "100,000 or Above",
  "tax": {
    "county_rate": 0.494,
    "effective_rate": 0.4592,
    "appraisal_year": 2023,
    "sales_ratio": 0.9296
  },
  ...
}
```

Counties that have no match in the tax file receive `"tax": null`. Based on current data, this should be zero counties after the McDowell fix, but null-safe access (`county.tax?.county_rate`) must be used throughout the UI.

### 1c. Formatter functions

Add these to the shared formatter section in `nc-county-financials.jsx` (alongside existing `fmt`, `fmtPop`, `fmtPC`):

```js
// Format a nominal or effective tax rate as "$0.XXX / $100"
const fmtTaxRate = (r) => r != null ? `$${r.toFixed(3)} / $100` : "—";

// Compact version for tight spaces (list table cells)
const fmtTaxRateShort = (r) => r != null ? `$${r.toFixed(3)}` : "—";
```

---

## Step 2 — Data View: Overview Stat Card

### Location
In `nc-county-financials.jsx`, inside the `activeTab === "data"` block, within the `<div>` that renders the four existing `<StatCard>` components (Population, Total Revenue, Total Expenditures, Net Balance).

### Change
Add a fifth `<StatCard>` as the last card in the row:

```jsx
<StatCard
  isMobile={isMobile}
  label="County Tax Rate"
  value={fmtTaxRate(county.tax?.county_rate)}
  sub={county.tax
    ? `Eff. $${county.tax.effective_rate.toFixed(3)} · ${county.tax.appraisal_year} appraisal`
    : undefined}
/>
```

- **`value`**: Nominal county rate, e.g. `"$0.494 / $100"`. If `tax` is null, shows `"—"`.
- **`sub`**: Effective rate and appraisal year, e.g. `"Eff. $0.459 · 2023 appraisal"`. Omitted if `tax` is null.
- No custom `accent` color (uses default `#e8f1f8`).

### Layout note
The five-card row will wrap naturally at mobile breakpoints — no layout changes needed since existing `minWidth` on StatCard handles it.

---

## Step 3 — Revenue Breakdown: Tax Rate Peer Ranking Bar

### Location
In `nc-county-financials.jsx`, inside the `(view === "overview" || view === "revenue")` block, after the existing `<PeerRankBar metricKey="pr.Total Revenue" />`.

### Change — extend `PeerRankBar` metric support

`PeerRankBar` currently uses a hardcoded `getMetricValue` function that only understands three metric keys. Add a new case:

In `PeerRankBar.jsx`:

```js
// In getMetricValue():
if (metricKey === "tax.effective_rate") return county.tax?.effective_rate ?? null;

// In fmtMetricValue():
if (metricKey === "tax.effective_rate") return r != null ? `$${r.toFixed(3)} / $100` : "N/A";

// In metricLabel():
if (metricKey === "tax.effective_rate") return "Effective county tax rate";
```

### Change — render the bar

Add a new `<PeerRankBar>` after the revenue one:

```jsx
{county.tax != null && (
  <PeerRankBar
    DATA={DATA}
    county={county}
    compare={compare}
    metricKey="tax.effective_rate"
  />
)}
```

**Why effective rate here:** The peer ranking bar explicitly compares a county against its population group. Effective rates adjust for reappraisal cycles, making cross-county comparison meaningful. The bar header already shows the metric label ("Effective county tax rate rank within group (100,000 or Above)"), so the distinction is clear to the reader.

**Ranking direction:** The existing `PeerRankBar` renders highest values on the right. For tax rates, a **higher rate = higher tax burden**, so the default direction (low left → high right) is appropriate and intuitive with no changes needed.

**Null handling:** The wrapping `county.tax != null` guard prevents rendering the bar for any county with missing tax data.

---

## Step 4 — List View: Tax Rate Column

### Location
In `nc-county-financials.jsx`, in the `TABLE_COLS` constant array.

### Change — add column definition

Add a new entry after `"fb_pct"`:

```js
{ key: "tax_rate", label: "Tax Rate", sort: (d) => d.tax?.county_rate ?? -1, numeric: true },
```

- **`sort`**: Uses `county_rate` (nominal), which is the right choice for a sort — users sorting by this column expect the rate they recognize. Counties with null tax data sort last (`-1`).
- **`label`**: `"Tax Rate"` in the column header.

### Change — render the cell

In the `<tbody>` row map inside the list table, add a new `<td>` after the `fb_pct` cell:

```jsx
<td style={{ padding: isMobile ? "8px 10px" : "10px 16px", color: "#c8d8e8", whiteSpace: "nowrap" }}>
  {fmtTaxRateShort(d.tax?.county_rate)}
</td>
```

### Change — update CSV export

In `downloadCSV()`:

Add `"Tax Rate ($/100)"` to the `headers` array, and add `escapeCSV(d.tax?.county_rate?.toFixed(3) ?? "")` to the corresponding position in the row mapper.

---

## Step 5 — Map View: Tax Rate Choropleth Layer

### Location
In `ChoroplethMap.jsx`.

### Change — add metric button

Add a new entry to `METRIC_BUTTONS`:

```js
{ key: "tax.effective_rate", label: "Tax Rate" },
```

**Position:** Insert after `"fb.pct"` (making it the 5th button). This keeps financial metrics grouped together and tax rate as a natural extension.

**Why effective rate on the map:** The choropleth is a statewide comparison tool. Effective rates correct for appraisal cycle differences and give a more accurate picture of actual tax burden by county. The tooltip can show both values for full transparency.

### Change — extend `getMetricValue`

```js
// In ChoroplethMap.jsx getMetricValue():
if (metricKey === "tax.effective_rate") return county.tax?.effective_rate ?? null;
```

### Change — extend `fmtTooltipValue`

```js
// In ChoroplethMap.jsx fmtTooltipValue():
if (metricKey === "tax.effective_rate") return value != null ? `$${value.toFixed(3)} / $100 (effective)` : null;
```

### Change — extend `fmtLegend`

```js
// In ChoroplethMap.jsx fmtLegend():
if (mapMetric === "tax.effective_rate") return v != null ? `$${v.toFixed(3)}` : "";
```

### Change — enrich the hover tooltip

The existing tooltip shows only the metric value. For tax rate, show both values for context. In the `mouseover` handler's tooltip HTML construction, add a special case:

```js
// Inside the mouseover handler, after building the county name line:
const extraLine = mapMetric === "tax.effective_rate" && county.tax
  ? `<br/><span style="color:#6b8aad;font-size:11px">Nominal: $${county.tax.county_rate.toFixed(3)} · ${county.tax.appraisal_year} appraisal</span>`
  : "";
tt.innerHTML = `<strong ...>${countyName}</strong><span ...> — ${fmtTooltipValue(val, mapMetric)}</span>${extraLine}`;
```

### Change — enrich the mini county panel

In the panel's stat grid (the `[{ label, value, color }]` array), add a tax rate tile when the metric is `"tax.effective_rate"` or unconditionally as a fifth stat:

Add a new tile to the stat grid array:

```js
{ label: "Tax Rate",
  value: county.tax ? `$${county.tax.county_rate.toFixed(3)} / $100` : "—",
  color: "#e8f1f8" },
```

This appears in the click-to-expand panel for all metrics, giving users tax context regardless of which map layer is active.

### Change — legend footnote

Append a conditional footnote beneath the legend (similar to the existing fund balance footnote):

```jsx
{mapMetric === "tax.effective_rate" && (
  <span style={{ fontSize: 10, color: "#8aa4bc", fontStyle: "italic" }}>
    † Effective rates adjust for reappraisal cycle differences · Source: NC Dept. of Revenue 2025–26
  </span>
)}
```

---

## Implementation Order

1. **Step 1** (data pipeline) — run `merge_tax_rates.py`, verify all 75 AFIR counties have a `tax` field, commit the updated `counties.json`.
2. **Step 4** (list view column) — lowest-risk UI change, good smoke test that the data loaded correctly.
3. **Step 2** (overview stat card) — straightforward `<StatCard>` addition.
4. **Step 5** (map view) — extends `ChoroplethMap.jsx`; test that the new metric button renders, colors correctly, tooltip is correct.
5. **Step 3** (revenue ranking bar) — extends `PeerRankBar.jsx`; confirm null guards work for counties missing tax data.

---

## Out of Scope

- **Municipal rates:** The Excel file contains municipal overlay rates for each municipality within each county. These are excluded from this implementation. The tool is county-scoped.
- **Special district rates:** Excluded per Note 1 in the source file — neither county nor municipal rates in the source include special district rates.
- **Historical tax rate trends:** The source file covers 2025–26 only. No year-over-year comparison is in scope.
- **Effective combined rate:** The combined (county + municipal) effective rate is not surfaced, as the tool is county-scoped.
- **Rate vs. revenue reconciliation:** Property tax revenue per capita (already in the tool via `pr["Property Taxes"]`) and the tax rate are related but driven by different datasets; no attempt is made to cross-validate them.

---

## Open Questions

1. **Nominal vs. effective in the list and overview:** This spec defaults to nominal rate (`county_rate`) for the stat card and list column on the grounds that it's the rate residents recognize. If the goal is cross-county comparability in those views too, switch to `effective_rate` — the same formatter applies. If desired, both could be shown (e.g., stat card shows nominal, sub-line shows effective, as specced above).

2. **Rate coloring in the list table:** Should the Tax Rate cell in the list table use a color scale (like the `fb_pct` cell uses red/yellow/blue)? A heat scale based on quartile would be visually useful but adds implementation complexity. The current spec uses a flat `#c8d8e8` color for simplicity.

3. **Map metric button label:** `"Tax Rate"` is proposed for the button. Alternatives: `"Tax Rate (Eff.)"` to signal effective rate, or just `"Tax Rate"` with the tooltip/legend footnote providing clarity. The shorter label is preferred given the existing button labels.
