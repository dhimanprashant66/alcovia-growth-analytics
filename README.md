# Alcovia — Growth & Analytics Assessment

Interactive React/Vite dashboard starter for the Product, Systems & Analytics Lead assignment. **This repository contains synthetic demonstration data only**; it is not affiliated with or integrated into Alcovia's production systems.

## Stack
React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Recharts 3 · Lucide icons.

## Requirements
- Node.js **20.19+** or **22.12+** recommended for Vite 7.
- npm and an internet connection to install packages from the npm registry.

## Start locally (Windows PowerShell)
```powershell
cd path\to\alcovia-growth-analytics
npm install
npm run dev
```
Open the local address printed in the terminal (typically `http://localhost:5173`).

## Verify production build
```powershell
npm run typecheck
npm run build
npm run preview
```

## Deploy for free
1. Commit this project to a **new** GitHub repository (do not include credentials or `.env`).
2. Import that repository into Netlify.
3. Build command: `npm run build`; publish directory: `dist`.
4. Open the generated URL and test filtering, navigation, exports and mobile layout.
5. Confirm provider limits before making any reliability claims.

## Prototype structure
```
src/
  data/sampleData.ts     Deterministic fake leads, payments, ads and targets
  data/studentData.ts    Synthetic student activities and aggregation functions
  lib/metrics.ts         KPI functions; revenue, funnels, campaign recommendations
  types.ts               Shared TypeScript record shapes
  App.tsx                Date filters, navigation and dashboard UI
  styles.css             Tailwind entry and customized responsive styles
database/
  schema.sql             Proposed GTM and pseudonymous student PostgreSQL schema
  metric-queries.sql     Revenue, funnel, campaign and student KPI query examples
automations/
  README.md              Integration workflow design; no real export yet
docs/
  architecture.md        Scope, assumptions and source-of-truth proposal
  student-metrics.md     Student metric definitions, capture flow and rollout gates
  executive-submission.md Concise response draft covering all four problems
```

## What works in the demo
- Global report-period presets plus custom dates (synthetic sample available Sep 1–Oct 17, 2026).
- Revenue cards, daily chart, program/workshop breakdown, synthetic unpaid invoices and renewal examples.
- Conversion funnel based on lead acquisition cohort and progress through report cutoff.
- Campaign CTR, approximate frequency, costs and sample recommendations.
- CSV exports for revenue, campaign and student views.
- Student analytics by cohort and activity cadence, with completion, student pulse, learning progress, attention flags, and ID-only drill-down.
- Student activity trends by week and delivery volume / experience quality by activity type.
- Mobile-friendly layouts and visible synthetic-data labels.

## Known limitations / next steps
- Student records and student performance thresholds are synthetic demonstration assumptions; confirm metric definitions and safeguarding controls before using real data.
- Two inactive n8n starter workflow exports are included; no live ClickUp, Meta, Razorpay, database, or n8n integrations are configured.
- Campaign frequency derived from daily-reach sums is **approximate**, not actual period-unique reach.
- Landing page abandonment and load-time view awaits defined source data.
- Program fees, targets, thresholds, ad metrics, sample invoices and all identities are invented for demonstration. The ₹3,999 workshop seat amount is from the assessment brief.
- End-to-end browser QA and deployment should be done on an environment able to run `npm install`.
