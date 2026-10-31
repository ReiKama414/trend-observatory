# Trend Observatory

**English** · [繁體中文](README.zh-TW.md)

> **Time-Series Research Observatory** — Local-first, zero-server-transmission platform for multi-series trend analysis, normalization, and quantitative comparison.

<p align="center">
  <a href="https://github.com/ReiKama414/trend-observatory">GitHub</a> ·
  <a href="https://reikama414.vercel.app/">Portfolio</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#usage-guide">Usage Guide</a> ·
  <a href="#testing--verification">Testing</a> ·
  <a href="#license">License</a>
</p>

---

## Why Trend Observatory

Time-series research in finance, e-commerce, and empirical sciences frequently contends with scale disparity, mismatched sampling intervals, missing observations, and seasonal fluctuations. Most existing web-based charting tools either mandate uploading proprietary data to remote cloud servers or provide basic line plots devoid of dynamic baseline normalization, multi-axis alignment, and event anchoring capabilities.

Trend Observatory is engineered around a local-first philosophy. All CSV parsing, data imputation, resampling, and mathematical transformations occur directly within browser memory. Data never leaves your machine, synthetic real-time tickers are prohibited in favor of authentic historical benchmarks, and researchers are equipped with an uncompromising, reproducible workbench.

---

## Key Highlights

- **Multi-CSV Custom Mapping** — Batch drag-and-drop ingestion with automated date and metric column heuristics, alongside primary/secondary dual Y-axis allocation.
- **Baseline 100 Normalization** — Rebase disparate assets to 100 points against a user-defined date to eliminate magnitude disparities and compare relative return strength.
- **Resampling & Imputation** — Support Raw, Daily, Weekly, Monthly, Quarterly, and Yearly granularities with LOCF, linear interpolation, and zero-fill strategies.
- **Growth Rates & Moving Averages** — Built-in MoM %, YoY %, and PoP % metrics, coupled with configurable SMA and EMA periods (5 to 200 cycles).
- **Dynamic Period CAGR** — Responsive brush selection dynamically recomputes period growth, Compound Annual Growth Rate (CAGR), and Pearson correlation matrices.
- **Tri-Fold Seasonality View** — Yearly Overlay (aligned on MM-DD), Day-of-Week distribution bar charts, and Monthly Heatmaps to isolate calendar effects.
- **Event Annotations & Jump Focus** — Milestone markers and interval bands with category filtering and click-to-zoom timeline focusing.
- **Comprehensive Artifact Export** — High-resolution PNGs (1x/2x/3x Retina), sanitized merged CSVs, and complete workspace JSON state archives.
- **IndexedDB Persistence** — Seamless offline persistence preserving datasets, events, and configuration parameters across page reloads.
- **Zero-Overlap Architecture** — Strict 5-tier Document Flow (Header, Description, Stats, Canvas, Footer) verified against 200% zoom collision tests.

---

## Tech Stack

| Domain | Technology | Purpose |
| --- | --- | --- |
| Core Framework | React 19 · TypeScript 6 | Component state orchestration and strict type safety |
| Build Tool | Vite 8 | Fast HMR and production chunk splitting |
| Visualization | Apache ECharts 6.1 | Canvas rendering, dual Y-axis scaling, and dataZoom |
| Styling | Tailwind CSS v4 | High-contrast Light/Dark theming and responsive grid |
| Persistence | IndexedDB (`idb`) | Client-side asynchronous structured storage |
| Data Processing | PapaParse | Client-side CSV stream parsing and dialect handling |
| Iconography | Lucide Icons | Clean, professional telemetry glyphs |
| Unit Tests | Vitest | 23 core tests for math and timeseries pipelines |
| E2E Tests | Playwright | 32 tests covering 9 viewports, dual themes, and zero overlap |

---

## Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 10+
- Modern Web browser with HTML5 Canvas support

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/ReiKama414/trend-observatory.git
cd trend-observatory

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Usage Guide

1. **Load Data**: Click a preset button in the top header (Semiconductors, E-commerce, or Clean Energy), or drag and drop local CSV files onto the left panel.
2. **Configure Columns & Axes**: Expand any dataset card to reassign Date/Metric columns or switch the axis to Secondary (Right).
3. **Select Transforms**: Use the toolbar to alter sampling granularity (e.g., Monthly), choose Baseline 100 normalization, and specify the reference date.
4. **Inspect Metrics**: Examine the summary cards for Period Growth % and CAGR; dragging the timeline zoom slider dynamically recalculates all metrics.
5. **Explore Seasonality**: Switch to the Seasonality tab to view Yearly Overlay, Day-of-Week distributions, and the Monthly Heatmap.
6. **Annotate Events**: Open the Annotations tab to add milestones or policy shocks; click any annotation to immediately focus the timeline.
7. **Export Results**: Click Export in the header to download high-resolution charts, aligned CSVs, or backup workspace JSON files.

---

## Project Structure

```text
trend-observatory/
├── e2e/                     # Playwright E2E, responsive, and zero-overlap test suites
│   ├── app.spec.ts          # Core interaction workflows
│   ├── rwd-theme.spec.ts    # 9-viewport dual-theme stability tests
│   └── zero-overlap.spec.ts # Bounding Box non-collision and 200% zoom tests
├── public/                  # Static assets and icons
├── src/
│   ├── __tests__/           # Vitest unit test suite
│   ├── components/          # Modular workbench interface components
│   │   ├── ControlToolbar.tsx       # Resampling, imputation, and MA controls
│   │   ├── DatasetManager.tsx       # Multi-CSV management and column mapping
│   │   ├── DataTableView.tsx        # Aligned synchronized table view
│   │   ├── EventAnnotationPanel.tsx # Annotation CRUD and timeline focusing
│   │   ├── ExportModal.tsx          # PNG, CSV, and JSON export dialog
│   │   ├── Header.tsx               # Navigation, presets, and theme toggle
│   │   ├── MainChart.tsx            # 5-tier document flow timeline chart
│   │   ├── MetricsSummaryCard.tsx   # Growth, stats, and Pearson matrix
│   │   └── SeasonalityView.tsx      # Yearly overlay, DOW, and heatmap
│   ├── context/             # Theme context (System / Light / Dark)
│   ├── types/               # TypeScript interface and type declarations
│   ├── utils/
│   │   ├── csvHelper.ts     # Parsing heuristics, cleaning, and export
│   │   ├── db.ts            # IndexedDB storage layer
│   │   ├── sampleData.ts    # Authentic benchmark historical datasets
│   │   └── timeSeries.ts    # Resampling, imputation, and math pipeline
│   ├── App.tsx              # Main application container and responsive drawer
│   └── main.tsx             # Application entry point
├── LICENSE                  # Copyright license terms
├── package.json             # Package configuration and dependencies
└── vite.config.ts           # Vite configuration and code splitting rules
```

---

## Testing & Verification

The test suite provides comprehensive coverage across unit algorithms, end-to-end user workflows, and responsive visual integrity:

```bash
# Run Vitest unit tests (23 tests)
npm test

# Run Playwright E2E tests (32 tests across 9 viewports & themes)
npm run test:e2e

# Launch Playwright Interactive UI Mode
npx playwright test --ui

# Run code style & lint inspection (Oxlint)
npm run lint

# Compile production bundle
npm run build
```

---

## Deployment

Trend Observatory compiles into a static single-page application under `dist/`, deployable directly to any static host.

### Cloudflare Pages Deployment

1. Push your repository to GitHub.
2. In Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages**.
3. Connect the repository with the following build configuration:
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**.

To deploy directly via the Wrangler CLI:

```bash
npm run build
npx wrangler pages deploy dist --project-name trend-observatory
```

---

## Known Limitations

- **High-Volume Thresholds** — In-browser Canvas rendering with single series exceeding 100,000 points may encounter memory pressure; downsampling to Daily or Weekly granularity is recommended for extreme volumes.
- **Date Format Support** — Built-in parsers support ISO 8601, standard slash notation (`YYYY/MM/DD`), compact integer formats (`YYYYMMDD`), and Unix Timestamps. Non-standard regional calendar formats must be pre-formatted.
- **Client-Side Boundary** — For data confidentiality, no background database synchronization is embedded; cross-device transfer relies on workspace JSON import/export.

---

## Links

| Item | Link |
| --- | --- |
| Source Repository | [GitHub](https://github.com/ReiKama414/trend-observatory) |
| Author Portfolio | [Portfolio](https://reikama414.vercel.app/) |
| License Full Text | [LICENSE](./LICENSE) |

---

## License

Copyright (c) 2026 ReiKama414. All rights reserved.

This project is provided solely for personal viewing and learning purposes.
No permission is granted to use, copy, modify, distribute, sublicense, or incorporate this software into other projects (including non-commercial purposes) without prior written consent from the author.

- [GitHub](https://github.com/ReiKama414/trend-observatory)
- [Portfolio](https://reikama414.vercel.app/)
- [Full License](./LICENSE)

---

<p align="center"><sub>ReiKama414 · Trend Observatory · 2026</sub></p>
