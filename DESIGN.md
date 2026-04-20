# NC County Financial Explorer — Design System

Updated: 2026-04-16

---

## Product type

APP UI — data-dense workspace for government finance professionals (budget directors, county finance officers, journalists, policy analysts). Not a marketing site. Calm, professional, trustworthy.

---

## Typography

| Role | Font | Weight | Size | Tracking | Usage |
|------|------|--------|------|----------|-------|
| Display | DM Serif Display | 400 | 40px desktop / 28px mobile | -0.5px | Hero county name **only** |
| Page title | DM Sans | 700 | 28-32px | -0.5px | "County Financial Explorer" |
| Section heading | DM Sans | 700 | 15-17px | -0.2px | Chart titles |
| Stat value | DM Sans | 700 | 22-28px | -0.5px | Metric values in stat cards |
| Label | DM Sans | 600 | 10px | 1.5px UPPERCASE | Stat card labels, column headers |
| Body | DM Sans | 400 | 13-14px | normal | Descriptions, narrative text |
| Small | DM Sans | 400 | 11-12px | normal | Secondary meta, sub-values |

**Rule:** DM Serif Display appears ONLY on the hero county name. DM Sans everywhere else.

---

## Color tokens

```css
/* Surfaces */
--bg:              #F7F6F4;   /* Page background (warm off-white) */
--surface:         #FFFFFF;   /* Cards, panels, inputs */
--surface-2:       #F3F2F0;   /* Muted surfaces, even table rows */

/* Borders */
--border:          #E8E7E4;   /* Default borders */
--border-muted:    #EEECEA;   /* Very subtle borders */

/* Text */
--text:            #111827;   /* Primary text */
--text-2:          #6B7280;   /* Secondary text, labels */
--text-muted:      #9CA3AF;   /* Placeholder, disabled — use for labels only (fails body contrast) */
--text-dim:        #D1D5DB;   /* Dividers, ellipsis */

/* Accents */
--accent:          #1D4ED8;   /* Active tab, selected state, focus rings */
--accent-bg:       rgba(29,78,216,0.06);  /* Selected row, highlighted items */
--compare:         #B45309;   /* Compare county (amber, darkened for light bg) */
--compare-bg:      rgba(180,83,9,0.06);

/* Semantic */
--positive:        #059669;   /* Surplus, fund balance ≥ 25% */
--warning:         #D97706;   /* At-risk, fund balance 8-25% */
--negative:        #DC2626;   /* Deficit, fund balance < 8% LGC minimum */

/* Elevation */
--shadow-sm:       0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:       0 4px 14px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
--shadow-lg:       0 8px 28px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.07);
```

---

## Chart palette (Civic Blue)

Revenue categories:
```
Property Taxes      #1E40AF   deep navy
Other Taxes         #2563EB   blue
Sales Tax           #0284C7   sky
Sales & Services    #0891B2   teal
Intergovernmental   #0D9488   emerald-teal
Debt Proceeds       #64748B   slate
Other Misc          #94A3B8   light slate
```

Expenditure categories:
```
Education           #7F1D1D   deep red
Debt Service        #B91C1C   red
Human Services      #9A3412   rust
General Government  #C2410C   orange-red
Public Safety       #D97706   amber
Other               #A8A29E   warm gray
```

Pie chart: `stroke="#FFFFFF"` (white separator between segments).
Bar chart: Group Avg bars = `#D1D5DB` (light gray, clearly secondary).

---

## Spacing scale (8px base)

```
xs:    4px   Tight gaps (icon to text)
sm:    8px   Between related items
md:   16px   Card padding (mobile), sibling gaps
lg:   24px   Card padding (desktop), section gaps
xl:   32px   Major section separation
2xl:  48px   Page-level breathing room
```

---

## Component specs

### Cards
```
background: #FFFFFF
border: 1px solid #E8E7E4
border-radius: 12px
box-shadow: var(--shadow-sm)
padding: 22px 24px (desktop) / 16px 18px (mobile)

hover:
  box-shadow: var(--shadow-md)
  transform: translateY(-1px)
  transition: box-shadow 0.2s ease, transform 0.18s ease
```

### Buttons (header actions: Share, Info)
```
background: transparent
border: 1px solid #E8E7E4
border-radius: 8px
color: #6B7280
padding: 7px 12px
font-size: 13px

hover:
  border-color: #1D4ED8
  color: #1D4ED8
  transition: all 0.15s ease

active: transform: scale(0.97)

mobile info button: min 44x44px (a11y)
```

### Tab bar
```
Container: role="tablist", border-bottom: 1px solid #E8E7E4

Tab button: role="tab", aria-selected="true/false"
  default: color #6B7280, no border, no background
  hover: color #374151, transition 150ms ease
  active (aria-selected=true):
    color: #1D4ED8
    border-bottom: 2px solid #1D4ED8
    margin-bottom: -1px (flush with container border)
  font-size: 13px (desktop) / 12px (mobile)
  font-weight: 500 (default) / 600 (active)
```

### Inputs + Selects
```
background: #FFFFFF
border: 1px solid #E8E7E4
border-radius: 8px
padding: 10px 14px
color: #111827
font-size: 14px

focus:
  border-color: #1D4ED8
  box-shadow: 0 0 0 3px rgba(29,78,216,0.1)
  outline: none
```

### Fund balance status labels
```
≥ 25%:   color #059669, label "Healthy"
8-25%:   color #D97706, label "At risk"
< 8%:    color #DC2626, label "Below minimum"
```

### Source badge (fallback data)
```
background: #FFFBEB
border: 1px solid #FDE68A
border-radius: 999px
color: #92400E
font-size: 11px
font-weight: 700
padding: 4px 10px
```

### Section dividers
```
display: flex, alignItems: center, gap: 14px
Label: DM Sans 700, 10px, UPPERCASE, letter-spacing 2px
  Revenue → color #1D4ED8
  Expenditures → color #D97706
Rule: flex: 1, height: 1px, background: #E8E7E4
```

### Table (List View)
```
White card container: bg #FFFFFF, border 1px #E8E7E4, border-radius 12px

Header row: bg #F9FAFB, border-bottom 1px #E8E7E4
  th: 10px UPPERCASE, color #6B7280, letter-spacing 1px, padding 12px 16px

Body rows:
  odd: bg #FFFFFF
  even: bg #F9FAFB
  hover: bg #F3F2F0 (transition 120ms ease)
  selected (active county): bg rgba(29,78,216,0.06), font-weight 700, color #1D4ED8
  compare county: bg rgba(180,83,9,0.06), color #B45309
  border-bottom: 1px solid #F3F4F6
```

---

## Information hierarchy (Data View)

```
TIER 1 — IDENTITY
  County Name [DM Serif Display, 40px, #111827]
  Population · Peer group [DM Sans 13px, #6B7280]

TIER 2 — HEALTH SNAPSHOT (answers "is it healthy?")
  Net Balance card (fixed 220px) + Fund Balance gauge (flex)

TIER 3 — SUPPORTING METRICS
  Revenue | Expenditures | Tax Rate | Own-Source % (4 equal cards)

TIER 4 — DEPTH (analyst detail)
  ▼ Financial Summary [collapsible, RESETS TO CLOSED on every county change]
  Revenue section → charts → delta panel → peer rankings
  Expenditures section → charts → delta panel → peer rankings
```

---

## Accessibility requirements

- Tab bar: `role="tablist"` wrapper, `role="tab"` + `aria-selected` on each tab
- Info button: min 44×44px touch target on mobile
- Fund balance gauge: color is NOT the only indicator — include status label text
- Focus rings: `box-shadow: 0 0 0 3px rgba(29,78,216,0.1)` on all focusable elements
- Body text contrast: #111827 on #FFFFFF = ~16:1 ✓, #6B7280 on #FFFFFF = ~4.6:1 ✓ (barely passes), #9CA3AF = 2.9:1 — use for labels (10px+) only, not body text

---

## Micro-interactions

| Element | Trigger | Effect |
|---------|---------|--------|
| Cards | hover | shadow-md + translateY(-1px), 200ms ease |
| Buttons | hover | border+text → blue, 150ms ease |
| Buttons | active | scale(0.97) |
| Tabs | click | color + border-bottom transition, 150ms ease |
| Inputs | focus | border blue + 3px ring, 150ms ease |
| Table rows | hover | bg #F3F2F0, 120ms ease |
| Fund balance bar | county change | width transition, 450ms cubic-bezier |
| Dropdowns | open | fadeIn 150ms + shadow-lg |
| Content | page load | fadeInUp 300ms ease |

---

## Search input

Placeholder text: `"Search 100 counties…"` (was "Search counties…")
This hints at the full scope of available data on first visit.
