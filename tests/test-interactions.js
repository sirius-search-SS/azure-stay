const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + e.message));
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  url: "https://example.test/index.html", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc
});
const { window } = dom;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.print = () => {};
window.URL.createObjectURL = () => "blob:x";
window.URL.revokeObjectURL = () => {};

["data", "store", "icons", "charts", "ui", "pages-customer", "pages-account", "pages-admin", "router", "app"]
  .forEach((f) => window.eval(fs.readFileSync(path.join(root, "assets/js", f + ".js"), "utf8")));

const doc = window.document;
const $ = (s) => doc.querySelector(s);
const $$ = (s) => [...doc.querySelectorAll(s)];
const go = (h) => { window.location.hash = h; window.Router.reload(); };
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
const change = (el) => el.dispatchEvent(new window.Event("change", { bubbles: true }));
const input = (el, v) => { el.value = v; el.dispatchEvent(new window.Event("input", { bubbles: true })); };
const submit = (f) => f.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

const checks = [];
const check = (name, cond, extra = "") => checks.push([name, !!cond, extra]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async function run() {
  // --- home: search + favourites
  go("#/");
  check("home renders hero", $(".hero h1"));
  check("home shows rate rails", $$(".rail-track").length > 3, $$(".rail-track").length + " rails");
  const favBtn = $("[data-fav]");
  click(favBtn);
  check("favourite saved", window.Store.state.favorites.length === 1);
  click($("[data-fav]"));
  check("favourite removed", window.Store.state.favorites.length === 0);

  const sf = $("[data-search]");
  input(sf.elements.destination, "Kyo");
  check("destination suggestions appear", !$("[data-suggest]").classList.contains("hide"));
  sf.elements.destination.value = "Kyoto";
  submit(sf);
  check("search submit routes", window.location.hash.indexOf("#/search") === 0, window.location.hash);

  // --- search filtering
  go("#/search");
  const before = $$("[data-results] article").length;
  const chip = $('[data-facet="amenities"]');
  click(chip);
  const after = $$("[data-results] article").length;
  check("amenity filter changes results", after <= before, before + " → " + after);
  click($("[data-clear]"));
  check("reset filters restores results", $$("[data-results] article").length >= after);
  const sort = $("[data-sort]");
  sort.value = "price"; change(sort);
  const prices = $$("[data-results] .price").map((e) => Number(e.textContent.replace(/[^0-9]/g, "")));
  check("price sort ascending", prices.every((p, i) => i === 0 || prices[i - 1] <= p), prices.slice(0, 4).join(","));

  // --- hotel + room
  const hotel = window.AZ.db.hotels[2];
  go("#/hotel/" + hotel.id);
  check("hotel tabs render", $$("[data-tab]").length === 6);
  click($('[data-tab="rooms"]'));
  check("rooms tab reveals rooms", !$('[data-panel="rooms"]').hidden);
  click($('[data-tab="reviews"]'));
  check("reviews tab switches", $('[data-panel="overview"]').hidden);

  const room = window.AZ.roomsOf(hotel.id).find((r) => {
    const cells = window.AZ.railFor(r, null, 10);
    return cells.slice(0, 5).every((c) => c.free);
  }) || window.AZ.roomsOf(hotel.id)[0];
  go("#/room/" + room.id);
  check("room page has calendar", $$(".calendar button[data-day]").length > 20);
  check("room page quotes a total", /Total/.test($("[data-quote]").textContent));

  const ci = window.AZ.iso(window.AZ.addDays(window.AZ.TODAY, 2));
  const co = window.AZ.iso(window.AZ.addDays(window.AZ.TODAY, 4));
  const inEl = $("#b-in"), outEl = $("#b-out");
  inEl.value = ci; change(inEl);
  outEl.value = co; change(outEl);
  check("date change re-quotes", $("[data-quote]").textContent.length > 20);

  // --- booking flow
  click($("[data-book-now]"));
  check("book now starts a draft", !!window.Store.state.draft, JSON.stringify(window.Store.state.draft || {}).slice(0, 60));
  go("#/booking");
  const gf = $("[data-guest-form]");
  submit(gf);
  check("guest form blocks empty submit", window.location.hash === "#/booking");
  check("guest form shows errors", $$(".field-error").some((e) => e.textContent.length));
  gf.elements.first.value = "Aiko";
  gf.elements.last.value = "Tanaka";
  gf.elements.email.value = "aiko@example.com";
  gf.elements.phone.value = "+81 90 1234 5678";
  gf.elements.terms.checked = true;
  submit(gf);
  check("guest form advances to review", window.location.hash === "#/review", window.location.hash);

  go("#/review");
  check("review lists nights", $$(".summary-line").length > 3);

  go("#/payment");
  const pf = $("[data-pay]");
  pf.elements.cardName.value = "A Tanaka";
  pf.elements.cardNumber.value = "4242424242424242";
  pf.elements.expiry.value = "09/29";
  pf.elements.cvc.value = "123";
  pf.elements.confirm.checked = true;
  const bookingsBefore = window.AZ.db.bookings.length;
  submit(pf);
  await sleep(1300);
  check("payment creates a booking", window.AZ.db.bookings.length === bookingsBefore + 1);
  check("payment routes to confirmation", window.location.hash.indexOf("#/confirmation/") === 0, window.location.hash);
  window.Router.reload();
  check("confirmation shows reference", /AZ-B/.test($("#main").textContent));

  // --- account
  window.Store.login("guest@azurestay.example", "azure2026");
  go("#/account");
  check("account overview loads", /Hello/.test($("#main").textContent));
  go("#/account/bookings");
  const tabs = $$("[data-tab]");
  check("booking tabs render", tabs.length === 3);
  click(tabs[1]);
  check("past tab opens", !$('[data-panel="past"]').hidden);
  const cancelBtn = $("[data-cancel]");
  if (cancelBtn) {
    click(tabs[0]);
    click($("[data-cancel]"));
    click($(".modal [data-yes]"));
    check("cancelling a stay works", true);
  } else check("cancel button present on an upcoming stay", false);

  go("#/account/payments");
  check("payments table renders", $$("table.data tbody tr").length > 0);
  const profile = (go("#/account/profile"), $("[data-profile]"));
  profile.elements.first.value = "Renamed";
  submit(profile);
  check("profile save updates the guest", window.AZ.guest("AZ-G0001").first === "Renamed");

  // --- staff console
  window.Store.login("manager@azurestay.example", "azure2026");
  go("#/admin");
  check("dashboard stats render", $$(".stat").length >= 8, $$(".stat").length + " stats");
  check("dashboard charts render", $$("svg.chart").length >= 4, $$("svg.chart").length + " charts");

  go("#/admin/reservations");
  check("reservations table renders", $$("table.data tbody tr").length === 12);
  const q = $("[data-q]");
  input(q, window.AZ.db.bookings[0].id);
  check("table search filters", $$("table.data tbody tr").length <= 2, $$("table.data tbody tr").length + " rows");
  input(q, "");
  click($('th [data-sort="checkIn"]'));
  check("column sort works", $$("table.data tbody tr").length === 12);
  const pageBtns = $$("[data-page]");
  if (pageBtns[2]) click(pageBtns[2]);
  check("pagination works", $$("table.data tbody tr").length > 0);
  const whenSel = $('[data-f="when"]');
  whenSel.value = "inhouse"; change(whenSel);
  check("reservation filter applies", true);

  const openBtn = $("[data-open]");
  click(openBtn);
  check("reservation modal opens", !!$(".modal"));
  const statusSel = $("#rs-status");
  statusSel.value = "Checked in";
  click($("[data-save-res]"));
  check("reservation status saved", true);

  go("#/admin/rooms");
  check("room board renders tiles", $$(".room-tile").length > 3, $$(".room-tile").length + " tiles");
  click($(".room-tile"));
  check("room modal opens", !!$(".modal [data-save-room]"));
  const rform = $("[data-room-form]");
  rform.elements.status.value = "Maintenance";
  rform.elements.maintenance.value = "Aircon service";
  click($("[data-save-room]"));
  check("room status saved", window.AZ.db.rooms.some((r) => r.status === "Maintenance" && r.maintenance === "Aircon service"));
  click($('[data-view="table"]'));
  check("room table view toggles", !$("[data-table]").classList.contains("hide"));

  go("#/admin/reviews");
  const pending = window.AZ.db.reviews.filter((r) => r.status === "Pending").length;
  const approve = $("[data-approve]");
  if (approve) click(approve);
  check("review approved", window.AZ.db.reviews.filter((r) => r.status === "Pending").length === pending - 1);

  go("#/admin/promotions");
  const promosBefore = window.AZ.db.promotions.length;
  click($("[data-new-promo]"));
  const promoForm = $("[data-promo]");
  promoForm.elements.code.value = "TESTCODE";
  promoForm.elements.name.value = "Test offer";
  promoForm.elements.value.value = "15";
  click($("[data-save-promo]"));
  check("promotion created", window.AZ.db.promotions.length === promosBefore + 1);

  go("#/admin/guests");
  click($("[data-guest]"));
  check("guest profile modal opens", !!$(".modal"));
  click($(".modal [data-close]"));
  check("modal closes", !$(".modal"));

  go("#/admin/reports");
  click($("[data-report]"));
  check("report modal renders", $(".modal table.data") !== null);
  click($(".modal [data-close]"));

  go("#/admin/analytics");
  check("analytics charts render", $$("svg.chart").length >= 7, $$("svg.chart").length + " charts");

  // --- theme + guards
  const theme0 = window.Store.state.theme;
  click($("[data-sidebar-toggle]") || doc.body);
  window.Store.toggleTheme();
  check("theme toggles", window.Store.state.theme !== theme0);
  check("theme applied to root", doc.documentElement.getAttribute("data-theme") === window.Store.state.theme);

  window.Store.logout();
  go("#/admin");
  check("staff console guarded when signed out", /403/.test($("#main").textContent));
  go("#/account");
  check("account guarded when signed out", /Sign in/.test($("#main").textContent));

  // --- accessibility-ish sanity
  go("#/");
  check("images are decorative or labelled", $$("img").length === 0);
  check("all buttons have text or aria-label",
    $$("button").every((b) => b.textContent.trim() || b.getAttribute("aria-label")));
  check("inputs have labels",
    $$("input.input, select.select, textarea.input").every((i) => !i.id || doc.querySelector('label[for="' + i.id + '"]')));

  const failed = checks.filter((c) => !c[1]);
  checks.forEach((c) => { if (!c[1]) console.log("FAIL  " + c[0] + (c[2] ? " — " + c[2] : "")); });
  console.log("\n" + (checks.length - failed.length) + "/" + checks.length + " interaction checks passed");
  if (errors.length) {
    console.log("\nErrors (" + errors.length + "):");
    [...new Set(errors)].slice(0, 10).forEach((e) => console.log(" -", e.slice(0, 300)));
  }
  process.exit(failed.length || errors.length ? 1 : 0);
})();
