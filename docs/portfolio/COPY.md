# Hiperlocal — portfolio sections (paste below the live demo)

Use **exactly these four sections**. Each image appears **once**. The live app above already shows interaction—do not add a flow walkthrough.

**Images in this folder**

## Suggested case-study structure

1. Hook + role  
2. Problem  
3. Approach (physical → digital)  
4. Product walkthrough (images)  
5. Design system / design engineering  
6. Architecture (today + planned hardware crosstalk)  
7. Outcomes / next  

---

## Intro line (optional, under the iframe)

I designed and built Hiperlocal so small-scale and hospitality growers can plan a farm, check whether the economics work, and later run grow operations in one product. The sections below explain the design work behind the demo.

---

## 1. Design the farm before you buy equipment

**Header:** See what fits in the room

A grower often knows their crops and room size, but not whether racks, trays, and lighting will actually fit—or how many plant sites they can run. In Ideation, users add growing systems, assign crops, and set room dimensions while a 3D preview updates. That way spatial decisions happen before they spend on hardware, and the layout becomes the basis for cost and yield assumptions later.

**Image:** `01-configurator.png`  
**Caption:** Users configure systems and preview the farm layout before they invest.

---

## 2. Check whether the numbers work

**Header:** Live financial clarity for real decisions

The same person then needs a clear answer: with this startup spend and monthly costs, when do I break even, and is this crop mix worth it? The financial model combines capital line items, operating costs, yield, and price per kilogram. Monthly profit, ROI, and payback update as they edit inputs, so the interface behaves like a calculator tied to their farm design—not a static slide. They can sign in to save a plan and reopen it when they move into Operations.

**Image:** `02-financial.png`  
**Caption:** Startup capital and live projections help users judge viability before they commit.

---

## 3. Design system and data UI from the shipped product

**Header:** One visual language for planning and operations

As users move from modeling to day-to-day growing, the app should still feel familiar—same controls, same way numbers are shown. I documented foundations and components from production: Roboto Mono, a near-black canvas, glass-style panels, green for focus and positive economics, and red for destructive actions. For financial and ops data, the product uses metric cards, cost tables, profit-and-loss style summaries, crop yield × price breakdowns, and grow-stage timelines—not a decorative chart kit—so people can trust what they see when making decisions.

**Image:** `03-design-foundations.png`  
**Caption:** Color, type, spacing, and radius tokens used in the live interface.

**Image:** `04-design-components.png`  
**Caption:** Shared controls plus patterns for metrics, cost tables, status, and grow stages.

---

## 4. Bridge to the physical computing work below

**Header:** Software and hardware are the same thread

Hiperlocal did not start as a web app. It grew out of building and sensing real plant systems—Arduino aeroponics, flood-and-drain vessels, pumps, mist, and plant interfaces. Today the product and those experiments run in parallel; the diagram shows how they are meant to connect next: sensors and actuators sending telemetry into Operations, and remote commands flowing back for automation. What follows on this page is that hands-on R&D.

**Image:** `05-architecture.png`  
**Caption:** Today the app and hardware experiments run separately; the dashed path is planned realtime crosstalk.

**Closing line:** Scroll down for aeroponics, flood-and-drain, and related physical computing experiments.

---

## Meta

**Role:** Product Designer + Fullstack Developer  
**Live:** https://hiperlocal-agtech.vercel.app/  
**Figma:** https://www.figma.com/design/hD3sFQ2Pc2YU9BhiZHh6Xh  
**GitHub:** https://github.com/treybradley/Hiperlocalagtechprod  
