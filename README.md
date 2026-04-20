# NC County Financial Explorer

An interactive data visualization of North Carolina county finances, built from the **Annual Financial Information Reports (AFIR)** published by the NC Department of State Treasurer.

**Live site:** https://xgx755.github.io/nc-county-financials

---

## What it shows

- **Revenue composition** — property taxes, sales tax, intergovernmental transfers, fees, and more
- **Expenditure allocation** — education, public safety, human services, general government, debt service, etc.
- **Per capita comparisons** — each county benchmarked against its population-group peer average
- **Side-by-side county comparison** — pick any two counties and compare them directly
- **Sortable table** — all 100 NC counties ranked by any metric
- **Choropleth map** — geographic view of any financial metric across the state
- **Trends** — multi-year trajectory for revenue and expenditure categories
- **Fund balance health** — surplus/deficit gauge with LGC minimum threshold indicator

---

## Data

The primary data snapshot is **fiscal year ending June 30, 2025**. Counties that have not yet filed FY2025 AFIR data automatically fall back to FY2024, then the most recent older year available.

Source: [NC Department of State Treasurer — Annual Financial Information Report (AFIR)](https://www.nctreasurer.com/local-government/financial-data/annual-financial-information-report)

The runtime data file at `src/data/counties.json` is assembled from raw AFIR extracts using the scripts in `scripts/`. Raw AFIR spreadsheets live in `raw/` and are versioned alongside the code.

---

## Project structure

```
├── src/
│   ├── components/       # React UI components (charts, panels, map, table)
│   ├── data/             # Compiled county data (counties.json + per-year snapshots)
│   ├── utils/            # Formatting helpers, peer-group logic
│   ├── constants.js      # Category definitions, color tokens, peer-group thresholds
│   └── App.jsx           # Root component and routing
├── scripts/
│   ├── convert_afir.py          # Parses raw AFIR .xlsx → per-year county JSON
│   ├── merge_county_snapshots.py # Merges yearly snapshots into counties.json
│   ├── merge_history.py         # Builds multi-year trend data
│   └── merge_tax_rates.py       # Pulls property tax rate data into the dataset
├── raw/                  # Source AFIR .xlsx files (FY2016–FY2025)
├── public/               # Static assets (SVG map, icons)
└── dist/                 # Production build (deployed to gh-pages branch)
```

---

## Development

**Prerequisites:** Node.js 18+, Python 3.10+

```bash
# Install dependencies
npm install

# Start local dev server (hot reload)
npm run dev
```

The app will be available at `http://localhost:5173/nc-county-financials/`.

---

## Updating the data

When new AFIR data is published by the NC State Treasurer:

1. Download the new AFIR `.xlsx` file and place it in `raw/` (e.g. `afir-fy2026.xlsx`).
2. Parse it into a per-year county snapshot:
   ```bash
   python scripts/convert_afir.py raw/afir-fy2026.xlsx
   ```
3. Rebuild the merged runtime dataset:
   ```bash
   python scripts/merge_county_snapshots.py
   python scripts/merge_history.py
   ```
4. Verify the output in `src/data/counties.json`, then rebuild and deploy.

---

## Deploy to GitHub Pages

```bash
npm run deploy
```

This runs `npm run build` and pushes the `dist/` folder to the `gh-pages` branch via [`gh-pages`](https://github.com/tschaub/gh-pages).

---

## Tech stack

| Layer | Library |
|---|---|
| UI | React 19 |
| Build | Vite 8 |
| Charts | Recharts 3 |
| Map | Custom SVG choropleth |
| Deploy | GitHub Pages via `gh-pages` |

---

## Contributing

Bug reports and pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo and create your branch from `main`.
2. Make your changes and verify the app builds without errors (`npm run build`).
3. Open a pull request with a clear description of what changed and why.

---

## License

This project is released under the [MIT License](LICENSE).

The underlying AFIR data is a public record published by the NC Department of State Treasurer and is not subject to copyright.
