/* Azure Stay — application shell: chrome, layouts, routes, boot. */
(function () {
  "use strict";
  var AZ = window.AZ, U = window.UI, I = window.Icons.icon;
  var PC = window.PagesCustomer, PA = window.PagesAccount, AD = window.PagesAdmin;
  var esc = U.esc;

  var app = document.getElementById("app");

  /* ---------------- chrome ---------------- */

  function brand(small) {
    return '<a class="brand" href="#/"><span class="brand-mark">' + I("building") + "</span>" +
      "<span>Azure Stay" + (small ? "" : "<small>book by the night</small>") + "</span></a>";
  }

  function topbar(path) {
    var u = Store.state.user;
    var links = [["#/", "Home"], ["#/search", "Hotels"], ["#/about", "About"], ["#/faq", "Help"], ["#/contact", "Contact"]];
    return '<header class="topbar no-print"><div class="container topbar-inner">' + brand() +
      '<nav class="nav-links" aria-label="Main">' + links.map(function (l) {
        var active = l[0] === "#/" ? path === "/" : path.indexOf(l[0].slice(1)) === 0;
        return '<a href="' + l[0] + '"' + (active ? ' class="active" aria-current="page"' : "") + ">" + l[1] + "</a>";
      }).join("") + "</nav>" +
      '<div class="nav-actions">' +
      '<button class="icon-btn" data-theme-btn aria-label="Switch colour theme">' + I(Store.state.theme === "dark" ? "sun" : "moon") + "</button>" +
      '<a class="icon-btn" href="#/account/favorites" aria-label="Saved hotels">' + I("heart") + "</a>" +
      (u
        ? '<a class="btn btn-outline btn-sm" href="' + (u.role === "guest" ? "#/account" : "#/admin") + '">' +
          U.avatar(u.name) + "<span>" + esc(u.name.split(" ")[0]) + "</span></a>"
        : '<a class="btn btn-ghost btn-sm" href="#/login">Sign in</a><a class="btn btn-primary btn-sm" href="#/register">Register</a>') +
      '<button class="icon-btn burger" data-burger aria-label="Open menu" aria-expanded="false">' + I("menu") + "</button>" +
      "</div></div>" +
      '<div class="drawer-nav" data-drawer><div class="container">' + links.map(function (l) {
        return '<a href="' + l[0] + '">' + l[1] + "</a>";
      }).join("") +
      (u ? '<a href="' + (u.role === "guest" ? "#/account" : "#/admin") + '">My account</a><a href="#" data-signout>Sign out</a>'
        : '<a href="#/login">Sign in</a><a href="#/register">Create account</a>') +
      "</div></div></header>";
  }

  function footer() {
    var cols = [
      ["Book", [["#/search", "Search hotels"], ["#/search?destination=Lisbon", "Lisbon"], ["#/search?destination=Kyoto", "Kyoto"], ["#/account/bookings", "My bookings"]]],
      ["Company", [["#/about", "About Azure Stay"], ["#/contact", "Contact"], ["#/faq", "Help centre"], ["#/admin", "Staff console"]]],
      ["Legal", [["#/terms", "Booking terms"], ["#/privacy", "Privacy"], ["#/404", "404 page"], ["#/500", "500 page"]]]
    ];
    return '<footer class="footer no-print"><div class="container footer-grid">' +
      "<div>" + brand() +
      '<p style="color:#cbd5e1;max-width:38ch;margin-top:14px">Twenty properties in twelve cities, with nightly rates published up front. ' +
      "A portfolio project — every price, guest and booking on this site is generated data.</p>" +
      '<div class="row" style="gap:8px;margin-top:14px">' + ["globe", "mail", "phone"].map(function (i) {
        return '<span class="icon-btn" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#cbd5e1">' + I(i) + "</span>";
      }).join("") + "</div></div>" +
      cols.map(function (c) {
        return "<div><h5>" + c[0] + "</h5><ul>" + c[1].map(function (l) {
          return '<li><a href="' + l[0] + '">' + l[1] + "</a></li>";
        }).join("") + "</ul></div>";
      }).join("") + "</div>" +
      '<div class="container footer-base"><span>© ' + new Date().getFullYear() + " Azure Stay — demo project</span>" +
      "<span>Built with vanilla HTML, CSS and JavaScript. No build step, no dependencies.</span></div></footer>";
  }

  function bottomNav(path) {
    var items = [["#/", "home", "Home"], ["#/search", "search", "Search"], ["#/account/bookings", "calendar", "Trips"],
      ["#/account/favorites", "heart", "Saved"], ["#/account", "user", "Account"]];
    return '<nav class="bottom-nav no-print" aria-label="Mobile">' + items.map(function (i) {
      var active = i[0] === "#/" ? path === "/" : path.indexOf(i[0].slice(1)) === 0;
      return '<a href="' + i[0] + '"' + (active ? ' class="active"' : "") + ">" + I(i[1]) + "<span>" + i[2] + "</span></a>";
    }).join("") + "</nav>";
  }

  function sidebar(kind, path) {
    var u = Store.state.user;
    var groups = kind === "admin"
      ? [["Operations", [["#/admin", "grid", "Dashboard"], ["#/admin/reservations", "calendar", "Reservations"],
          ["#/admin/rooms", "bed", "Rooms"], ["#/admin/guests", "users", "Guests"]]],
        ["Revenue", [["#/admin/payments", "creditCard", "Payments"], ["#/admin/promotions", "tag", "Promotions"],
          ["#/admin/analytics", "chart", "Analytics"], ["#/admin/reports", "fileText", "Reports"]]],
        ["Property", [["#/admin/reviews", "message", "Reviews"], ["#/admin/staff", "briefcase", "Staff"],
          ["#/admin/roles", "shield", "Roles"], ["#/admin/settings", "settings", "Settings"]]]]
      : [["Your stays", [["#/account", "grid", "Overview"], ["#/account/bookings", "calendar", "Bookings"],
          ["#/account/favorites", "heart", "Saved hotels"], ["#/account/reviews", "star", "Reviews"]]],
        ["Account", [["#/account/payments", "creditCard", "Payments"], ["#/account/notifications", "bell", "Notifications"],
          ["#/account/profile", "user", "Profile"], ["#/account/settings", "settings", "Settings"]]]];

    return '<aside class="sidebar no-print" data-sidebar>' + brand(true) +
      groups.map(function (g) {
        return '<div class="sep">' + g[0] + "</div>" + g[1].map(function (l) {
          var active = path === l[0].slice(1);
          return '<a href="' + l[0] + '"' + (active ? ' class="active" aria-current="page"' : "") + ">" + I(l[1]) + l[2] + "</a>";
        }).join("");
      }).join("") +
      '<div class="sidebar-foot">' +
      (u ? '<div class="row" style="gap:10px;padding:0 4px 12px">' + U.avatar(u.name) +
        "<div><div style=\"color:#fff;font-size:13.5px\"><strong>" + esc(u.name) + "</strong></div>" +
        '<div style="font-size:11.5px;color:#8fa4cc">' + esc(u.title || (u.role === "guest" ? "Guest" : "Staff")) + "</div></div></div>" : "") +
      '<a href="#/">' + I("arrowLeft") + "Back to the site</a>" +
      '<a href="#" data-signout>' + I("logOut") + "Sign out</a></div></aside>";
  }

  /* ---------------- layouts ---------------- */

  function paint(page, ctx) {
    var layout = page.layout || "site";
    var path = ctx.path;

    // Each render gets a brand-new view node. Pages attach delegated listeners
    // to the node they are handed, so throwing it away on navigation is what
    // stops handlers stacking up over a long session.
    var markup = (layout === "admin" || layout === "account")
      ? '<div class="shell">' + sidebar(layout, path) +
        '<main class="workspace" id="main">' +
        '<button class="icon-btn no-print" data-sidebar-toggle aria-label="Open menu" style="margin-bottom:12px">' + I("menu") + "</button>" +
        page.html + "</main></div>"
      : topbar(path) + '<main id="main">' + page.html + "</main>" + footer() + bottomNav(path);

    app.innerHTML = "";
    var view = document.createElement("div");
    view.className = "view";
    view.innerHTML = markup;
    app.appendChild(view);

    document.title = page.title || "Azure Stay";
    document.body.classList.toggle("has-bottom-nav", layout === "site");

    // chrome wiring
    U.qsa("[data-theme-btn]", app).forEach(function (b) {
      b.addEventListener("click", function () { Store.toggleTheme(); window.Router.reload(); });
    });
    var burger = U.qs("[data-burger]", app);
    if (burger) {
      burger.addEventListener("click", function () {
        var d = U.qs("[data-drawer]", app);
        var open = d.classList.toggle("open");
        burger.setAttribute("aria-expanded", String(open));
      });
    }
    var sideToggle = U.qs("[data-sidebar-toggle]", app);
    if (sideToggle) {
      sideToggle.addEventListener("click", function () {
        var s = U.qs("[data-sidebar]", app);
        s.classList.add("open");
        var scrim = document.createElement("div");
        scrim.className = "scrim no-print";
        scrim.addEventListener("click", function () { s.classList.remove("open"); scrim.remove(); });
        document.body.appendChild(scrim);
      });
    }
    U.qsa("[data-signout]", app).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        Store.logout();
        U.toast("Signed out", { body: "See you next stay." });
        location.hash = "#/";
      });
    });

    if (page.mount) page.mount(view, ctx);

    if (!ctx.keepScroll) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    var main = document.getElementById("main");
    if (main) { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); }
  }

  /* ---------------- routes ---------------- */

  var R = window.Router;
  R.add("/", PC.home);
  R.add("/search", PC.search);
  R.add("/hotel/:id", PC.hotel);
  R.add("/room/:id", PC.room);
  R.add("/booking", PC.booking);
  R.add("/review", PC.review);
  R.add("/payment", PC.payment);
  R.add("/confirmation/:id", PC.confirmation);
  R.add("/login", PC.login);
  R.add("/register", PC.register);
  R.add("/forgot", PC.forgot);
  R.add("/about", PC.about);
  R.add("/contact", PC.contact);
  R.add("/faq", PC.faq);
  R.add("/privacy", PC.privacy);
  R.add("/terms", PC.terms);

  R.add("/account", PA.overview);
  R.add("/account/bookings", PA.bookings);
  R.add("/account/favorites", PA.favorites);
  R.add("/account/reviews", PA.reviews);
  R.add("/account/payments", PA.payments);
  R.add("/account/notifications", PA.notifications);
  R.add("/account/profile", PA.profile);
  R.add("/account/settings", PA.settings);

  R.add("/admin", AD.dashboard);
  R.add("/admin/reservations", AD.reservations);
  R.add("/admin/rooms", AD.rooms);
  R.add("/admin/guests", AD.guests);
  R.add("/admin/payments", AD.payments);
  R.add("/admin/reviews", AD.reviews);
  R.add("/admin/promotions", AD.promotions);
  R.add("/admin/staff", AD.staff);
  R.add("/admin/roles", AD.roles);
  R.add("/admin/analytics", AD.analytics);
  R.add("/admin/reports", AD.reports);
  R.add("/admin/settings", AD.settings);

  R.add("/403", function () { return PC.error(403); });
  R.add("/404", function () { return PC.error(404); });
  R.add("/500", function () { return PC.error(500); });

  /* ---------------- boot ---------------- */

  R.start(paint);

  if (window.console && console.info) {
    console.info("%cAzure Stay", "font:600 15px Poppins,sans-serif;color:#1e3a8a",
      "\n" + AZ.db.hotels.length + " hotels · " + AZ.db.rooms.length + " rooms · " + AZ.db.bookings.length + " bookings" +
      "\nDemo sign-ins: guest@ / manager@ / admin@azurestay.example — password azure2026" +
      "\nAZ.reset() rebuilds the data set.");
  }
})();
