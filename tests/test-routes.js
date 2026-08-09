const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const routes = [
  "#/", "#/search", "#/search?destination=Lisbon", "#/about", "#/contact", "#/faq",
  "#/privacy", "#/terms", "#/login", "#/register", "#/forgot", "#/403", "#/404", "#/500",
  "#/account", "#/account/bookings", "#/account/favorites", "#/account/reviews",
  "#/account/payments", "#/account/notifications", "#/account/profile", "#/account/settings",
  "#/admin", "#/admin/reservations", "#/admin/rooms", "#/admin/guests", "#/admin/payments",
  "#/admin/reviews", "#/admin/promotions", "#/admin/staff", "#/admin/roles",
  "#/admin/analytics", "#/admin/reports", "#/admin/settings", "#/booking", "#/nope"
];

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push("jsdomError: " + e.message));
vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/index.html",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
  resources: undefined
});

const { window } = dom;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.print = () => {};
// load scripts manually (jsdom won't fetch local files without a server)
["data", "store", "icons", "charts", "ui", "pages-customer", "pages-account", "pages-admin", "router", "app"]
  .forEach((f) => {
    const code = fs.readFileSync(path.join(root, "assets/js", f + ".js"), "utf8");
    try { window.eval(code); } catch (e) { errors.push("load " + f + ".js: " + e.message); }
  });

function render(hash) {
  window.location.hash = hash;
  window.Router.reload();
}

let pass = 0;
const results = [];
for (const r of routes) {
  const before = errors.length;
  try {
    render(r);
    const main = window.document.getElementById("main");
    const len = main ? main.innerHTML.length : 0;
    const title = window.document.title;
    if (!main) results.push([r, "FAIL", "no #main"]);
    else if (len < 200) results.push([r, "FAIL", "thin render " + len]);
    else if (errors.length > before) results.push([r, "FAIL", errors[before]]);
    else { pass++; results.push([r, "ok", len + " chars · " + title]); }
  } catch (e) {
    results.push([r, "FAIL", e.message]);
  }
}

// signed-in passes
window.Store.login("guest@azurestay.example", "azure2026");
["#/account", "#/account/bookings", "#/account/payments", "#/account/profile", "#/account/reviews", "#/account/settings"].forEach((r) => {
  const before = errors.length;
  render(r);
  const len = window.document.getElementById("main").innerHTML.length;
  results.push([r + " (guest)", errors.length > before ? "FAIL" : len > 400 ? "ok" : "FAIL", errors[before] || len + " chars"]);
});
window.Store.login("admin@azurestay.example", "azure2026");
["#/admin", "#/admin/reservations", "#/admin/rooms", "#/admin/guests", "#/admin/payments", "#/admin/reviews",
 "#/admin/promotions", "#/admin/staff", "#/admin/roles", "#/admin/analytics", "#/admin/reports", "#/admin/settings"]
  .forEach((r) => {
    const before = errors.length;
    render(r);
    const len = window.document.getElementById("main").innerHTML.length;
    results.push([r + " (admin)", errors.length > before ? "FAIL" : len > 400 ? "ok" : "FAIL", errors[before] || len + " chars"]);
  });

// deep links
const hid = window.AZ.db.hotels[3].id;
const rid = window.AZ.roomsOf(hid)[0].id;
const bid = window.AZ.db.bookings[0].id;
[["#/hotel/" + hid], ["#/room/" + rid], ["#/confirmation/" + bid]].forEach(([r]) => {
  const before = errors.length;
  render(r);
  const len = window.document.getElementById("main").innerHTML.length;
  results.push([r, errors.length > before ? "FAIL" : len > 1000 ? "ok" : "FAIL", errors[before] || len + " chars"]);
});

const failed = results.filter((r) => r[1] === "FAIL");
results.forEach((r) => { if (r[1] === "FAIL") console.log("FAIL", r[0], "—", r[2]); });
console.log("\n" + (results.length - failed.length) + "/" + results.length + " routes rendered");
if (errors.length) {
  console.log("\nErrors captured (" + errors.length + "):");
  [...new Set(errors)].slice(0, 12).forEach((e) => console.log(" -", e.slice(0, 300)));
}
process.exit(failed.length || errors.length ? 1 : 0);
