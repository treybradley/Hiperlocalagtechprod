# Hiperlocal

Hiperlocal is a web app for designing, modeling, and running small-scale hydroponic farms — built for hospitality venues, home growers, and commercial operators. It started around on-site growing in La Veleta, Tulum, and aims to make farm design and day-to-day operations easier with live financial projections and operational tracking.

The app is available in **Spanish** and **English**.

## Features

### Ideation (planning)
- **Configurator** — Design a farm layout (system types, environment, lighting, automation, crop mix).
- **Financial calculator** — Enter startup and operating costs plus crop yield/price assumptions; see monthly profit, ROI, and payback update live.
- **Saved financial plans** — Sign in to save plans and reopen them later from Operations.

### Operations
- **Systems** — Create and manage hydroponic systems (capacity, location, equipment, recurring costs, optional hypothesis).
- **Grow cycles** — Start cycles, advance growth stages, log daily observations (metrics, tasks, issues, photos).
- **Harvest & results** — Record harvests and review ROI, payback, and performance across cycles.
- **Financial plans** — Browse, duplicate, and edit saved planner projections alongside live systems.

### Learn & About
- **Learn** — Crop database, hydroponic system types, and growing fundamentals.
- **About** — Product story, pillars, and roadmap.

### Account & language
- **Magic-link auth** (email) via Supabase — required for Operations and saving plans.
- **Language toggle** — Spanish / English across the app.

## Tech stack

| Area | Stack |
|------|--------|
| UI | React, Vite, TypeScript, Tailwind CSS |
| Components | Radix UI, Lucide icons, Motion |
| Auth & backend | Supabase (Auth, database, edge functions) |
| Local / legacy | IndexedDB (`idb`) for older offline reads |
| State | React context (farm config, auth, language) |

## How to use

1. Open the app and use the top nav to switch modes:
   - **Ideation** — slide through concept → farm configurator → financial model.
   - **Operations** — sign in if prompted; manage systems, cycles, and saved plans.
   - **Learn** / **About** — reference content and product background.
2. In **Ideation**, configure systems and crops, then tune costs and pricing in the calculator. Sign in to **Save this plan**.
3. In **Operations**, create a system, start a grow cycle, add daily logs, and record harvest when ready. Open a financial plan to adjust projections.
4. Use the **language toggle** in the header (or mobile menu) to switch between Spanish and English.