/* Azure Stay — the guest's own dashboard. */
(function () {
  "use strict";
  var AZ = window.AZ, U = window.UI, I = window.Icons.icon, scene = window.Icons.scene;
  var esc = U.esc, money = U.money;

  function guard() {
    var g = Store.currentGuest();
    if (g) return null;
    return {
      title: "Sign in — Azure Stay",
      layout: "site",
      html: '<div class="container section" style="max-width:560px">' +
        U.empty("Sign in to see your account",
          "Your bookings, saved hotels and receipts live behind a sign-in. The demo guest account is prefilled on the sign-in page.",
          '<a class="btn btn-primary" href="#/login?next=' + encodeURIComponent(location.hash) + '">Sign in</a>') + "</div>",
      mount: function () {}
    };
  }

  function bookingsFor(g) {
    return AZ.bookingsOf(g.id).slice().sort(function (a, b) { return a.checkIn < b.checkIn ? 1 : -1; });
  }

  function bookingCard(b, opts) {
    var h = AZ.hotel(b.hotelId), r = AZ.room(b.roomId);
    var upcoming = b.checkIn >= AZ.iso(AZ.TODAY) && b.status !== "Cancelled";
    var past = b.checkOut < AZ.iso(AZ.TODAY);
    return '<article class="card" style="overflow:hidden"><div class="split" style="gap:0">' +
      '<div class="row" style="gap:0;align-items:stretch">' +
      '<div style="width:132px;flex:none">' + scene(h.id, h.kind, 0) + "</div>" +
      '<div style="padding:16px;flex:1"><div class="row between wrap" style="gap:8px">' +
      "<div><h3 style=\"margin-bottom:2px\"><a href=\"#/hotel/" + h.id + '">' + esc(h.name) + "</a></h3>" +
      '<div class="small muted">' + esc(r.type + " · room " + r.number) + " · " + esc(h.city) + "</div></div>" +
      U.pill(b.status) + "</div>" +
      '<div class="row wrap small muted" style="gap:14px;margin-top:10px">' +
      "<span>" + I("calendar") + " " + U.range(b.checkIn, b.checkOut) + "</span>" +
      "<span>" + I("clock") + " " + b.nights + " nights</span>" +
      "<span>" + I("users") + " " + b.adults + (b.children ? " + " + b.children : "") + "</span>" +
      '<span class="mono">' + esc(b.id) + "</span></div>" +
      (upcoming ? '<div class="badge badge-blue" style="margin-top:10px">Check-in ' + U.relative(b.checkIn) + "</div>" : "") +
      "</div></div>" +
      '<div style="padding:16px;border-left:1px solid var(--border);display:flex;flex-direction:column;gap:8px;justify-content:center">' +
      '<div class="price" style="font-size:18px">' + money(b.total) + "</div>" +
      '<div class="small muted">' + U.pill(b.payment) + "</div>" +
      '<button class="btn btn-outline btn-sm" data-view="' + b.id + '">View details</button>' +
      (upcoming ? '<button class="btn btn-ghost btn-sm" data-cancel="' + b.id + '">Cancel stay</button>' : "") +
      (past && b.status === "Checked out" ? '<button class="btn btn-ghost btn-sm" data-review="' + b.id + '">Write a review</button>' : "") +
      "</div></div></article>";
  }

  function wireBookingActions(root) {
    U.on(root, "click", "[data-view]", function (e, b) { openBooking(b.getAttribute("data-view")); });
    U.on(root, "click", "[data-cancel]", function (e, btn) {
      var id = btn.getAttribute("data-cancel"), bk = AZ.booking(id);
      U.confirm({
        title: "Cancel this stay?",
        body: "Booking " + id + " at " + AZ.hotel(bk.hotelId).name + " on " + U.range(bk.checkIn, bk.checkOut) +
          ". Free-cancellation rates refund in full up to 24 hours before arrival.",
        confirm: "Cancel the stay", danger: true,
        onConfirm: function () {
          AZ.update("bookings", id, { status: "Cancelled", payment: "Refunded" });
          U.toast("Stay cancelled", { body: "A refund confirmation is on its way.", tone: "ok" });
          window.Router.reload();
        }
      });
    });
    U.on(root, "click", "[data-review]", function (e, btn) { openReviewForm(btn.getAttribute("data-review")); });
  }

  function openBooking(id) {
    var b = AZ.booking(id), h = AZ.hotel(b.hotelId), r = AZ.room(b.roomId), g = AZ.guest(b.guestId);
    U.modal({
      title: "Booking " + b.id,
      wide: true,
      body: '<div class="split" style="gap:20px"><div>' +
        "<dl class=\"kv\"><dt>Property</dt><dd>" + esc(h.name) + "</dd>" +
        "<dt>Address</dt><dd>" + esc(h.address) + "</dd>" +
        "<dt>Room</dt><dd>" + esc(r.type + " · " + r.view + " · room " + r.number) + "</dd>" +
        "<dt>Guest</dt><dd>" + esc(g ? g.name : "") + "</dd>" +
        "<dt>Check in</dt><dd>" + U.date(b.checkIn, true) + " from " + h.checkIn + "</dd>" +
        "<dt>Check out</dt><dd>" + U.date(b.checkOut, true) + " by " + h.checkOut + "</dd>" +
        "<dt>Status</dt><dd>" + U.pill(b.status) + "</dd>" +
        "<dt>Payment</dt><dd>" + esc(b.method) + " · " + U.pill(b.payment) + "</dd>" +
        "<dt>Source</dt><dd>" + esc(b.source) + "</dd>" +
        (b.requests ? "<dt>Requests</dt><dd>" + esc(b.requests) + "</dd>" : "") + "</dl></div>" +
        '<div class="card card-pad"><h4>Charges</h4>' +
        '<div class="summary-line"><span>Room · ' + b.nights + ' nights</span><span class="mono">' + money(b.roomTotal) + "</span></div>" +
        (b.discount ? '<div class="summary-line"><span>Discount</span><span class="mono">−' + money(b.discount) + "</span></div>" : "") +
        '<div class="summary-line"><span>Taxes</span><span class="mono">' + money(b.taxes) + "</span></div>" +
        '<div class="summary-line"><span>Service fee</span><span class="mono">' + money(b.fee) + "</span></div>" +
        '<div class="summary-line total"><span>Total</span><span class="mono">' + money(b.total) + "</span></div></div></div>",
      foot: '<button class="btn btn-ghost" data-close>Close</button>' +
        '<a class="btn btn-outline" href="#/hotel/' + h.id + '" data-close>View property</a>' +
        '<button class="btn btn-primary" data-print-b>' + I("printer") + "Print</button>",
      onOpen: function (scrim) {
        U.qs("[data-print-b]", scrim).addEventListener("click", function () { window.print(); });
      }
    });
  }

  function openReviewForm(bookingId) {
    var b = AZ.booking(bookingId), h = AZ.hotel(b.hotelId);
    U.modal({
      title: "Review " + h.name,
      body: '<form data-review-form novalidate class="stack">' +
        '<div class="field"><label for="rv-score">Overall score</label>' +
        '<input class="input" id="rv-score" name="score" type="range" min="1" max="10" step="0.5" value="8.5">' +
        '<div class="row between small muted"><span>1</span><span class="mono" data-score-out>8.5</span><span>10</span></div></div>' +
        U.field({ name: "title", label: "Headline", required: true, placeholder: "One line that sums it up" }) +
        U.field({ name: "body", label: "Your review", type: "textarea", required: true,
          placeholder: "What worked, what did not, and what the next guest should know." }) +
        "</form>",
      foot: '<button class="btn btn-ghost" data-close>Not now</button><button class="btn btn-primary" data-submit-review>Publish review</button>',
      onOpen: function (scrim, close) {
        var form = U.qs("[data-review-form]", scrim);
        form.elements.score.addEventListener("input", function () {
          U.qs("[data-score-out]", scrim).textContent = this.value;
        });
        U.qs("[data-submit-review]", scrim).addEventListener("click", function () {
          var res = U.validate(form, { title: "required|min2", body: "required|min2" });
          if (!res.ok) return;
          AZ.db.reviews.unshift({
            id: "AZ-RV" + (AZ.db.reviews.length + 1),
            hotelId: b.hotelId, guestId: b.guestId, bookingId: b.id,
            rating: +form.elements.score.value, title: res.values.title, body: res.values.body,
            date: AZ.iso(AZ.TODAY), status: "Pending", reply: "", helpful: 0
          });
          AZ.save();
          close();
          U.toast("Review submitted", { body: "It goes live once the property team approves it.", tone: "ok" });
          window.Router.reload();
        });
      }
    });
  }

  /* ---------------- overview ---------------- */

  function overview() {
    var blocked = guard(); if (blocked) return blocked;
    var g = Store.currentGuest();
    var all = bookingsFor(g);
    var today = AZ.iso(AZ.TODAY);
    var upcoming = all.filter(function (b) { return b.checkIn >= today && b.status !== "Cancelled"; })
      .sort(function (a, b) { return a.checkIn > b.checkIn ? 1 : -1; });
    var done = all.filter(function (b) { return b.status === "Checked out"; });
    var next = upcoming[0];
    var points = Math.round(done.reduce(function (a, b) { return a + b.total; }, 0) / 10);

    var html = '<div class="workbar"><div><h1>Hello, ' + esc(g.first) + "</h1>" +
      '<p class="muted" style="margin:0">' + esc(g.tier) + " member since " + U.date(g.joined, true) + "</p></div>" +
      '<div class="grow"></div><a class="btn btn-primary" href="#/search">' + I("search") + "Find a room</a></div>" +

      '<div class="grid grid-4" style="gap:14px">' +
      U.stat({ icon: "calendar", label: "Upcoming stays", value: upcoming.length, note: next ? "Next: " + U.relative(next.checkIn) : "Nothing booked yet" }) +
      U.stat({ icon: "check", tone: "green", label: "Completed stays", value: done.length, note: done.length + " reviews you could write" }) +
      U.stat({ icon: "sparkles", tone: "amber", label: "Reward points", value: U.num(points), note: esc(g.tier) + " tier" }) +
      U.stat({ icon: "heart", tone: "red", label: "Saved hotels", value: Store.state.favorites.length, note: "Across " + AZ.db.destinations.length + " cities" }) +
      "</div>" +

      (next ? '<div class="card card-pad" style="margin-top:20px">' +
        '<div class="row between wrap"><h3 style="margin:0">Your next stay</h3>' +
        '<span class="badge badge-blue">Check-in ' + U.relative(next.checkIn) + "</span></div>" +
        '<div class="split" style="margin-top:14px;align-items:center">' +
        '<div style="border-radius:12px;overflow:hidden;aspect-ratio:21/9">' + scene(next.hotelId, AZ.hotel(next.hotelId).kind, 0) + "</div>" +
        "<div><h4>" + esc(AZ.hotel(next.hotelId).name) + '</h4><dl class="kv">' +
        "<dt>Dates</dt><dd>" + U.range(next.checkIn, next.checkOut) + "</dd>" +
        "<dt>Room</dt><dd>" + esc(AZ.room(next.roomId).type) + "</dd>" +
        "<dt>Reference</dt><dd class=\"mono\">" + esc(next.id) + "</dd></dl>" +
        '<div class="row" style="margin-top:12px"><button class="btn btn-outline btn-sm" data-view="' + next.id + '">Details</button>' +
        '<a class="btn btn-ghost btn-sm" href="#/hotel/' + next.hotelId + '">Property page</a></div></div></div></div>' : "") +

      '<div class="split" style="margin-top:20px">' +
      '<div><h3>Recent bookings</h3><div class="stack">' +
      (all.length ? all.slice(0, 3).map(function (b) { return bookingCard(b); }).join("")
        : U.empty("No bookings yet", "When you book, it shows up here with the reference and receipt.",
          '<a class="btn btn-primary" href="#/search">Search hotels</a>')) + "</div></div>" +
      '<aside class="stack"><div class="card card-pad"><h4>Rate watch</h4>' +
      '<p class="small muted">Saved hotels, cheapest night in the next fortnight.</p>' +
      (Store.state.favorites.length ? Store.state.favorites.slice(0, 4).map(function (id) {
        var h = AZ.hotel(id); if (!h) return "";
        var cells = AZ.hotelRail(h, null, 14);
        var lo = Math.min.apply(null, cells.filter(function (c) { return c.free; }).map(function (c) { return c.price; }));
        return '<div style="margin-bottom:14px"><div class="row between small"><a href="#/hotel/' + h.id + '">' + esc(h.name) +
          '</a><span class="mono">' + money(lo) + "</span></div>" + U.rail(cells, { hideHead: true, scale: false }) + "</div>";
      }).join("") : '<p class="small muted">Save a hotel and its rate rail appears here.</p>') + "</div>" +
      '<div class="card card-pad"><h4>Notifications</h4>' +
      AZ.db.notifications.slice(0, 3).map(function (n) {
        return '<div class="row" style="gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' + I(n.icon) +
          "<div><div class=\"small\"><strong>" + esc(n.title) + '</strong></div><div class="small muted">' + U.date(n.date) + "</div></div></div>";
      }).join("") +
      '<a class="btn btn-ghost btn-sm" href="#/account/notifications" style="margin-top:10px">See all</a></div></aside></div>';

    return { title: "Account — Azure Stay", layout: "account", html: html, mount: wireBookingActions };
  }

  /* ---------------- bookings ---------------- */

  function bookings() {
    var blocked = guard(); if (blocked) return blocked;
    var g = Store.currentGuest();
    var all = bookingsFor(g);
    var today = AZ.iso(AZ.TODAY);
    var groups = {
      upcoming: all.filter(function (b) { return b.checkOut >= today && b.status !== "Cancelled"; }),
      past: all.filter(function (b) { return b.checkOut < today && b.status !== "Cancelled"; }),
      cancelled: all.filter(function (b) { return b.status === "Cancelled"; })
    };

    var html = '<div class="workbar"><h1>My bookings</h1><div class="grow"></div>' +
      '<a class="btn btn-outline" href="#/search">Book another stay</a></div>' +
      '<div class="tabs" data-tabs style="margin-bottom:18px">' +
      [["upcoming", "Upcoming", groups.upcoming.length], ["past", "Past", groups.past.length], ["cancelled", "Cancelled", groups.cancelled.length]]
        .map(function (t, i) {
          return '<button data-tab="' + t[0] + '"' + (i === 0 ? ' class="active"' : "") + ">" + t[1] + " (" + t[2] + ")</button>";
        }).join("") + "</div>" +
      Object.keys(groups).map(function (k, i) {
        return '<div data-panel="' + k + '"' + (i ? " hidden" : "") + '><div class="stack">' +
          (groups[k].length ? groups[k].map(function (b) { return bookingCard(b); }).join("")
            : U.empty("Nothing here", k === "upcoming" ? "No stays booked. The rate rail on any hotel shows the cheapest nights coming up."
              : k === "past" ? "Completed stays appear here after check-out." : "Cancelled bookings are kept for your records.",
              k === "upcoming" ? '<a class="btn btn-primary" href="#/search">Search hotels</a>' : "")) + "</div></div>";
      }).join("");

    return {
      title: "My bookings — Azure Stay", layout: "account", html: html,
      mount: function (root) {
        wireBookingActions(root);
        U.on(root, "click", "[data-tab]", function (e, b) {
          var name = b.getAttribute("data-tab");
          U.qsa("[data-panel]", root).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
          U.qsa("[data-tab]", root).forEach(function (x) { x.classList.toggle("active", x === b); });
        });
      }
    };
  }

  /* ---------------- favourites ---------------- */

  function favorites() {
    var blocked = guard(); if (blocked) return blocked;
    var favs = Store.state.favorites.map(AZ.hotel).filter(Boolean);
    var html = '<div class="workbar"><h1>Saved hotels</h1><div class="grow"></div>' +
      '<span class="badge">' + favs.length + " saved</span></div>" +
      (favs.length ? '<div class="grid grid-3">' + favs.map(function (h) { return U.hotelCard(h); }).join("") + "</div>"
        : U.empty("Nothing saved yet", "Tap the heart on any property and it lands here with its rate rail.",
          '<a class="btn btn-primary" href="#/search">Browse hotels</a>'));
    return {
      title: "Saved hotels — Azure Stay", layout: "account", html: html,
      mount: function (root) { window.PagesCustomer.wireFavs(root); }
    };
  }

  /* ---------------- reviews ---------------- */

  function reviews() {
    var blocked = guard(); if (blocked) return blocked;
    var g = Store.currentGuest();
    var mine = AZ.db.reviews.filter(function (r) { return r.guestId === g.id; });
    var reviewable = AZ.bookingsOf(g.id).filter(function (b) {
      return b.status === "Checked out" && !mine.some(function (r) { return r.bookingId === b.id; });
    });

    var html = '<div class="workbar"><h1>My reviews</h1></div>' +
      (reviewable.length ? '<div class="card card-pad" style="margin-bottom:18px"><h3>Stays waiting on a review</h3>' +
        '<div class="stack" style="gap:10px;margin-top:12px">' + reviewable.slice(0, 4).map(function (b) {
          var h = AZ.hotel(b.hotelId);
          return '<div class="row between wrap"><div><strong>' + esc(h.name) + "</strong>" +
            '<div class="small muted">' + U.range(b.checkIn, b.checkOut) + "</div></div>" +
            '<button class="btn btn-outline btn-sm" data-review="' + b.id + '">Write review</button></div>';
        }).join("") + "</div></div>" : "") +
      (mine.length ? '<div class="stack">' + mine.map(function (r) {
        var h = AZ.hotel(r.hotelId);
        return '<article class="card card-pad"><div class="row between wrap">' +
          "<div><h4 style=\"margin-bottom:2px\">" + esc(h.name) + "</h4>" +
          '<div class="small muted">' + U.date(r.date, true) + " · " + U.pill(r.status) + "</div></div>" +
          '<span class="score">' + r.rating.toFixed(1) + "</span></div>" +
          "<h4 style=\"margin:12px 0 4px\">" + esc(r.title) + '</h4><p class="small" style="margin:0">' + esc(r.body) + "</p>" +
          (r.reply ? '<div class="reply"><strong>Reply from the property</strong><br>' + esc(r.reply) + "</div>" : "") +
          "</article>";
      }).join("") + "</div>"
        : U.empty("No reviews written", "After a stay we ask for one. Anything you publish shows here with its approval status."));

    return {
      title: "My reviews — Azure Stay", layout: "account", html: html,
      mount: function (root) {
        U.on(root, "click", "[data-review]", function (e, b) { openReviewForm(b.getAttribute("data-review")); });
      }
    };
  }

  /* ---------------- payments ---------------- */

  function payments() {
    var blocked = guard(); if (blocked) return blocked;
    var g = Store.currentGuest();
    var rows = AZ.db.payments.filter(function (p) { return p.guestId === g.id; });
    if (!rows.length) {
      rows = AZ.bookingsOf(g.id).map(function (b) {
        return { id: "INV-" + b.id.slice(-4), bookingId: b.id, guestId: g.id, hotelId: b.hotelId,
          method: b.method, amount: b.total, status: b.payment, refund: 0, date: b.createdAt };
      });
    }
    var spend = rows.reduce(function (a, p) { return p.status === "Paid" ? a + p.amount : a; }, 0);

    var html = '<div class="workbar"><h1>Payments</h1></div>' +
      '<div class="grid grid-3" style="gap:14px;margin-bottom:18px">' +
      U.stat({ icon: "creditCard", label: "Paid to date", value: money(spend) }) +
      U.stat({ icon: "receipt", tone: "amber", label: "Invoices", value: rows.length }) +
      U.stat({ icon: "sparkles", tone: "green", label: "Saved with promo codes", value: money(AZ.bookingsOf(g.id).reduce(function (a, b) { return a + b.discount; }, 0)) }) +
      "</div><div data-table></div>";

    return {
      title: "Payments — Azure Stay", layout: "account", html: html,
      mount: function (root) {
        U.table(U.qs("[data-table]", root), {
          rows: rows, noun: "invoices", pageSize: 8, rowId: function (r) { return r.id; },
          searchIn: function (r) { return r.id + " " + r.bookingId + " " + AZ.hotel(r.hotelId).name; },
          searchPlaceholder: "Search invoice or booking…",
          columns: [
            { key: "id", label: "Invoice", render: function (r) { return '<span class="mono">' + esc(r.id) + "</span>"; } },
            { key: "hotelId", label: "Property", render: function (r) { return esc(AZ.hotel(r.hotelId).name); } },
            { key: "bookingId", label: "Booking", render: function (r) { return '<span class="mono small">' + esc(r.bookingId) + "</span>"; } },
            { key: "method", label: "Method" },
            { key: "amount", label: "Amount", render: function (r) { return '<span class="mono">' + money(r.amount) + "</span>"; } },
            { key: "status", label: "Status", render: function (r) { return U.pill(r.status); } },
            { key: "date", label: "Date", render: function (r) { return U.date(r.date); } },
            { key: "actions", label: "", sortable: false, render: function (r) {
              return '<button class="btn btn-ghost btn-sm" data-inv="' + r.id + '">' + I("download") + "Receipt</button>";
            } }
          ],
          afterRender: function (c) {
            U.on(c, "click", "[data-inv]", function () {
              U.toast("Receipt ready", { body: "The PDF opens in the print dialog.", tone: "ok" });
              setTimeout(function () { window.print(); }, 400);
            });
          }
        });
      }
    };
  }

  /* ---------------- notifications ---------------- */

  function notifications() {
    var blocked = guard(); if (blocked) return blocked;
    var list = AZ.db.notifications;
    var html = '<div class="workbar"><h1>Notifications</h1><div class="grow"></div>' +
      '<button class="btn btn-outline btn-sm" data-read-all>Mark all read</button></div>' +
      '<div class="card"><div class="stack" style="gap:0">' + list.map(function (n) {
        var h = AZ.hotel(n.hotelId);
        return '<div class="row" style="gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);' +
          (n.read ? "" : "background:var(--surface-2)") + '" data-note="' + n.id + '">' +
          '<div class="ico" style="width:34px;height:34px;border-radius:10px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center">' + I(n.icon) + "</div>" +
          "<div class=\"grow\"><div><strong>" + esc(n.title) + "</strong>" + (n.read ? "" : ' <span class="badge badge-blue">New</span>') + "</div>" +
          '<div class="small muted">' + esc(n.body.replace("%h", h.name).replace("%d", U.date(AZ.booking(n.bookingId) ? AZ.booking(n.bookingId).checkIn : n.date))) + "</div></div>" +
          '<div class="small muted nowrap">' + U.relative(n.date) + "</div></div>";
      }).join("") + "</div></div>";

    return {
      title: "Notifications — Azure Stay", layout: "account", html: html,
      mount: function (root) {
        U.on(root, "click", "[data-read-all]", function () {
          AZ.db.notifications.forEach(function (n) { n.read = true; });
          AZ.save();
          U.toast("All caught up", { tone: "ok" });
          window.Router.reload();
        });
        U.on(root, "click", "[data-note]", function (e, el) {
          var n = AZ.db.notifications.filter(function (x) { return x.id === el.getAttribute("data-note"); })[0];
          n.read = true; AZ.save();
          el.style.background = "";
          var badge = el.querySelector(".badge");
          if (badge) badge.remove();
        });
      }
    };
  }

  /* ---------------- profile ---------------- */

  function profile() {
    var blocked = guard(); if (blocked) return blocked;
    var g = Store.currentGuest();
    var html = '<div class="workbar"><h1>Profile</h1></div>' +
      '<div class="split"><form class="card card-pad" data-profile novalidate>' +
      '<div class="row" style="margin-bottom:18px">' + U.avatar(g.name, "lg") +
      "<div><h3 style=\"margin:0\">" + esc(g.name) + '</h3><div class="small muted">' + esc(g.email) + " · " + esc(g.tier) + " member</div></div></div>" +
      '<div class="form-grid">' +
      U.field({ name: "first", label: "First name", required: true, value: g.first }) +
      U.field({ name: "last", label: "Last name", required: true, value: g.last }) +
      U.field({ name: "email", label: "Email", type: "email", required: true, full: true, value: g.email }) +
      U.field({ name: "phone", label: "Phone", required: true, value: g.phone }) +
      U.field({ name: "nationality", label: "Nationality", type: "select", value: g.nationality,
        options: ["Portugal", "Japan", "Germany", "Brazil", "Canada", "France", "Nigeria", "Sweden", "Italy", "Thailand",
          "Netherlands", "South Africa", "Spain", "India", "Denmark", "United Kingdom", "Australia", "Mexico", "Singapore", "Norway"] }) +
      U.field({ name: "prefs", label: "Room preferences", type: "textarea", full: true, value: g.preferences.join(", "),
        hint: "Passed to the front desk on every booking. Comma separated." }) +
      "</div><div class=\"row end\" style=\"margin-top:16px\"><button class=\"btn btn-primary\" type=\"submit\">Save changes</button></div></form>" +
      '<aside class="stack"><div class="card card-pad"><h4>Membership</h4>' +
      '<div class="row between small"><span>Tier</span><strong>' + esc(g.tier) + "</strong></div>" +
      '<div class="row between small"><span>Member since</span><span>' + U.date(g.joined, true) + "</span></div>" +
      '<div class="row between small"><span>Stays</span><span>' + g.bookings + "</span></div>" +
      '<div class="row between small" style="margin-bottom:10px"><span>Lifetime spend</span><span class="mono">' + money(g.spend) + "</span></div>" +
      U.progress(Math.min(100, g.spend / 12000 * 100), "amber") +
      '<div class="small muted" style="margin-top:6px">' + money(Math.max(0, 12000 - g.spend)) + " to Platinum</div></div>" +
      '<div class="card card-pad"><h4>Documents</h4>' +
      '<p class="small muted">Nothing on file. Passport details are collected at check-in and never stored in the app.</p></div></aside></div>';

    return {
      title: "Profile — Azure Stay", layout: "account", html: html,
      mount: function (root) {
        var form = U.qs("[data-profile]", root);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var res = U.validate(form, { first: "required|min2", last: "required|min2", email: "required|email", phone: "required|phone" });
          if (!res.ok) return;
          g.first = res.values.first; g.last = res.values.last; g.name = g.first + " " + g.last;
          g.email = res.values.email; g.phone = res.values.phone;
          g.nationality = form.elements.nationality.value;
          g.preferences = form.elements.prefs.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
          AZ.save();
          Store.set({ user: Object.assign({}, Store.state.user, { name: g.name, email: g.email }) });
          U.toast("Profile saved", { tone: "ok" });
          window.Router.reload();
        });
      }
    };
  }

  /* ---------------- settings ---------------- */

  function settings() {
    var blocked = guard(); if (blocked) return blocked;
    var s = Store.state.settings;
    var html = '<div class="workbar"><h1>Settings</h1></div>' +
      '<div class="split"><div class="stack">' +
      '<div class="card card-pad"><h3>Display</h3><div class="form-grid" style="margin-top:12px">' +
      U.field({ name: "currency", label: "Currency", type: "select", value: s.currency, options: ["USD", "EUR", "GBP", "JPY"] }) +
      U.field({ name: "language", label: "Language", type: "select", value: s.language, options: ["English", "Português", "日本語", "Deutsch"] }) +
      "</div>" +
      '<label class="check" style="margin-top:14px"><input type="checkbox" data-theme-toggle ' +
      (Store.state.theme === "dark" ? "checked" : "") + "> <span>Dark mode</span></label></div>" +

      '<div class="card card-pad"><h3>Notifications</h3>' +
      '<div class="stack" style="margin-top:12px">' +
      '<label class="check"><input type="checkbox" data-set="emails" ' + (s.emails ? "checked" : "") + "> <span>Booking emails — confirmations, receipts, check-in reminders</span></label>" +
      '<label class="check"><input type="checkbox" data-set="sms" ' + (s.sms ? "checked" : "") + "> <span>SMS on the day of arrival</span></label>" +
      '<label class="check"><input type="checkbox" data-set="deals" ' + (s.deals ? "checked" : "") + "> <span>Weekly rate alerts for saved hotels</span></label></div></div>" +

      '<div class="card card-pad"><h3>Demo data</h3>' +
      '<p class="small muted">Everything in this project is generated in the browser from a fixed seed and stored locally. Resetting rebuilds all ' +
      AZ.db.bookings.length + " bookings and clears anything you changed.</p>" +
      '<div class="row"><button class="btn btn-outline" data-reset>' + I("refresh") + "Reset demo data</button>" +
      '<button class="btn btn-ghost" data-signout>' + I("logOut") + "Sign out</button></div></div></div>" +

      '<aside class="card card-pad"><h4>Account</h4><dl class="kv">' +
      "<dt>Signed in as</dt><dd>" + esc(Store.state.user.email) + "</dd>" +
      "<dt>Role</dt><dd>Guest</dd><dt>Storage</dt><dd>localStorage</dd>" +
      "<dt>Data reset</dt><dd>Daily, to keep dates current</dd></dl></aside></div>";

    return {
      title: "Settings — Azure Stay", layout: "account", html: html,
      mount: function (root) {
        U.on(root, "change", "[data-theme-toggle]", function () { Store.toggleTheme(); });
        U.on(root, "change", "[data-set]", function (e, el) {
          var patch = {}; patch[el.getAttribute("data-set")] = el.checked;
          Store.patchSettings(patch);
          U.toast("Preference saved", { tone: "ok" });
        });
        U.on(root, "change", '[name="currency"]', function (e, el) {
          Store.patchSettings({ currency: el.value });
          U.toast("Currency set to " + el.value, { body: "Prices update across the app.", tone: "ok" });
          window.Router.reload();
        });
        U.on(root, "change", '[name="language"]', function (e, el) {
          Store.patchSettings({ language: el.value });
          U.toast("Language preference saved", { body: "Copy stays in English in this demo.", tone: "" });
        });
        U.on(root, "click", "[data-reset]", function () {
          U.confirm({
            title: "Reset the demo data?", danger: true, confirm: "Reset everything",
            body: "This clears local storage and regenerates the whole property group. Your bookings in this demo will be gone.",
            onConfirm: function () { AZ.reset(); }
          });
        });
        U.on(root, "click", "[data-signout]", function () {
          Store.logout();
          U.toast("Signed out", { tone: "" });
          location.hash = "#/";
        });
      }
    };
  }

  window.PagesAccount = {
    overview: overview, bookings: bookings, favorites: favorites, reviews: reviews,
    payments: payments, notifications: notifications, profile: profile, settings: settings,
    openBooking: openBooking, bookingCard: bookingCard
  };
})();
