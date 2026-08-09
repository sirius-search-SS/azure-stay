# Azure Stay — hotel booking platform

A complete, working hotel booking product: a guest-facing site, a guest account area, and a staff console that runs the property. Twenty properties, 150 rooms, 800 reservations, all generated in the browser.

**Open `index.html`.** That is the whole setup — no build step, no dependencies, no CDN scripts, no server. It also runs from `file://`, so you can double-click it on any machine and demo it offline.

---

## Demo sign-ins

| Role | Email | Password |
| --- | --- | --- |
| Guest | `guest@azurestay.example` | `azure2026` |
| Front desk | `manager@azurestay.example` | `azure2026` |
| Administrator | `admin@azurestay.example` | `azure2026` |

Sign-in is simulated in the browser. The sign-in page has one-click buttons for all three.

---

## The signature idea: the rate rail

Every hotel card, room card, hotel page and staff room record carries a **rate rail** — fourteen (or thirty) columns, one per night. Column height encodes the nightly price, colour encodes where that night sits in the range, and hatched columns are already sold.

It answers the question a booking site usually hides until step four: *what does this actually cost on the nights I can travel, and is it even free?* The same component is reused in the staff console, where it doubles as a per-room availability strip.

---

## What is in it

### Guest site
- **Home** — hero, search panel with destination autosuggest, featured properties, destinations, suites, inclusions, live promotions, guest reviews, nearby attractions, rate-alert signup
- **Search** — destination/date/guest search, filters (max rate, guest rating, property type, room type, 16 amenities), six sort orders, load-more paging, list cards with rate rails
- **Hotel page** — generated gallery with lightbox, six tabs (overview, rooms, reviews, location, policies, FAQ), rating breakdown, 30-night rate rail, room list, map with neighbouring properties
- **Room page** — specs, amenities, 30-night rate rail, month-by-month availability calendar with per-night prices, live quote panel that blocks unavailable ranges
- **Booking flow** — six steps: search → room → guest details → review → payment → confirmation. Validated forms, promo codes, four payment methods, night-by-night breakdown, printable receipt
- **Auth** — sign in, register, forgot password
- **Content** — about, contact, FAQ, privacy, booking terms, and 403 / 404 / 500 pages

### Guest account
Overview with next-stay card and rate watch, bookings (upcoming / past / cancelled with cancel and review actions), saved hotels, reviews written, invoices, notifications, profile, settings (currency, language, dark mode, notification preferences, data reset).

### Staff console
- **Dashboard** — eight KPIs, revenue, occupancy, booking sources, room mix, cancellation rate, guest growth, today's arrivals and departures
- **Reservations** — filterable table (period, status, property), search, sorting, paging, detail modal, one-click check-in/check-out, new reservation with live availability and pricing
- **Rooms** — status board grouped by floor plus a table view, per-room modal with status, housekeeping, rate, maintenance note and upcoming arrivals
- **Guests** — ranked by lifetime value, profile modal with full booking history
- **Payments** — collected / outstanding / refunded, value by method, refunds, CSV export
- **Reviews** — approve, hide, delete, reply, queued by status
- **Promotions** — create and edit coupons, seasonal rates, flash sales; redemption caps
- **Staff and roles** — rota and a permissions matrix
- **Analytics** — revenue, occupancy, ADR, RevPAR, sources over time, source of guests, reservations per month
- **Reports** — six report types over a date range and property, previewed, printable, CSV-exportable
- **Settings** — property details, tax and fees, currencies and languages, email templates

---

## Project structure

```text
azure-stay/
├── index.html                 single page shell
├── assets/
│   ├── css/styles.css         design system + every component
│   └── js/
│       ├── data.js            seeded data layer, rates, availability, persistence
│       ├── store.js           session, theme, favourites, search + booking draft
│       ├── icons.js           inline icon set + procedural SVG scenery
│       ├── charts.js          area, bar, stacked, donut, ranking, sparkline
│       ├── ui.js              formatting, cards, rate rail, tables, modals, forms
│       ├── pages-customer.js  guest site
│       ├── pages-account.js   guest account
│       ├── pages-admin.js     staff console
│       ├── router.js          hash router
│       └── app.js             chrome, layouts, route table, boot
├── docs/
│   ├── design-system.md       tokens, components, rules
│   └── case-study.md          brief, decisions, trade-offs
├── tests/                     headless jsdom suites
├── package.json               test scripts only — the app ships zero runtime deps
└── .github/workflows/pages.yml
```

---

## Data

Everything comes from `assets/js/data.js`, built from a fixed seed (`mulberry32`) so every machine sees the same property group, then cached in `localStorage` under `azure-stay/v1/db`.

| Entity | Count |
| --- | --- |
| Destinations | 12 |
| Hotels | 20 |
| Rooms | 150 |
| Guests | 500 |
| Bookings | 800 |
| Reviews | 200 |
| Promotions | 50 |
| Payments | 100 |
| Staff | 10 |
| Notifications | 20 |

Dates are anchored to *today*, so there are always arrivals today, guests in house and history behind them. When the date changes the set is rebuilt so the demo never goes stale.

Nightly rates are a function, not a table: `base rate × season × weekday × seeded noise`, which keeps 150 rooms × 365 nights out of storage while staying identical on every render. Availability is indexed from the bookings themselves, so a stay you create in the console immediately turns that night hatched on the guest side.

Useful in the console:

```js
AZ.db                      // the whole data set
AZ.railFor(AZ.room(id))    // 14 nights of price + availability
AZ.quote(room, "2026-08-20", "2026-08-23", "STAY15")
AZ.reset()                 // wipe and regenerate
```

---

## Images

There are no image files. Every "photograph" is an SVG scene generated from the hotel's ID — coast, city, mountain, garden and interior variants, with dusk and daylight versions. It keeps the repository tiny, nothing 404s from a subfolder, and each property looks consistently like itself.

---

## Design system

| Token | Value |
| --- | --- |
| Primary | `#1E3A8A` |
| Secondary | `#2563EB` |
| Accent | `#F59E0B` |
| Background | `#F8FAFC` |
| Dark background | `#0F172A` |
| Text | `#111827` |
| Success | `#22C55E` |
| Danger | `#EF4444` |
| Headings | Poppins |
| Body | Inter |
| Numerals, dates, IDs | JetBrains Mono |

Full detail in `docs/design-system.md`. Dark mode is a token swap on `[data-theme="dark"]` and covers every screen.

---

## Accessibility and quality floor

- Semantic landmarks, a skip link, and focus moved to `#main` on every route change
- Visible focus rings, full keyboard operation, focus trapping and `Escape` in dialogs
- Labels bound to every input, inline error text tied to the field, first invalid field focused on submit
- `prefers-reduced-motion` respected; charts carry `<title>` tooltips and `aria-label`s
- Responsive from 320 px: mobile bottom navigation, drawer menus, collapsing sidebars, horizontally scrolling tables
- A print stylesheet — receipts, reservations and reports print cleanly

---

## Tests

Two headless suites (jsdom, no framework):

```bash
npm install          # jsdom, the only dev dependency — the app itself has none
npm test             # 57 route renders + 55 interaction checks
```

They cover the full booking flow end to end (room → guest details → review → payment → a real booking record), filtering and sorting, table search and paging, cancellation, review approval, promotion creation, room status changes, route guards and theme switching.

---

## Deployment

**GitHub Pages** — push and enable Pages on the branch root. `.github/workflows/pages.yml` publishes it as-is. Hash routing means no rewrite rules and no 404 on refresh, in a subfolder or at the root.

**Anything else** — it is static files. Netlify, Vercel, S3, or a USB stick all work.

---

## Porting to React + TypeScript + Vite

The brief specified React, TypeScript, Vite, Tailwind, React Router, React Hook Form, Zod, TanStack Query, Zustand, Shadcn UI, Lucide, Framer Motion, Recharts, React Day Picker, Sonner and Swiper. This build is deliberately dependency-free so it runs from a double-click, but it is organised to map onto that stack one file at a time:

| Here | There |
| --- | --- |
| `data.js` | `src/data/*` + `src/services/*`, or a real API behind TanStack Query |
| `store.js` | Zustand store (`src/store/`) — same shape, same keys |
| `router.js` + route table in `app.js` | React Router `createBrowserRouter` |
| `ui.js` cards, badges, tables, modals | `src/components/` on Shadcn primitives |
| `charts.js` | Recharts (`LineChart`, `BarChart`, `PieChart`) |
| `icons.js` icon map | `lucide-react` |
| `UI.calendar` | React Day Picker |
| `UI.validate` schemas | Zod schemas + React Hook Form resolvers |
| `UI.toast` | Sonner |
| `styles.css` tokens | `tailwind.config.js` theme extension |
| `UI.rail` | keep it — it is the piece worth porting by hand |

Suggested target tree, matching the brief:

```text
src/
├── components/{common,hotel,room,booking,dashboard,charts,forms,layout}
├── pages/{customer,admin}
├── hooks/ services/ store/ data/ types/ utils/ constants/ routes/ styles/
```

---

## Notes

Prices, guests, reviews and bookings are fabricated. Card fields are validated in the browser and never sent anywhere. Property names, cities and copy are written for the demo.

MIT licensed — see `LICENSE`.
