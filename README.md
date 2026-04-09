# NC County Financial Explorer

An interactive data visualization of North Carolina county finances, built from the Annual Financial Information Reports (AFIR) published by the NC Department of State Treasurer.

**Live site:** https://xgx755.github.io/nc-county-financials

## What it shows

- Revenue composition by source (property taxes, sales tax, intergovernmental, etc.)
- Expenditure allocation by function (education, public safety, human services, etc.)
- Per capita comparisons against population-group averages
- Side-by-side comparison between any two counties
- Sortable table of all 75 counties that filed an AFIR

## Data

Fiscal year ending **June 30, 2025**. Source: [NC Department of State Treasurer — AFIR](https://www.nctreasurer.com/local-government/financial-data/annual-financial-information-report).

The raw Excel file was processed into `src/data/counties.json` using the `scripts/convert-data.js` script.

## Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

This builds the project and pushes the `dist/` folder to the `gh-pages` branch.

## Tech

React 19 · Vite 8 · Recharts 3
