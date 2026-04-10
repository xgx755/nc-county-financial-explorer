# NC County Financial Explorer — Feature Spec
**Version:** 1.1  
**Date:** April 10, 2026  
**Scope:** Five features to be implemented in the existing React/Vite single-page application

---

## Codebase Baseline

| Item | Detail |
|---|---|
| Framework | React 19, Vite 8 |
| Charting | Recharts 3 (lazy-loaded) |
| Data | Static `src/data/counties.json` (75 counties) |
| Styling | Inline CSS-in-JS, dark theme |
| State | Single component (`nc-county-financials.jsx`) — `useState` / `useMemo` |
| Deploy | GitHub Pages via `gh-pages` package |

---

## Feature 1 — Fund Balance Visualization

### What it does

Displays a selected county's General Fund Balance Available (FBA) as a percentage of net expenditures, benchmarked visually against its peer-group average and the NC Local Government Commission's recommended minimum floor of 8%.

### Data findings (xlsx inspection)

The Excel file (`County and Municipal AFIRs for Selected Year.xlsx`) stores fund-balance measures in four rows. All values below column G onward represent individual counties in the same column order as the rest of the dataset.

| Row | Label | Notes |
|---|---|---|
| 91 | FBA in dollars | Raw dollar amount |
| 92 | **FBA as % of GF Net Expenditures — Unit's own %** | Primary display value; stored as a decimal (e.g., `0.337` = 33.7%) |
| 93 | FBA as % of GF Net Expenditures — Group Average | Pre-computed per population group |
| 94 | FBA as % of GF Net Expenditures — State Average | Single value repeated across all counties |
| 95 | Number of Counties Reporting Audit in Group | Denominator context |

**Data coverage:** 73 of the 75 counties currently in `counties.json` report FBA data. **Bladen County** and **Greene County** have `null` values for all FBA fields — their audits were not included in this AFIR dataset. Both must be handled with a specific null-state UI (see below).

**Recommended rows to include:** 91, 92, 93, 94. Row 95 is useful metadata but not required for display.

### Data pipeline change

The conversion script (or whatever process regenerates `counties.json`) must be updated to extract these four rows and append the following fields to each county object:

```json
{
  "fb": {
    "dollars": 78141221,
    "pct":      0.33721109,
    "grp_pct":  0.47434616,
    "state_pct": 0.47582004
  }
}
```

- `pct`, `grp_pct`, and `state_pct` are stored as raw decimals (0.0–1.0). The UI converts to display percentage.
- If a county has no audit data (Bladen, Greene), all four fields should be `null`.
- The LGC 8% floor is a constant in UI code, not stored in the JSON (`LGC_MIN = 0.08`).

### UI specification

**Placement:** A new section below the four stat cards and above the chart panel, visible whenever a county is selected. Title: "Fund Balance".

**Visual:** A horizontal gauge / benchmark bar. Conceptually:

```
 0%    8%                          33.7%        Group Avg 47.4%
 |-----|---------------------------|-------------|
       ^LGC min                   ^ This county  ^ Group avg
```

Concrete elements:
1. **Track** — a full-width bar (background `#1a2a3a`), ~12px tall, rounded ends.
2. **County fill** — colored segment from 0 to `pct`. Color logic:
   - `< 8%` → red (`#AE2012`) — below LGC minimum
   - `8%–25%` → orange (`#EE9B00`) — meets minimum, below median
   - `> 25%` → green-teal (`#62B6CB`) — healthy
3. **LGC line** — a vertical tick at 8% with a label "LGC Min 8%" below the track.
4. **Group average marker** — a vertical tick at `grp_pct` with label "Group Avg XX%".
5. **County label** — displayed above or at the right end of the county fill segment showing the percentage to one decimal place (e.g., "33.7%").
6. **State average** — shown as a secondary small label, not a marker on the track, to keep the visual clean: "State avg: 47.6%"

**Number formatting:** All FBA percentages are displayed to **one decimal place** throughout the UI (gauge labels, tooltips, CSV export). Use `(value * 100).toFixed(1) + '%'`. This matters most for values close to the 8% LGC threshold where rounding to integers could misrepresent compliance status.

**Null state (Bladen and Greene counties):** When the selected county is Bladen or Greene, the fund balance section renders a styled notice card in place of the gauge:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠  Fund balance data not available                      │
│     Bladen County did not file an audit that was         │
│     included in this AFIR dataset. Fund balance figures  │
│     cannot be reported for this county.                  │
└─────────────────────────────────────────────────────────┘
```

- Background: `#1a2a3a`, border-left: `3px solid #EE9B00`, padding: 16px
- Icon: `⚠` in orange (`#EE9B00`)
- Text: county-specific — always names the county explicitly so it reads as intentional, not a bug
- The section header "Fund Balance" still appears above the card so layout is consistent

**Compare county:** If a compare county is selected and has FBA data, show a second, thinner track directly below the primary one using the same scale, so both counties' fund balances are comparable at a glance.

**No new chart library needed** — this can be implemented in pure CSS/SVG within a React component (`FundBalanceGauge.jsx`).

---

## Feature 2 — Peer Group Rankings Bar

### What it does

Shows where the selected county ranks among all counties in its population group for the currently selected metric. Renders as a single labeled horizontal strip with a position marker — e.g., "5th of 18 in its group" — so a budget officer understands relative standing without reading a table.

### Data requirements

No data change needed. All counties in the same peer group (`pg` field) are already in `counties.json`. Rankings are computed client-side at render time.

### Metric scope

The ranking bar applies to the metric currently in focus. The logical starting point is **Revenue per capita** (`pr["Total Revenue"]`) and **Expenditure per capita** (`pe["Total Expenditures"]`). If the user is on the "revenue" view, rank by revenue per capita; on "spending" view, rank by expenditure per capita; on "overview", default to revenue per capita. Once Fund Balance (Feature 1) is added, a "Fund Balance %" ranking mode should also be supported.

### Computation (client-side, `useMemo`)

Highest value = 1st place for all metrics. This is consistent and predictable — budget officers can always interpret "ranked 1st" as "highest value in the group" without needing per-metric context.

```js
// Pseudocode
const peers = DATA.filter(c => c.pg === selected.pg);
const sorted = [...peers].sort((a, b) => b[metricKey] - a[metricKey]); // desc — highest = 1st
const rank = sorted.findIndex(c => c.name === selected.name) + 1; // 1-indexed
const total = peers.length;
const position = (rank - 1) / (total - 1); // 0.0 (left/highest) to 1.0 (right/lowest)
```

### UI specification

**Placement:** Directly below the county headline / stat cards section, above the fund balance gauge. A subtle labeled row:

```
Revenue per capita rank within group (50,000–99,999):  5th of 18
[====|=============================================]
  Highest                                        Lowest
```

Concrete elements:
1. **Label row** — `"{Metric} rank within group ({group label}): {rank}th of {total}"`
2. **Track** — full-width bar, 8px tall, gradient from accent blue (left/high) to muted (right/low).
3. **Marker** — a circular dot (12px diameter, white fill, blue stroke) positioned at `position * 100%` left.
4. **Axis labels** — "Highest" (left) and "Lowest" (right) in small muted text.
5. **Tooltip** — hovering the marker shows a small popup: "[County]: [value] per capita" (dollar metrics) or "[County]: XX.X%" (fund balance metric — one decimal).

**Ties:** If two counties share the same value, they share the same rank (standard competition ranking). The label becomes e.g., "T-5th of 18".

**Compare county:** If a compare county is in the same group, show its marker in a different color (green) on the same track. If the compare county is in a different group, omit it from the track and show a note: "[Compare County] is in a different population group."

**Null state for fund balance metric:** If the selected county is Bladen or Greene and the active ranking metric is Fund Balance %, the ranking bar is hidden and replaced with the same styled notice card used in the Fund Balance gauge section: "Fund balance data not available for [County] — ranking unavailable."

**Null / single-member group:** If only one county exists in the group (edge case), hide the ranking bar entirely.

**New component:** `PeerRankBar.jsx`

---

## Feature 3 — Choropleth Map Tab

### What it does

Adds a "Map" tab alongside the existing view. It renders a static SVG of all 100 NC counties, colored by the selected metric. Clicking a county navigates to that county's data view. Counties not in the AFIR dataset (25 of 100) are shown in a neutral color. This is a navigation surface, not a standalone dashboard.

### Architecture decision: SVG source

Use a **pre-built static public-domain SVG file** of NC's 100 counties, included directly in the repository. This eliminates any runtime geography library dependency and keeps the bundle lean.

**Decided approach:** Source an existing public-domain NC county SVG (e.g., from Wikimedia Commons or the US Census Bureau's public domain map assets). Each `<path>` element must carry an `id` attribute matching the county name exactly as it appears in `counties.json` (e.g., `id="Alamance"`). A one-time preprocessing step (manual or scripted) strips any inline styles, removes municipality boundaries if present, and sets the correct `id` values.

Add the processed file to `public/nc-counties.svg`. At runtime, load it via `fetch('/nc-counties.svg')` inside a `useEffect` and inject it with `dangerouslySetInnerHTML` — this avoids adding `vite-plugin-svgr` as a build dependency and keeps the SVG queryable as live DOM nodes for color application.

### Tab structure change

Add a tab bar to the top of the main content area (below the selector controls):

```
[ Data View ]  [ Map View ]
```

`activeTab` becomes a new piece of top-level state: `"data"` (default) | `"map"`. All existing content renders under the "data" tab unchanged.

### Map component: `ChoroplethMap.jsx`

**Props received from parent:**
- `data` — the full counties array
- `selectedCounty` — currently selected county name (string | null)
- `metric` — the key to color by (e.g., `"pr.Total Revenue"`, `"fb.pct"`)
- `onCountyClick(name)` — callback; sets `selectedIdx` in parent and switches `activeTab` to `"data"`

**Color scale:**
- Use a sequential 5-step color scale (e.g., lightest to `#5FA8D3` darkest).
- Domain: min and max of the metric across only the 75 AFIR counties.
- Counties not in AFIR dataset: `#1a2a3a` (muted, same as card background).
- Selected county: outlined with a 2px white stroke (not a fill change, to preserve the metric color).
- Hover: lighten fill by 15%, show tooltip with county name + metric value.

**Metric selector:**
A small `<select>` dropdown above the map controls which metric the map is colored by. This selection is **independent of the data view's current `view` state** — changing the map metric does not affect the data tab, and vice versa. The map stores its own `mapMetric` state variable initialized to `"pr.Total Revenue"`.

Options:
- Revenue per capita (`pr["Total Revenue"]`)
- Expenditure per capita (`pe["Total Expenditures"]`)
- Net surplus/deficit per capita (derived: `pr["Total Revenue"] - pe["Total Expenditures"]`)
- Fund Balance % (`fb.pct`) — counties with `null` FBA (Bladen, Greene) are shown in the neutral "not in AFIR" color when this metric is selected, with a legend footnote: "† Fund balance data unavailable for 2 counties"

**Tooltip:** On hover, show a small floating label: "[County] — $X,XXX / capita" (or "XX.X% fund balance" — one decimal). For counties not in the AFIR dataset, the tooltip shows "[County] — Not in AFIR dataset".

**Legend:** A horizontal color gradient strip below the map, labeled with min and max values and "Not in AFIR dataset" swatch.

**Responsive behavior:** The SVG scales to fill its container (`width: 100%`, `viewBox` preserved). On mobile, map is shown at full width; the metric dropdown stacks above.

**Performance:** Color computation is O(n) over 75 counties and runs in a `useMemo`. No animation on initial load — colors are applied synchronously before paint.

### County name normalization

The SVG IDs and `counties.json` names must match exactly. A normalization function should handle edge cases:
- SVG may use "McDowell" while JSON uses "Mcdowell" → normalize to lowercase for comparison
- SVG may have spaces; JSON names do not include "County" suffix — strip it from SVG IDs

---

## Feature 4 — Export / Share

### Sub-feature 4A: Shareable URL

#### What it does

Encodes the current view state into the page URL as query parameters. Copying and sharing the URL opens the tool in exactly the same state. No server required — all state lives in `window.location.search`.

#### State to encode

| Parameter | Values | Example |
|---|---|---|
| `county` | URL-encoded county name | `?county=Durham` |
| `compare` | URL-encoded compare county name, or absent | `&compare=Wake` |
| `view` | `overview` \| `revenue` \| `spending` | `&view=revenue` |
| `tab` | `data` \| `map` | `&tab=map` *(optional, default=data)* |

Example: `https://[gh-pages-url]/?county=Durham&compare=Wake&view=revenue`

#### Implementation

**On load (`useEffect` with empty deps):**
```js
const params = new URLSearchParams(window.location.search);
const countyName = params.get('county');
const compareName = params.get('compare');
const view = params.get('view') || 'overview';
// Resolve names to indices via NAME_TO_IDX
```

**On state change (`useEffect` watching `[selectedIdx, compareIdx, view, activeTab]`):**
```js
const params = new URLSearchParams();
if (selectedIdx >= 0) params.set('county', DATA[selectedIdx].name);
if (compareIdx >= 0) params.set('compare', DATA[compareIdx].name);
params.set('view', view);
history.replaceState(null, '', '?' + params.toString());
```

Use `replaceState` (not `pushState`) so the browser back button is not polluted with every state change.

**Share button:** A small "Share" button (chain-link icon) in the header that calls `navigator.clipboard.writeText(window.location.href)` and briefly shows a "Copied!" confirmation tooltip. No modal needed.

**Edge cases:**
- Unknown county name in URL → silently ignore, load with no selection.
- County in URL that equals compare county → ignore compare param.

### Sub-feature 4B: CSV Download

#### What it does

Downloads the rankings table as it is currently sorted and filtered — same rows, same order — as a `.csv` file. Client-side only using the Blob API.

#### Data to include

All columns currently visible in the ranking table, plus any new fields from Feature 1:

| Column | Source |
|---|---|
| County | `name` |
| Population | `pop` |
| Population Group | `pg` |
| Revenue / Capita | `pr["Total Revenue"]` |
| Expenditure / Capita | `pe["Total Expenditures"]` |
| Net Surplus/Deficit / Capita | derived |
| Group Avg Revenue / Capita | `gr["Total Revenue"]` |
| Group Avg Expenditure / Capita | `ge["Total Expenditures"]` |
| Fund Balance % | `fb.pct * 100` (if available) |
| Group Avg FBA % | `fb.grp_pct * 100` (if available) |

#### Implementation

```js
function downloadCSV(rows) {
  const headers = ['County', 'Population', 'Group', ...];
  const lines = [headers.join(','), ...rows.map(row => [...].join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nc-county-financials.csv';
  a.click();
  URL.revokeObjectURL(url);
}
```

The function receives the already-sorted/filtered row array (same `useMemo` result that drives the table render) — no re-sorting needed.

**Trigger:** A "Download CSV" button in the table header row, right-aligned. Label: "↓ CSV". No modal, no confirmation — download is non-destructive.

**Filename:** `nc-county-financials-FY2025.csv`

**Escaping:** Wrap any string values that may contain commas in double quotes.

---

## Feature 5 — About This Data Modal

### What it does

A dismissible informational overlay that explains the data source, coverage, and scope. Triggered by a persistent info button (ⓘ) in the page header. No interactivity beyond open and close.

### Content

```
About This Data

Source
This tool uses data from the Annual Financial Information Report (AFIR), 
published by the NC Department of State Treasurer. AFIR collects financial 
data submitted directly by local governments.

Fiscal Year
Data reflects fiscal year ending June 30, 2025.

Coverage
75 of North Carolina's 100 counties are included. Counties may be absent 
because they had not yet filed their audit at the time of data export, or 
because their AFIR submission was incomplete.

Fund Balance
Fund balance data reflects General Fund Balance Available (FBA) as reported 
in each county's audit. Bladen and Greene counties are included in the dataset 
but did not file audits captured by this AFIR export — fund balance figures 
are unavailable for these two counties.

The NC Local Government Commission recommends that counties maintain a 
General Fund balance of at least 8% of net expenditures (G.S. 159-8).

Learn More
NC Department of State Treasurer — Local Government Financial Data
[https://www.nctreasurer.gov/lgc/Pages/AFIR.aspx]
```

### UI specification

**Trigger:** A small circular icon button (`ⓘ`) in the top-right area of the page header, always visible. `aria-label="About this data"`.

**Modal:** A centered overlay with:
- Semi-transparent backdrop (`rgba(0,0,0,0.65)`) covering the full viewport
- A content card (max-width 560px, padding 32px, background `#0d1e2e`, border `1px solid #2a3a4a`, border-radius 8px)
- Close button (`×`) in the top-right corner of the card, `aria-label="Close"`
- Pressing `Escape` also closes the modal
- Focus is trapped inside the modal while open (tab cycles through the link and close button only)
- Body scroll is locked while modal is open (`overflow: hidden` on `<body>`)

**State:** `modalOpen` boolean added to `nc-county-financials.jsx` top-level state. No routing change needed.

**Accessibility:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title
- On open: focus moves to the modal title or close button
- On close: focus returns to the ⓘ button that opened it

**New component:** `AboutModal.jsx`

---

## Implementation Order (Recommended)

The features are largely independent. Suggested sequencing:

1. **Feature 5 (About Modal)** — Lowest risk, no data changes, good first PR to validate component patterns.
2. **Feature 4B (CSV Download)** — Pure logic, no UI risk, depends only on existing sorted data array.
3. **Feature 4A (Shareable URL)** — Touches top-level state management; do after CSV so URL-encoding logic is stable.
4. **Feature 1 (Fund Balance)** — Requires data pipeline update first (xlsx re-extraction), then UI.
5. **Feature 2 (Peer Rankings Bar)** — Best added after Fund Balance so FBA % is available as a ranking metric.
6. **Feature 3 (Choropleth Map)** — Largest UI surface area; do last so SVG sourcing and tab structure changes are isolated.

---

## New Files

| File | Purpose |
|---|---|
| `src/components/FundBalanceGauge.jsx` | Feature 1 — gauge component |
| `src/components/PeerRankBar.jsx` | Feature 2 — peer ranking bar |
| `src/components/ChoroplethMap.jsx` | Feature 3 — SVG map |
| `src/components/AboutModal.jsx` | Feature 5 — info overlay |
| `public/nc-counties.svg` | Feature 3 — static NC county SVG |
| `scripts/convert-data.js` | Updated to extract fb rows 91–94 |

---

## Data Schema Change (counties.json)

Add the following field to each county object. Existing fields are unchanged.

```json
{
  "fb": {
    "dollars":   78141221,
    "pct":       0.33721109,
    "grp_pct":   0.47434616,
    "state_pct": 0.47582004
  }
}
```

If a county has no fund balance data, the field should be:
```json
{ "fb": null }
```

**Bladen County** and **Greene County** will have `{ "fb": null }`. These are the only two counties in the 75-county dataset that did not file an audit included in this AFIR dataset.

---

## Constants to Add

```js
// In nc-county-financials.jsx or a shared constants file
const LGC_FBA_MIN = 0.08;         // 8% LGC recommended minimum
const AFIR_FISCAL_YEAR = "FY2025"; // For CSV filename, About modal
const AFIR_COUNTY_COUNT = 75;      // For About modal copy
const TREASURER_URL = "https://www.nctreasurer.gov/lgc/Pages/AFIR.aspx";
```

---

## Resolved Decisions

All five open questions from v1.0 are now resolved:

| # | Question | Decision |
|---|---|---|
| 1 | SVG map source | Use an existing public-domain NC SVG — no TIGER/Line generation needed |
| 2 | Map metric selector | Independent of data view state; map has its own `mapMetric` state variable |
| 3 | FBA display precision | One decimal place throughout (e.g., "33.7%") |
| 4 | Ranking direction | Highest value = 1st for all metrics, consistently |
| 5 | Missing FBA counties | **Bladen** and **Greene** — confirmed via xlsx inspection; specific null-state UI specified above |
