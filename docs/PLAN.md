# Credit Lens — Rebuild plan for "Expediente" (JFredMC/credit-history)

Demo app (Spanish UI, English code) inspired by the Colombian consumer credit-bureau experience.
**Fictional data only. Not affiliated with DataCrédito, Experian, TransUnion/CIFIN or any bureau. No real bureau data, no scraping.**
Brand: JFredDev — discreet footer/“Hecho por JFredDev” link + portfolio link (new tab), same pattern as Cuadre/Ñapa/CENTINELA.

## 1. Review of current repo (credit-history / Expediente)

- 18 commits. Angular 22 (zoneless, standalone, signals) + Tailwind 4 + Vitest; NestJS 11 backend skeleton; GitHub Pages deploy workflow. npm (package-lock), not pnpm.
- Frontend (~1.1k LOC): dashboard (score 150–950, KPIs), history, timeline, creditors + detail, alerts, report export (JSON/CSV), dark mode, hand-made SVG charts (line/donut/bar).
- Good to keep: `CREDIT_API` injection token with Mock/Http implementations (clean demo-mode switch), domain model (CreditProduct, Creditor, CreditEvent, PaymentBehavior 24-month history, ScorePoint, Alert), chart components idea, Spanish labels map.
- Weak spots: single smoke test; no Playwright; no lint in CI; backend has entities/DTOs but no DB, auth or tests; several fix/revert commits (corrupted routes file, zone.js revert) → fragile history; no score explanation, simulators, planning tools, inquiry footprint, claims, legal info; export is JSON/CSV only; no PDF; mock data is one static profile.
- Verdict: don’t fork; start a clean repo, port the model + mock-API pattern + chart ideas.

## 2. Public context (what the real app offers / pain points)

- DataCrédito Experian consumer: score + historia de crédito, alertas (consultas/cambios), “Mi Plan”/plans de pago (paid tiers), simulador de score, huella de consulta (who consulted you), hábito de pago per obligation, reclamos online, ofertas de crédito.
- Common complaints: paywalls for basic info, confusing score with no actionable “why”, dated UI, slow/opaque reclamos, upselling, hard to see when a negative report expires.
- Legal context (verified 2026-10-14 against secretariasenado.gov.co, funcionpublica.gov.co, sic.gov.co; see in-app «Fuentes»):
  - Self-consultation is free **always and by any means** (art. 10 par. 2, mod. Ley 2157) — corrected: not "1 per month".
  - Permanence: double the arrears time, max 4 years from payment (art. 13); expiry 8 years from arrears start (art. 13 par. 1).
  - Prior notice: report only 20 calendar days after notice (art. 12); debts ≤ 15 % SMMLV need 2 notices on different days + 20 days (art. 13 par. 2; SMMLV 2026 = $1.750.905 → $262.635).
  - No prior notice: immediate removal if paid; otherwise remove and notify first (art. 12 par.).
  - Report max 18 months after arrears start (art. 8 num. 11).
  - Claims: 15 business days (+8), «reclamo en trámite» within 2 business days, silence = resolved in favour (art. 16 II); queries 10 (+5) business days (art. 16 I). Escalate to SIC (or SFC for supervised entities) proving the prior claim.

## 3. Proposed repo name (all verified free under JFredMC)

1. **credit-lens** (recommended) — product name “Credit Lens”/UI tagline “Tu crédito, claro”.
2. score-lens
3. credlens
   (Also free: credito-claro, but not English.)

## 4. Architecture

- Monorepo, **pnpm workspaces**: `apps/web` (Angular 22, zoneless, signals, Tailwind 4), `apps/api` (NestJS 11, later), `packages/core` (pure TS domain + calculators: score model, simulators, payoff, permanence calculator — shared and unit-tested with Vitest).
- Demo mode default: `CreditApi` token → `DemoCreditApi` (seeded fictional profiles, persisted in localStorage, “Reiniciar demo”). `HttpCreditApi` later.
- Charts: lightweight custom SVG (keep) or ngx-echarts only if needed.
- Exports: PDF (pdfmake or jsPDF), Excel (SheetJS/exceljs), Word (docx) — same approach as Cuadre.
- Quality: Vitest (core ≥90% on calculators), Playwright e2e + screenshot smoke on Pages build, ESLint/Prettier, CI on every PR, Pages deploy on main. Hash/404 routing for Pages.
- Later: API on Render + Supabase/Neon (Postgres, Prisma/TypeORM), auth, per-user data entry.

## 5. Modules & screens (Spanish UI)

1. **Inicio / Resumen** — score gauge, change vs last month, 4 KPIs, next payments, top 3 actions.
2. **Mi puntaje (explicador)** — transparent fictional model with weighted factors (hábito de pago, utilización, antigüedad, consultas recientes, mezcla, moras activas); each factor: impact, status, “cómo mejorar”.
3. **Simulador “¿Qué pasa si…?”** — pay X on a card, close a product, open a loan, 3 new inquiries, clear a mora → projected score range.
4. **Mis obligaciones** — products with 24-month hábito de pago grid, utilization, status; detail per entidad.
5. **Calendario de pagos** — monthly calendar, reminders (.ics export).
6. **Plan para salir de deudas** — snowball vs avalanche vs custom, extra payment slider, payoff date, interest saved, chart.
7. **Utilización** — per-card and total, 30% target line, trend.
8. **Alertas** — new report, mora, consulta, cambio de datos; read/unread, filters.
9. **Huella de consulta** — who consulted, when, purpose; impact explanation.
10. **Reportes negativos y permanencia** — calculator per Ley 2157: date of payment + months in mora → fecha estimada de salida.
11. **Reclamos / Derecho de petición** — wizard → generated letter (rectificación, actualización, eliminación por permanencia, falta de aviso previo) to fuente/operador; export PDF/Word; claim tracker with 15-business-day countdown.
12. **Reporte** — full report export PDF/Excel/Word + shareable image card.
13. **Metas** — e.g. “llegar a 750”, “utilización <30%”, progress.
14. **Aprende** — short guides (cómo se calcula, tus derechos, mitos).
15. **Ajustes** — tema, perfil demo selector (3 personas: “Buen pagador”, “En recuperación”, “Sobreendeudado”), disclaimer.

## 6. Phases (one PR per area, squash-merge, CI green, screenshots)

- P0 Scaffold: pnpm monorepo, Angular app, core package, CI, Pages deploy, brand + disclaimer banner, README.
- P1 Domain + demo data: models, 3 seeded personas, DemoCreditApi.
- P2 Resumen + Mi puntaje + Obligaciones (MVP core screens).
- P3 Simulador + Plan de deudas + Utilización.
- P4 Calendario + Alertas + Huella de consulta.
- P5 Permanencia + Reclamos (letter generator) + exports PDF/Excel/Word.
- P6 Metas + Aprende + polish (a11y, responsive, Playwright screenshots, Lighthouse).
- P7 (optional) NestJS API + Postgres on Render/Supabase, auth, manual data entry.

## 7. MVP for GitHub Pages demo

P0–P3 + permanence calculator + claim letter (PDF) — i.e. Resumen, Mi puntaje, Obligaciones, Simulador, Plan de deudas, Reclamos; 3 fictional personas; persistent “Demo — datos ficticios, sin afiliación con DataCrédito/Experian” badge.
