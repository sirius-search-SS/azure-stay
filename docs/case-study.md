# Azure Stay — case study

**Role:** design and build · **Type:** portfolio project · **Surface:** guest site, guest account, staff console

---

## The brief

Build a hotel booking platform that lets travellers discover properties, compare rooms, reserve and manage bookings, while hotel staff run the operation from one console. Four user types: guests, receptionists, managers, administrators.

It is a deliberately large brief, because the point is to show search, filtering, multi-step forms, booking logic, dashboards, tables, charts, state and a design system holding together at once.

---

## The problem worth solving

Every booking site has the same failure: the price you are shown is a lie of omission. "From $120" means one room, on one night, probably a Tuesday in November. You pick dates, then discover the real number three screens later — or that the room is not free at all.

Hotel staff have the mirror-image problem. The rate is set in one system, availability lives in another, and the answer to "what is room 304 doing next week" takes three clicks and a squint.

**Design goal:** publish the nightly truth up front, to both audiences, in the same component.

---

## The answer: the rate rail

Fourteen columns, one per night. Height is price, colour is where that night falls in the range, hatching is sold out.

It appears on every hotel card, every room card, the hotel page (30 nights), the room page (30 nights, with your selected stay outlined in amber), the guest's rate watch, and the staff room panel.

Why it earns its place:

- **It is scannable before it is readable.** You see the cheap nights as a shape, then read the numbers.
- **It is honest.** Availability is computed from the actual booking records, so a reservation taken at the front desk immediately turns that column hatched on the public site.
- **It works for both audiences.** The guest reads it as "when should I go". The receptionist reads it as "what is this room doing this fortnight". Same component, no fork.

The alternative — a price calendar — was built and cut. A month grid is heavier, only shows one month, and buries the comparison the guest actually makes. The calendar survives, but only on the room page where picking exact dates is the job.

---

## Structure

**Guest site → account → console** is one application with three shells and one design system. A staff member and a guest see the same rate rail, the same pill colours, the same table.

Six-step booking flow — search, room, guest details, review, payment, confirmation — with the step rail visible throughout. Review exists as its own step because the most common booking error is dates, and dates deserve one screen where changing them costs one click.

The console is organised by what a shift actually does, not by data model: **Operations** (dashboard, reservations, rooms, guests), **Revenue** (payments, promotions, analytics, reports), **Property** (reviews, staff, roles, settings).

---

## Decisions and trade-offs

**Vanilla HTML, CSS and JavaScript rather than the specified React/Vite stack.**
The deliverable had to open from a double-click and run offline, with no install and no build. That is worth more in a portfolio than a framework badge. The code is organised so each file maps to a React equivalent — the port table is in the README — and the interesting part (the rail, the rate function, the availability index) ports unchanged.

**Rates as a function, not a table.**
150 rooms × 365 nights is 54,750 rows nobody wants in `localStorage`. `base × season × weekday × seeded noise` gives stable, plausible prices for any date, forever, with no storage. Availability is a separate index derived from bookings, so the two can disagree only in one direction: a night can be sold, never mispriced.

**Data anchored to today.**
The set regenerates when the date changes, so the demo always has arrivals today, guests in house and a year of history. A portfolio project that shows "0 arrivals" because it was seeded in April is a dead demo.

**No image files.**
Photography is the one thing a fictional hotel group cannot have. Rather than stock images that all look like the same three hotels, every property gets a procedurally generated SVG scene from its own ID — coast, city, mountain, garden, interior, in daylight or dusk. Consistent, weightless, and each hotel reliably looks like itself.

**Mono type for numbers.**
Prices, dates and references are the content both audiences compare. Setting them in JetBrains Mono, tabular-lined, made tables scannable and gave the product an operations-tool character that a purely soft hospitality palette would have lost.

---

## Two bugs worth recording

**Delegated listeners stacking.** Pages attached delegated handlers to the persistent app root, so every navigation added another copy — by the third visit a "save" click fired three times. Fixed by rendering each page into a fresh node that is thrown away on navigation; the same fix was needed inside the data table, which re-renders on every sort, search and page change. Caught by the interaction suite: a favourite toggled twice reads as "nothing happened".

**Check-out before check-in.** Rather than blocking submission, the search form moves check-out and says so in a toast. Correcting the user is faster than refusing them.

---

## What it demonstrates

Search and faceted filtering · multi-step forms with validation · booking and availability logic · reusable component architecture · a full design system with dark mode · data tables with sort, search and paging · nine chart types hand-built in SVG · role-based routing and guards · responsive layout to 320px · accessibility to a real floor (focus management, dialog trapping, labelled fields, reduced motion) · a printable receipt and report path · headless tests covering 57 routes and 55 interactions.

---

## If it continued

Real persistence and auth behind an API. Multi-room bookings in one reservation. Channel-manager sync so partner-site inventory is honest. A housekeeping mobile view — the room board is already the right shape for it. Price recommendations from the occupancy curve, surfaced as a fourth band on the rail.
