# Azure Stay — design system

Everything here lives in `assets/css/styles.css`, in the order the sections are numbered in that file.

---

## 1. Colour

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--navy` | `#1E3A8A` | same | Primary actions, sidebar, headline prices, peak nights on the rail |
| `--blue` | `#2563EB` | same | Links, secondary actions, mid-band rail nights, primary chart series |
| `--amber` | `#F59E0B` | same | Accent only: the search button, active tab underline, focus ring, one chart series |
| `--success` | `#22C55E` | same | Available rooms, paid invoices, cheapest nights |
| `--danger` | `#EF4444` | same | Cancellations, failures, maintenance, destructive actions |
| `--bg` | `#F8FAFC` | `#0F172A` | Page background |
| `--surface` | `#FFFFFF` | `#16213C` | Cards, inputs, tables |
| `--surface-2` | `#F1F5F9` | `#1E2A49` | Table headers, muted panels, ghost hover |
| `--border` | `#E2E8F0` | `#2A3A5F` | Hairlines |
| `--text` | `#111827` | `#E8EEFC` | Body copy |
| `--muted` | `#64748B` | `#9AABCE` | Secondary copy, labels |

Amber is rationed on purpose. It marks the single most important action on a screen and nothing else, which is why the search button and the "Pay" step read as the same gesture.

Dark mode is a token swap on `[data-theme="dark"]` — no component knows about it.

---

## 2. Type

| Role | Face | Notes |
| --- | --- | --- |
| Display | **Poppins** 500/600/700 | Headings only, `-0.02em` tracking, line-height 1.18 |
| Body | **Inter** 400/500/600/700 | 15.5px base, line-height 1.6 |
| Data | **JetBrains Mono** 500/600 | Prices, dates, references, room numbers, table figures |

The mono face is the tell that this is an operations product as much as a shop window: any number a guest or a receptionist has to compare or read aloud is set in it, tabular-lined so columns align.

Scale: `h1` clamps 30→46px, `h2` 23→31px, `h3` 20px, `h4` 17px, small 13px, tiny 11.5px uppercase with `.06em` tracking for eyebrows and labels.

---

## 3. Space, radius, shadow

8px grid: `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48 · `--sp-8` 64.

Radius: 8 (small controls) · 12 (inputs, tiles) · 16 (cards) · 22 (search panel) · full (buttons, pills, chips).

Three shadows only: `--shadow-sm` at rest, `--shadow-md` on hover, `--shadow-lg` for lifted surfaces (search panel, modals, toasts).

Container is `min(100% - 32px, 1240px)`.

---

## 4. The rate rail

The signature component. `UI.rail(cells, opts)` where each cell is `{ date, price, free, left, dow }`.

- Column **height** is the price, normalised across the visible window with a 34% floor so cheap nights stay legible
- Column **colour**: green in the bottom quartile, blue in the middle, navy in the top quartile, hatched grey when sold
- `title` on each column gives day, date, price and rooms left; the track carries an `aria-label` summarising the window
- `legend: true` adds the key, `scale: false` drops the date ends, `selected: [dates]` outlines the current stay in amber

It appears on hotel cards (14 nights), room cards (14), hotel pages (30), room pages (30, with the selected stay outlined), the account rate watch, and the staff room modal.

---

## 5. Components

**Buttons** — `.btn` plus `btn-primary` (navy), `btn-accent` (amber), `btn-blue`, `btn-outline`, `btn-ghost`, `btn-danger`; sizes `btn-sm` / `btn-lg` / `btn-block`. All pill-shaped, all lift 1px on hover.

**Cards** — `.card` + `.card-pad`; add `.card-hover` for anything clickable. `.hotel-card` and `.list-card` are the two booking-specific layouts.

**Status** — `.pill.s-<slug>` derives its colour from the status word, so `Available`, `Confirmed`, `Paid` and `Approved` all read green without per-page rules. `.badge` variants cover neutral labelling; `.score` is the navy rating tab.

**Tables** — `.table-wrap` scrolls horizontally, `table.data` has sticky headers, sortable header buttons, hover rows, and a footer with counts and a pager. Driven by `UI.table(container, cfg)`.

**Forms** — `.field` wraps label, control, hint and error slot. Errors are text under the field, the control gets `.invalid`, and the first bad field takes focus on submit. `UI.validate(form, schema)` uses a pipe syntax: `"required|email"`, `"optional|phone"`, `"checked"`.

**Feedback** — `UI.modal` (focus trapped, `Escape`, restores focus), `UI.confirm`, `UI.toast` (four tones, auto-dismiss), `.skel` shimmer, `.empty` state, and the `.errorpage` treatment for 403/404/500.

**Room board** — `.room-tile` uses a 4px left border for status, so a floor scans as a colour strip before you read a single number.

---

## 6. Layout

Three shells:

1. **Site** — sticky translucent top bar, content, footer, mobile bottom navigation
2. **Account / Console** — 244px navy sidebar plus workspace; the sidebar becomes an overlay drawer under 900px
3. **Bare** — auth and error pages, centred at 520px

Breakpoints: 520 · 660 · 720 (bottom nav) · 780 · 900 (sidebar) · 940 (split columns) · 1000 · 1240 (container ceiling).

`.split` is the workhorse: 1.65fr / 1fr on desktop, stacked below 940px. `.grid-2/3/4` collapse at 1000 and 660.

---

## 7. Motion

Deliberately small: 120–220ms ease on hover lifts, a 200ms pop on dialogs, a 200ms slide on toasts, a 1.3s shimmer on skeletons. Everything is disabled under `prefers-reduced-motion: reduce`.

---

## 8. Writing

Sentence case everywhere. Buttons name the outcome — "Book now", "Approve", "Issue refund" — and the confirmation echoes the same verb. Errors say what is wrong and what to do: *"Check-out has to be after check-in, so we pushed it two nights."* Empty states are invitations, not apologies. No exclamation marks, no "oops".
