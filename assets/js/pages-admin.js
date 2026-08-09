/* Azure Stay — staff console. Reservations, the room board, guests, money,
   reviews, promotions, people and reporting. */
(function () {
  "use strict";
  var AZ = window.AZ, U = window.UI, C = window.Charts, I = window.Icons.icon, scene = window.Icons.scene;
  var esc = U.esc, money = U.money;

  var BLUE = "#2563eb", NAVY = "#1e3a8a", AMBER = "#f59e0b", GREEN = "#22c55e", RED = "#ef4444", SLATE = "#94a3b8";

  function guard() {
    var u = Store.state.user;
    if (u && (u.role === "staff" || u.role === "admin")) return null;
    return {
      title: "Staff only — Azure Stay",
      layout: "site",
      html: '<div class="container errorpage"><div class="code">403</div><h1>Staff sign-in required</h1>' +
        '<p class="muted" style="max-width:48ch;margin-inline:auto">The console runs the property: reservations, the room board and the money. ' +
        'Sign in with the front desk or administrator demo account to open it.</p>' +
        '<div class="row" style="justify-content:center;gap:10px;margin-top:20px">' +
        '<a class="btn btn-primary" href="#/login?next=%23%2Fadmin">Sign in as staff</a>' +
        '<a class="btn btn-outline" href="#/">Back to the site</a></div></div>',
      mount: function () {}
    };
  }

  function today() { return AZ.iso(AZ.TODAY); }

  function kpis() {
    var t = today();
    var rooms = AZ.db.rooms.length;
    var inHouse = AZ.stayingOn(t);
    var free = AZ.db.rooms.filter(function (r) { return AZ.isFree(r.id, t); }).length;
    var revToday = AZ.db.bookings.reduce(function (a, b) {
      return b.createdAt === t && b.status !== "Cancelled" ? a + b.total : a;
    }, 0);
    var monthKey = t.slice(0, 7);
    var revMonth = AZ.db.bookings.reduce(function (a, b) {
      return b.checkIn.slice(0, 7) === monthKey && b.status !== "Cancelled" ? a + b.total : a;
    }, 0);
    var pending = AZ.db.bookings.filter(function (b) { return b.payment === "Pending"; });
    return {
      rooms: rooms,
      inHouse: inHouse,
      free: free,
      occupied: rooms - free,
      arrivals: AZ.arrivalsOn(t),
      departures: AZ.departuresOn(t),
      bookingsToday: AZ.db.bookings.filter(function (b) { return b.createdAt === t; }),
      revToday: revToday,
      revMonth: revMonth,
      pending: pending,
      pendingValue: pending.reduce(function (a, b) { return a + b.total; }, 0),
      occupancy: Math.round((rooms - free) / rooms * 100)
    };
  }

  /* ---------------- dashboard ---------------- */

  function dashboard() {
    var blocked = guard(); if (blocked) return blocked;
    var k = kpis();
    var months = AZ.revenueByMonth(12);
    var occ = AZ.occupancySeries(14);

    var sources = {};
    AZ.db.bookings.forEach(function (b) { sources[b.source] = (sources[b.source] || 0) + 1; });
    var sourceData = Object.keys(sources).map(function (s, i) {
      return { label: s, value: sources[s], color: [NAVY, BLUE, AMBER, GREEN, SLATE, "#8b5cf6"][i % 6] };
    });

    var typeCount = {};
    AZ.db.rooms.forEach(function (r) { typeCount[r.type] = (typeCount[r.type] || 0) + 1; });
    var typeData = Object.keys(typeCount).map(function (t, i) {
      return { label: t, value: typeCount[t], color: [NAVY, BLUE, "#60a5fa", AMBER, GREEN, SLATE, "#8b5cf6"][i % 7] };
    });

    var cancels = months.map(function (m) {
      var all = AZ.db.bookings.filter(function (b) { return b.checkIn.slice(0, 7) === m.key; });
      var c = all.filter(function (b) { return b.status === "Cancelled"; }).length;
      return { label: m.label, value: all.length ? Math.round(c / all.length * 100) : 0 };
    });

    var guestsByMonth = months.map(function (m) {
      return { label: m.label, value: AZ.db.guests.filter(function (g) { return g.joined.slice(0, 7) <= m.key; }).length };
    });

    var html = '<div class="workbar"><div><h1>Dashboard</h1>' +
      '<p class="muted" style="margin:0">' + U.date(today(), true) + " · " + AZ.db.hotels.length + " properties, " + k.rooms + " rooms</p></div>" +
      '<div class="grow"></div><a class="btn btn-outline btn-sm" href="#/admin/reports">' + I("fileText") + "Reports</a>" +
      '<a class="btn btn-primary btn-sm" href="#/admin/reservations">' + I("calendar") + "Reservations</a></div>" +

      '<div class="grid grid-4" style="gap:14px">' +
      U.stat({ icon: "calendar", label: "Bookings today", value: k.bookingsToday.length, delta: 8.4 }) +
      U.stat({ icon: "bed", tone: "green", label: "Rooms available", value: k.free, note: k.occupied + " occupied of " + k.rooms }) +
      U.stat({ icon: "chart", tone: "amber", label: "Occupancy tonight", value: k.occupancy + "%", spark: C.spark(occ.map(function (o) { return o.value; }), AMBER) }) +
      U.stat({ icon: "creditCard", label: "Revenue today", value: money(k.revToday), delta: 3.1 }) +
      U.stat({ icon: "trend", tone: "green", label: "Revenue this month", value: money(k.revMonth), note: "Booked, not yet all collected" }) +
      U.stat({ icon: "receipt", tone: "red", label: "Payments pending", value: money(k.pendingValue), note: k.pending.length + " invoices" }) +
      U.stat({ icon: "logIn", label: "Arrivals today", value: k.arrivals.length, note: "Desk workload" }) +
      U.stat({ icon: "logOut", tone: "amber", label: "Departures today", value: k.departures.length, note: "Housekeeping queue" }) +
      "</div>" +

      '<div class="split" style="margin-top:20px">' +
      '<div class="card chart-card"><h4>Revenue by month</h4><p class="small muted">Booked value, cancellations excluded.</p>' +
      '<div class="chart-wrap">' + C.bars(months, { fmt: function (v) { return money(v); }, colorFor: function (d, i) { return i === months.length - 1 ? AMBER : NAVY; } }) + "</div></div>" +
      '<div class="card chart-card"><h4>Occupancy, two weeks either side of today</h4>' +
      '<p class="small muted">Share of the ' + k.rooms + " rooms sold.</p>" +
      '<div class="chart-wrap">' + C.area(occ, { color: BLUE, fmt: function (v) { return Math.round(v) + "%"; } }) + "</div></div></div>" +

      '<div class="grid grid-3" style="margin-top:20px">' +
      '<div class="card chart-card"><h4>Booking sources</h4><div class="chart-wrap" style="max-width:240px;margin:auto">' +
      C.donut(sourceData, { center: String(AZ.db.bookings.length), centerLabel: "bookings" }) + "</div>" +
      '<div class="legend">' + sourceData.map(function (d) {
        return '<span><i style="background:' + d.color + '"></i>' + esc(d.label) + "</span>";
      }).join("") + "</div></div>" +
      '<div class="card chart-card"><h4>Room mix</h4><div class="chart-wrap" style="max-width:240px;margin:auto">' +
      C.donut(typeData, { center: String(k.rooms), centerLabel: "rooms" }) + "</div>" +
      '<div class="legend">' + typeData.map(function (d) {
        return '<span><i style="background:' + d.color + '"></i>' + esc(d.label) + "</span>";
      }).join("") + "</div></div>" +
      '<div class="card chart-card"><h4>Cancellation rate</h4><p class="small muted">Share of bookings cancelled, by arrival month.</p>' +
      '<div class="chart-wrap">' + C.area(cancels, { color: RED, h: 200, fmt: function (v) { return Math.round(v) + "%"; } }) + "</div></div></div>" +

      '<div class="split" style="margin-top:20px">' +
      '<div class="card card-pad"><div class="row between"><h4 style="margin:0">Arrivals today</h4>' +
      '<a class="btn btn-ghost btn-sm" href="#/admin/reservations">Open list</a></div>' +
      (k.arrivals.length ? '<div class="stack" style="gap:0;margin-top:8px">' + k.arrivals.slice(0, 6).map(function (b) {
        var g = AZ.guest(b.guestId), r = AZ.room(b.roomId);
        return '<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)">' +
          '<div class="row">' + U.avatar(g ? g.name : "Guest") +
          "<div><div class=\"small\"><strong>" + esc(g ? g.name : "Guest") + '</strong></div>' +
          '<div class="small muted">' + esc(AZ.hotel(b.hotelId).name) + " · room " + esc(r.number) + "</div></div></div>" +
          '<div class="right"><div class="mono small">' + esc(b.id) + "</div>" + U.pill(b.status) + "</div></div>";
      }).join("") + "</div>" : U.empty("Nothing arriving", "No check-ins on the books for today.")) + "</div>" +
      '<div class="card card-pad"><div class="row between"><h4 style="margin:0">Departures today</h4>' +
      '<a class="btn btn-ghost btn-sm" href="#/admin/rooms">Room board</a></div>' +
      (k.departures.length ? '<div class="stack" style="gap:0;margin-top:8px">' + k.departures.slice(0, 6).map(function (b) {
        var g = AZ.guest(b.guestId), r = AZ.room(b.roomId);
        return '<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border)">' +
          "<div><div class=\"small\"><strong>" + esc(g ? g.name : "Guest") + '</strong></div>' +
          '<div class="small muted">Room ' + esc(r.number) + " · " + b.nights + " nights</div></div>" +
          '<span class="mono small">' + money(b.total) + "</span></div>";
      }).join("") + "</div>" : U.empty("No departures", "Housekeeping has a light morning.")) + "</div></div>" +

      '<div class="card chart-card" style="margin-top:20px"><h4>Guest base</h4>' +
      '<p class="small muted">Registered guests, cumulative.</p>' +
      '<div class="chart-wrap">' + C.area(guestsByMonth, { color: GREEN, h: 200 }) + "</div></div>";

    return { title: "Dashboard — Azure Stay staff", layout: "admin", html: html, mount: function () {} };
  }

  /* ---------------- reservations ---------------- */

  function reservations() {
    var blocked = guard(); if (blocked) return blocked;
    var filter = { status: "", hotel: "", when: "all" };

    var html = '<div class="workbar"><div><h1>Reservations</h1>' +
      '<p class="muted" style="margin:0">' + AZ.db.bookings.length + " bookings across every property</p></div>" +
      '<div class="grow"></div><button class="btn btn-outline btn-sm" data-print>' + I("printer") + "Print list</button>" +
      '<button class="btn btn-primary btn-sm" data-new>' + I("plus") + "New reservation</button></div>" +
      '<div class="card card-pad" style="margin-bottom:16px"><div class="row wrap" style="gap:12px">' +
      '<div class="field"><label for="f-when">Period</label><select class="select" id="f-when" data-f="when">' +
      [["all", "All dates"], ["today", "Arriving today"], ["inhouse", "In house"], ["future", "Upcoming"], ["past", "Past"]]
        .map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label for="f-status">Status</label><select class="select" id="f-status" data-f="status">' +
      ['<option value="">Any status</option>'].concat(["Confirmed", "Pending", "Checked in", "Checked out", "Cancelled", "No-show"]
        .map(function (s) { return "<option>" + s + "</option>"; })).join("") + "</select></div>" +
      '<div class="field grow"><label for="f-hotel">Property</label><select class="select" id="f-hotel" data-f="hotel">' +
      ['<option value="">All properties</option>'].concat(AZ.db.hotels.map(function (h) {
        return '<option value="' + h.id + '">' + esc(h.name) + " · " + esc(h.city) + "</option>";
      })).join("") + "</select></div></div></div>" +
      "<div data-table></div>";

    return {
      title: "Reservations — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        var t = today();
        function rows() {
          return AZ.db.bookings.filter(function (b) {
            if (filter.status && b.status !== filter.status) return false;
            if (filter.hotel && b.hotelId !== filter.hotel) return false;
            if (filter.when === "today" && b.checkIn !== t) return false;
            if (filter.when === "inhouse" && !(b.checkIn <= t && b.checkOut > t && b.status !== "Cancelled")) return false;
            if (filter.when === "future" && b.checkIn <= t) return false;
            if (filter.when === "past" && b.checkOut >= t) return false;
            return true;
          });
        }
        var api = U.table(U.qs("[data-table]", root), {
          rows: rows(), noun: "reservations", pageSize: 12, sort: "checkIn", dir: "desc",
          rowId: function (b) { return b.id; },
          searchIn: function (b) {
            var g = AZ.guest(b.guestId);
            return b.id + " " + (g ? g.name + " " + g.email : "") + " " + AZ.hotel(b.hotelId).name + " " + AZ.room(b.roomId).number;
          },
          searchPlaceholder: "Search reference, guest, property…",
          onRow: function (id) { openReservation(id); },
          columns: [
            { key: "id", label: "Reference", render: function (b) { return '<span class="mono small">' + esc(b.id) + "</span>"; } },
            { key: "guestId", label: "Guest", value: function (b) { var g = AZ.guest(b.guestId); return g ? g.name : ""; },
              render: function (b) {
                var g = AZ.guest(b.guestId);
                return '<div class="row" style="gap:8px">' + U.avatar(g ? g.name : "Guest") +
                  '<div><div class="cell-main">' + esc(g ? g.name : "Guest") + '</div><div class="cell-sub">' +
                  esc(g ? g.nationality : "") + "</div></div></div>";
              } },
            { key: "hotelId", label: "Property", value: function (b) { return AZ.hotel(b.hotelId).name; },
              render: function (b) {
                return '<div class="cell-main">' + esc(AZ.hotel(b.hotelId).name) + '</div><div class="cell-sub">Room ' +
                  esc(AZ.room(b.roomId).number) + " · " + esc(AZ.room(b.roomId).type) + "</div>";
              } },
            { key: "checkIn", label: "Check in", render: function (b) { return '<span class="mono small">' + b.checkIn + "</span>"; } },
            { key: "checkOut", label: "Check out", render: function (b) { return '<span class="mono small">' + b.checkOut + "</span>"; } },
            { key: "nights", label: "Nights" },
            { key: "adults", label: "Guests", value: function (b) { return b.adults + b.children; },
              render: function (b) { return b.adults + (b.children ? " + " + b.children : ""); } },
            { key: "status", label: "Status", render: function (b) { return U.pill(b.status); } },
            { key: "payment", label: "Payment", render: function (b) { return U.pill(b.payment) + '<div class="cell-sub mono">' + money(b.total) + "</div>"; } },
            { key: "actions", label: "", sortable: false, render: function (b) {
              return '<div class="row" style="gap:4px">' +
                '<button class="btn btn-ghost btn-sm" data-open="' + b.id + '">Open</button>' +
                (b.status === "Confirmed" && b.checkIn <= t ? '<button class="btn btn-outline btn-sm" data-checkin="' + b.id + '">Check in</button>' : "") +
                (b.status === "Checked in" ? '<button class="btn btn-outline btn-sm" data-checkout="' + b.id + '">Check out</button>' : "") +
                "</div>";
            } }
          ],
          afterRender: function (c) {
            U.on(c, "click", "[data-open]", function (e, b) { openReservation(b.getAttribute("data-open")); });
            U.on(c, "click", "[data-checkin]", function (e, b) { setStatus(b.getAttribute("data-checkin"), "Checked in", api, rows); });
            U.on(c, "click", "[data-checkout]", function (e, b) { setStatus(b.getAttribute("data-checkout"), "Checked out", api, rows); });
          }
        });

        U.on(root, "change", "[data-f]", function (e, el) {
          filter[el.getAttribute("data-f")] = el.value;
          api.setRows(rows());
        });
        U.on(root, "click", "[data-print]", function () { window.print(); });
        U.on(root, "click", "[data-new]", function () { newReservation(api, rows); });
      }
    };
  }

  function setStatus(id, status, api, rows) {
    var patch = { status: status };
    if (status === "Checked in") patch.payment = "Paid";
    AZ.update("bookings", id, patch);
    var b = AZ.booking(id);
    AZ.update("rooms", b.roomId, { status: status === "Checked in" ? "Occupied" : "Cleaning", cleaning: status === "Checked out" ? "Due" : "Clean" });
    U.toast(status, { body: id + " updated. The room board reflects it now.", tone: "ok" });
    if (api && rows) api.setRows(rows());
  }

  function openReservation(id) {
    var b = AZ.booking(id), h = AZ.hotel(b.hotelId), r = AZ.room(b.roomId), g = AZ.guest(b.guestId);
    U.modal({
      title: "Reservation " + b.id,
      wide: true,
      body: '<div class="split" style="gap:20px"><div class="stack">' +
        '<div class="row">' + U.avatar(g ? g.name : "Guest", "lg") +
        "<div><h3 style=\"margin:0\">" + esc(g ? g.name : "Guest") + "</h3>" +
        '<div class="small muted">' + esc(g ? g.email : "") + " · " + esc(g ? g.phone : "") + "</div>" +
        '<div class="small muted">' + esc(g ? g.tier : "") + " member · " + (g ? g.bookings : 0) + " stays</div></div></div>" +
        "<dl class=\"kv\"><dt>Property</dt><dd>" + esc(h.name) + ", " + esc(h.city) + "</dd>" +
        "<dt>Room</dt><dd>" + esc(r.type) + " · room " + esc(r.number) + ", floor " + r.floor + "</dd>" +
        "<dt>Dates</dt><dd>" + U.range(b.checkIn, b.checkOut) + " (" + b.nights + " nights)</dd>" +
        "<dt>Guests</dt><dd>" + b.adults + " adults" + (b.children ? ", " + b.children + " children" : "") + "</dd>" +
        "<dt>Source</dt><dd>" + esc(b.source) + "</dd>" +
        "<dt>Booked</dt><dd>" + U.date(b.createdAt, true) + "</dd>" +
        (b.requests ? "<dt>Requests</dt><dd>" + esc(b.requests) + "</dd>" : "") + "</dl></div>" +
        '<div class="stack"><div class="card card-pad"><h4>Charges</h4>' +
        '<div class="summary-line"><span>Room · ' + b.nights + ' nights</span><span class="mono">' + money(b.roomTotal) + "</span></div>" +
        (b.discount ? '<div class="summary-line"><span>Discount</span><span class="mono">−' + money(b.discount) + "</span></div>" : "") +
        '<div class="summary-line"><span>Taxes</span><span class="mono">' + money(b.taxes) + "</span></div>" +
        '<div class="summary-line"><span>Service fee</span><span class="mono">' + money(b.fee) + "</span></div>" +
        '<div class="summary-line total"><span>Total</span><span class="mono">' + money(b.total) + "</span></div>" +
        '<div class="row between" style="margin-top:10px"><span class="small muted">' + esc(b.method) + "</span>" + U.pill(b.payment) + "</div></div>" +
        '<div class="card card-pad"><h4>Status</h4>' +
        '<div class="field"><label for="rs-status">Reservation status</label><select class="select" id="rs-status">' +
        ["Confirmed", "Pending", "Checked in", "Checked out", "Cancelled", "No-show"].map(function (s) {
          return "<option" + (b.status === s ? " selected" : "") + ">" + s + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field" style="margin-top:10px"><label for="rs-pay">Payment status</label><select class="select" id="rs-pay">' +
        ["Paid", "Pending", "Refunded", "Failed"].map(function (s) {
          return "<option" + (b.payment === s ? " selected" : "") + ">" + s + "</option>";
        }).join("") + "</select></div></div></div></div>",
      foot: '<button class="btn btn-ghost" data-close>Close</button>' +
        '<button class="btn btn-outline" data-print-res>' + I("printer") + "Print</button>" +
        '<button class="btn btn-primary" data-save-res>Save changes</button>',
      onOpen: function (scrim, close) {
        U.qs("[data-print-res]", scrim).addEventListener("click", function () { window.print(); });
        U.qs("[data-save-res]", scrim).addEventListener("click", function () {
          AZ.update("bookings", b.id, {
            status: U.qs("#rs-status", scrim).value,
            payment: U.qs("#rs-pay", scrim).value
          });
          close();
          U.toast("Reservation updated", { tone: "ok" });
          window.Router.reload();
        });
      }
    });
  }

  function newReservation(api, rows) {
    var hotels = AZ.db.hotels;
    U.modal({
      title: "New reservation",
      wide: true,
      body: '<form data-new-res novalidate><div class="form-grid">' +
        U.field({ name: "guest", label: "Guest name", required: true, placeholder: "As it appears on the ID" }) +
        U.field({ name: "email", label: "Email", type: "email", required: true }) +
        U.field({ name: "hotel", label: "Property", type: "select", options: hotels.map(function (h) { return { value: h.id, label: h.name + " · " + h.city }; }) }) +
        U.field({ name: "room", label: "Room", type: "select", options: [] }) +
        U.field({ name: "checkIn", label: "Check in", type: "date", value: today(), required: true }) +
        U.field({ name: "checkOut", label: "Check out", type: "date", value: AZ.iso(AZ.addDays(AZ.TODAY, 2)), required: true }) +
        U.field({ name: "adults", label: "Adults", type: "select", options: [1, 2, 3, 4] }) +
        U.field({ name: "source", label: "Source", type: "select", options: ["Phone", "Walk-in", "Website", "Partner site", "Corporate"] }) +
        U.field({ name: "requests", label: "Notes", type: "textarea", full: true, placeholder: "Anything the desk should know." }) +
        '</div><div class="small muted" style="margin-top:10px" data-res-quote></div></form>',
      foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-create>Create booking</button>',
      onOpen: function (scrim, close) {
        var form = U.qs("[data-new-res]", scrim);
        function fillRooms() {
          var hid = form.elements.hotel.value;
          var free = AZ.roomsOf(hid).filter(function (r) { return AZ.isFree(r.id, form.elements.checkIn.value); });
          form.elements.room.innerHTML = free.map(function (r) {
            return '<option value="' + r.id + '">' + esc(r.number + " · " + r.type + " · " + money(r.price)) + "</option>";
          }).join("") || '<option value="">No rooms free that night</option>';
          quote();
        }
        function quote() {
          var r = AZ.room(form.elements.room.value);
          var box = U.qs("[data-res-quote]", scrim);
          if (!r) { box.textContent = "Pick a property and a free room to price the stay."; return; }
          var q = AZ.quote(r, form.elements.checkIn.value, form.elements.checkOut.value);
          box.innerHTML = "Total <strong>" + money(q.total) + "</strong> for " + q.nights + " nights, taxes and fee included." +
            (q.allFree ? "" : ' <span style="color:var(--danger)">Some nights are already sold.</span>');
        }
        form.addEventListener("change", function (e) {
          if (e.target.name === "hotel" || e.target.name === "checkIn") fillRooms();
          else quote();
        });
        fillRooms();
        U.qs("[data-create]", scrim).addEventListener("click", function () {
          var res = U.validate(form, { guest: "required|min2", email: "required|email", checkIn: "required", checkOut: "required" });
          if (!res.ok) return;
          var r = AZ.room(form.elements.room.value);
          if (!r) { U.toast("No room selected", { tone: "warn", body: "Nothing is free on that date at this property." }); return; }
          var q = AZ.quote(r, form.elements.checkIn.value, form.elements.checkOut.value);
          var parts = res.values.guest.split(" ");
          var guest = {
            id: "AZ-G" + String(AZ.db.guests.length + 1).padStart(4, "0"),
            first: parts[0], last: parts.slice(1).join(" ") || "—", name: res.values.guest,
            email: res.values.email, phone: "", nationality: "Portugal", tier: "Classic",
            preferences: [], joined: today(), bookings: 1, spend: q.total
          };
          AZ.db.guests.push(guest);
          AZ.addBooking({
            guestId: guest.id, hotelId: r.hotelId, roomId: r.id,
            checkIn: form.elements.checkIn.value, checkOut: form.elements.checkOut.value, nights: q.nights,
            adults: +form.elements.adults.value, children: 0, rooms: 1,
            status: "Confirmed", payment: "Pending", method: "Cash at hotel",
            source: form.elements.source.value, roomTotal: q.roomTotal, discount: 0,
            taxes: q.taxes, fee: q.fee, total: q.total, requests: form.elements.requests.value, createdAt: today()
          });
          close();
          U.toast("Reservation created", { body: res.values.guest + " · " + money(q.total), tone: "ok" });
          if (api && rows) api.setRows(rows());
        });
      }
    });
  }

  /* ---------------- rooms ---------------- */

  function rooms() {
    var blocked = guard(); if (blocked) return blocked;
    var hotelId = AZ.db.hotels[0].id;

    var html = '<div class="workbar"><div><h1>Rooms</h1>' +
      '<p class="muted" style="margin:0">Status board and inventory across ' + AZ.db.rooms.length + " rooms</p></div>" +
      '<div class="grow"></div><div class="field"><select class="select" data-hotel>' +
      AZ.db.hotels.map(function (h) { return '<option value="' + h.id + '">' + esc(h.name) + " · " + esc(h.city) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="row"><button class="btn btn-outline btn-sm" data-view="board" aria-pressed="true">' + I("grid") + "Board</button>" +
      '<button class="btn btn-ghost btn-sm" data-view="table">' + I("list") + "Table</button></div></div>" +
      '<div class="card card-pad" style="margin-bottom:16px"><div class="row wrap" style="gap:18px" data-legend></div></div>' +
      '<div data-board></div><div data-table class="hide"></div>';

    return {
      title: "Rooms — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        var tableApi = null;

        function list() { return AZ.roomsOf(hotelId); }

        function drawLegend() {
          var counts = {};
          list().forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
          U.qs("[data-legend]", root).innerHTML = ["Available", "Occupied", "Reserved", "Cleaning", "Maintenance"].map(function (s) {
            return '<div class="row" style="gap:8px"><span class="pill s-' + U.slug(s) + '">' + s + "</span>" +
              '<strong class="mono">' + (counts[s] || 0) + "</strong></div>";
          }).join("") + '<div class="grow"></div><div class="small muted">Occupancy tonight ' +
            Math.round(list().filter(function (r) { return !AZ.isFree(r.id, today()); }).length / list().length * 100) + "%</div>";
        }

        function drawBoard() {
          var byFloor = {};
          list().forEach(function (r) { (byFloor[r.floor] = byFloor[r.floor] || []).push(r); });
          U.qs("[data-board]", root).innerHTML = Object.keys(byFloor).sort(function (a, b) { return b - a; }).map(function (f) {
            return '<div class="floor"><h4>Floor ' + f + " <span></span>" +
              '<span class="small muted">' + byFloor[f].length + " rooms</span></h4>" +
              '<div class="room-grid">' + byFloor[f].map(function (r) {
                var free = AZ.isFree(r.id, today());
                return '<button class="room-tile ' + U.slug(r.status) + '" data-room="' + r.id + '">' +
                  "<b>" + esc(r.number) + "</b><span>" + esc(r.type) + "</span>" +
                  "<span>" + (free ? "free tonight" : "sold tonight") + "</span>" +
                  '<span class="mono">' + money(r.price) + "</span></button>";
              }).join("") + "</div></div>";
          }).join("");
        }

        function drawTable() {
          tableApi = U.table(U.qs("[data-table]", root), {
            rows: list(), noun: "rooms", pageSize: 12, rowId: function (r) { return r.id; },
            searchIn: function (r) { return r.number + " " + r.type + " " + r.view + " " + r.status; },
            searchPlaceholder: "Search room, type or status…",
            onRow: function (id) { openRoom(id, refresh); },
            columns: [
              { key: "number", label: "Room", render: function (r) { return '<span class="mono cell-main">' + esc(r.number) + "</span>"; } },
              { key: "type", label: "Type", render: function (r) { return '<div class="cell-main">' + esc(r.type) + '</div><div class="cell-sub">' + esc(r.beds) + "</div>"; } },
              { key: "floor", label: "Floor" },
              { key: "price", label: "Rate", render: function (r) { return '<span class="mono">' + money(r.price) + "</span>"; } },
              { key: "capacity", label: "Sleeps" },
              { key: "status", label: "Status", render: function (r) { return U.pill(r.status); } },
              { key: "cleaning", label: "Housekeeping" },
              { key: "maintenance", label: "Maintenance", render: function (r) { return r.maintenance === "None" ? '<span class="muted small">—</span>' : esc(r.maintenance); } },
              { key: "actions", label: "", sortable: false, render: function (r) {
                return '<button class="btn btn-ghost btn-sm" data-edit="' + r.id + '">Edit</button>';
              } }
            ],
            afterRender: function (c) {
              U.on(c, "click", "[data-edit]", function (e, b) { openRoom(b.getAttribute("data-edit"), refresh); });
            }
          });
        }

        function refresh() { drawLegend(); drawBoard(); if (tableApi) tableApi.setRows(list()); }

        drawLegend(); drawBoard(); drawTable();

        U.on(root, "change", "[data-hotel]", function (e, el) { hotelId = el.value; refresh(); });
        U.on(root, "click", "[data-room]", function (e, b) { openRoom(b.getAttribute("data-room"), refresh); });
        U.on(root, "click", "[data-view]", function (e, b) {
          var v = b.getAttribute("data-view");
          U.qs("[data-board]", root).classList.toggle("hide", v !== "board");
          U.qs("[data-table]", root).classList.toggle("hide", v === "board");
          U.qsa("[data-view]", root).forEach(function (x) {
            var on = x === b;
            x.className = "btn btn-sm " + (on ? "btn-outline" : "btn-ghost");
            x.setAttribute("aria-pressed", String(on));
          });
        });
      }
    };
  }

  function openRoom(id, after) {
    var r = AZ.room(id), h = AZ.hotel(r.hotelId);
    var upcoming = AZ.db.bookings.filter(function (b) { return b.roomId === r.id && b.checkOut >= today() && b.status !== "Cancelled"; })
      .sort(function (a, b) { return a.checkIn > b.checkIn ? 1 : -1; }).slice(0, 4);
    U.modal({
      title: "Room " + r.number + " · " + h.name,
      wide: true,
      body: '<div class="split" style="gap:20px"><div>' +
        '<div style="border-radius:12px;overflow:hidden;aspect-ratio:16/9;margin-bottom:14px">' + scene(r.id, "room", 0) + "</div>" +
        "<dl class=\"kv\"><dt>Type</dt><dd>" + esc(r.type) + "</dd><dt>Beds</dt><dd>" + esc(r.beds) + "</dd>" +
        "<dt>Sleeps</dt><dd>" + r.capacity + "</dd><dt>Size</dt><dd>" + r.size + " m²</dd>" +
        "<dt>Outlook</dt><dd>" + esc(r.view) + "</dd><dt>Rate</dt><dd class=\"mono\">" + money(r.price) + "</dd></dl>" +
        '<div style="margin-top:14px">' + U.rail(AZ.railFor(r, null, 14), { label: "Next 14 nights", legend: true }) + "</div></div>" +
        '<div class="stack"><form data-room-form class="card card-pad">' +
        U.field({ name: "status", label: "Room status", type: "select", value: r.status,
          options: ["Available", "Occupied", "Reserved", "Cleaning", "Maintenance"] }) +
        '<div style="height:12px"></div>' +
        U.field({ name: "cleaning", label: "Housekeeping", type: "select", value: r.cleaning, options: ["Clean", "Due", "In progress"] }) +
        '<div style="height:12px"></div>' +
        U.field({ name: "price", label: "Base rate", type: "number", value: r.price, hint: "Nightly rates flex from this number by season and weekday." }) +
        '<div style="height:12px"></div>' +
        U.field({ name: "maintenance", label: "Maintenance note", value: r.maintenance }) +
        "</form>" +
        '<div class="card card-pad"><h4>Next arrivals in this room</h4>' +
        (upcoming.length ? upcoming.map(function (b) {
          var g = AZ.guest(b.guestId);
          return '<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)">' +
            "<div><div class=\"small\"><strong>" + esc(g ? g.name : "Guest") + '</strong></div>' +
            '<div class="small muted">' + U.range(b.checkIn, b.checkOut) + "</div></div>" + U.pill(b.status) + "</div>";
        }).join("") : '<p class="small muted">Nothing booked in the next stretch.</p>') + "</div></div></div>",
      foot: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" data-save-room>Save room</button>',
      onOpen: function (scrim, close) {
        U.qs("[data-save-room]", scrim).addEventListener("click", function () {
          var form = U.qs("[data-room-form]", scrim);
          AZ.update("rooms", r.id, {
            status: form.elements.status.value,
            cleaning: form.elements.cleaning.value,
            price: Math.max(20, +form.elements.price.value || r.price),
            maintenance: form.elements.maintenance.value || "None"
          });
          close();
          U.toast("Room " + r.number + " updated", { tone: "ok" });
          if (after) after();
        });
      }
    });
  }

  /* ---------------- guests ---------------- */

  function guests() {
    var blocked = guard(); if (blocked) return blocked;
    var rows = AZ.db.guests.slice().sort(function (a, b) { return b.spend - a.spend; });
    var tiers = ["Classic", "Silver", "Gold", "Platinum"].map(function (t, i) {
      return { label: t, value: rows.filter(function (g) { return g.tier === t; }).length, color: [SLATE, "#94a3b8", AMBER, NAVY][i] };
    });

    var html = '<div class="workbar"><div><h1>Guests</h1>' +
      '<p class="muted" style="margin:0">' + rows.length + " profiles, ranked by lifetime value</p></div></div>" +
      '<div class="grid grid-4" style="gap:14px;margin-bottom:18px">' +
      U.stat({ icon: "users", label: "Guest profiles", value: U.num(rows.length) }) +
      U.stat({ icon: "trend", tone: "green", label: "Lifetime revenue", value: money(rows.reduce(function (a, g) { return a + g.spend; }, 0)) }) +
      U.stat({ icon: "star", tone: "amber", label: "Gold and above", value: rows.filter(function (g) { return g.tier === "Gold" || g.tier === "Platinum"; }).length }) +
      U.stat({ icon: "globe", label: "Nationalities", value: Object.keys(rows.reduce(function (a, g) { a[g.nationality] = 1; return a; }, {})).length }) +
      "</div><div data-table></div>";

    return {
      title: "Guests — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        U.table(U.qs("[data-table]", root), {
          rows: rows, noun: "guests", pageSize: 12, rowId: function (g) { return g.id; },
          searchIn: function (g) { return g.name + " " + g.email + " " + g.nationality + " " + g.id; },
          searchPlaceholder: "Search name, email or nationality…",
          onRow: function (id) { openGuest(id); },
          toolbar: '<div class="row" style="gap:14px">' + tiers.map(function (t) {
            return '<span class="badge"><i style="width:8px;height:8px;border-radius:2px;display:inline-block;background:' +
              t.color + '"></i> ' + t.label + " " + t.value + "</span>";
          }).join("") + "</div>",
          columns: [
            { key: "name", label: "Guest", render: function (g) {
              return '<div class="row" style="gap:8px">' + U.avatar(g.name) +
                '<div><div class="cell-main">' + esc(g.name) + '</div><div class="cell-sub">' + esc(g.email) + "</div></div></div>";
            } },
            { key: "nationality", label: "Nationality" },
            { key: "tier", label: "Tier", render: function (g) { return '<span class="badge badge-' +
              (g.tier === "Platinum" ? "blue" : g.tier === "Gold" ? "amber" : "") + '">' + esc(g.tier) + "</span>"; } },
            { key: "bookings", label: "Stays" },
            { key: "spend", label: "Lifetime spend", render: function (g) { return '<span class="mono">' + money(g.spend) + "</span>"; } },
            { key: "joined", label: "Member since", render: function (g) { return U.date(g.joined); } },
            { key: "actions", label: "", sortable: false, render: function (g) {
              return '<button class="btn btn-ghost btn-sm" data-guest="' + g.id + '">Profile</button>';
            } }
          ],
          afterRender: function (c) {
            U.on(c, "click", "[data-guest]", function (e, b) { openGuest(b.getAttribute("data-guest")); });
          }
        });
      }
    };
  }

  function openGuest(id) {
    var g = AZ.guest(id);
    var history = AZ.bookingsOf(g.id).sort(function (a, b) { return a.checkIn < b.checkIn ? 1 : -1; });
    U.modal({
      title: g.name,
      wide: true,
      body: '<div class="split" style="gap:20px"><div class="stack">' +
        '<div class="row">' + U.avatar(g.name, "lg") +
        "<div><h3 style=\"margin:0\">" + esc(g.name) + '</h3><div class="small muted">' + esc(g.id) + " · " + esc(g.tier) + " member</div></div></div>" +
        "<dl class=\"kv\"><dt>Email</dt><dd>" + esc(g.email) + "</dd><dt>Phone</dt><dd>" + esc(g.phone) + "</dd>" +
        "<dt>Nationality</dt><dd>" + esc(g.nationality) + "</dd><dt>Member since</dt><dd>" + U.date(g.joined, true) + "</dd>" +
        "<dt>Stays</dt><dd>" + g.bookings + "</dd><dt>Lifetime spend</dt><dd class=\"mono\">" + money(g.spend) + "</dd>" +
        "<dt>Preferences</dt><dd>" + (g.preferences.length ? esc(g.preferences.join(", ")) : "None recorded") + "</dd></dl></div>" +
        '<div class="card card-pad"><h4>Booking history</h4>' +
        (history.length ? '<div class="stack" style="gap:0;max-height:320px;overflow:auto">' + history.map(function (b) {
          return '<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--border)">' +
            "<div><div class=\"small\"><strong>" + esc(AZ.hotel(b.hotelId).name) + '</strong></div>' +
            '<div class="small muted">' + U.range(b.checkIn, b.checkOut) + " · " + esc(b.id) + "</div></div>" +
            '<div class="right">' + U.pill(b.status) + '<div class="mono small">' + money(b.total) + "</div></div></div>";
        }).join("") + "</div>" : '<p class="small muted">No bookings on file.</p>') + "</div></div>",
      foot: '<button class="btn btn-ghost" data-close>Close</button>' +
        '<a class="btn btn-outline" href="mailto:' + esc(g.email) + '">' + I("mail") + "Email guest</a>"
    });
  }

  /* ---------------- payments ---------------- */

  function payments() {
    var blocked = guard(); if (blocked) return blocked;
    var rows = AZ.db.payments;
    var paid = rows.filter(function (p) { return p.status === "Paid"; });
    var byMethod = {};
    rows.forEach(function (p) { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });

    var html = '<div class="workbar"><div><h1>Payments</h1>' +
      '<p class="muted" style="margin:0">Invoices, refunds and settlement</p></div>' +
      '<div class="grow"></div><button class="btn btn-outline btn-sm" data-export>' + I("download") + "Export CSV</button></div>" +
      '<div class="grid grid-4" style="gap:14px;margin-bottom:18px">' +
      U.stat({ icon: "creditCard", tone: "green", label: "Collected", value: money(paid.reduce(function (a, p) { return a + p.amount; }, 0)) }) +
      U.stat({ icon: "clock", tone: "amber", label: "Outstanding", value: money(rows.filter(function (p) { return p.status === "Pending"; }).reduce(function (a, p) { return a + p.amount; }, 0)) }) +
      U.stat({ icon: "refresh", tone: "red", label: "Refunded", value: money(rows.reduce(function (a, p) { return a + p.refund; }, 0)) }) +
      U.stat({ icon: "receipt", label: "Invoices", value: rows.length }) +
      "</div>" +
      '<div class="card chart-card" style="margin-bottom:18px"><h4>Value by payment method</h4>' +
      '<div class="chart-wrap">' + C.hbars(Object.keys(byMethod).map(function (m, i) {
        return { label: m, value: Math.round(byMethod[m]), color: [NAVY, BLUE, AMBER, GREEN][i % 4] };
      }), { fmt: function (v) { return money(v); } }) + "</div></div>" +
      "<div data-table></div>";

    return {
      title: "Payments — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        var api = U.table(U.qs("[data-table]", root), {
          rows: rows, noun: "invoices", pageSize: 12, rowId: function (p) { return p.id; },
          searchIn: function (p) { var g = AZ.guest(p.guestId); return p.id + " " + p.bookingId + " " + (g ? g.name : "") + " " + p.method; },
          searchPlaceholder: "Search invoice, booking or guest…",
          columns: [
            { key: "id", label: "Invoice", render: function (p) { return '<span class="mono">' + esc(p.id) + "</span>"; } },
            { key: "guestId", label: "Guest", value: function (p) { var g = AZ.guest(p.guestId); return g ? g.name : ""; },
              render: function (p) { var g = AZ.guest(p.guestId); return esc(g ? g.name : "—"); } },
            { key: "bookingId", label: "Booking", render: function (p) { return '<span class="mono small">' + esc(p.bookingId) + "</span>"; } },
            { key: "method", label: "Method" },
            { key: "amount", label: "Amount", render: function (p) { return '<span class="mono">' + money(p.amount) + "</span>"; } },
            { key: "status", label: "Status", render: function (p) { return U.pill(p.status); } },
            { key: "refund", label: "Refund", render: function (p) { return p.refund ? '<span class="mono">' + money(p.refund) + "</span>" : '<span class="muted">—</span>'; } },
            { key: "date", label: "Date", render: function (p) { return U.date(p.date); } },
            { key: "actions", label: "", sortable: false, render: function (p) {
              return p.status === "Paid" ? '<button class="btn btn-ghost btn-sm" data-refund="' + p.id + '">Refund</button>' : "";
            } }
          ],
          afterRender: function (c) {
            U.on(c, "click", "[data-refund]", function (e, b) {
              var p = AZ.payment(b.getAttribute("data-refund"));
              U.confirm({
                title: "Refund " + p.id + "?", danger: true, confirm: "Issue refund",
                body: "This marks " + money(p.amount) + " as refunded and updates the linked booking. Card refunds take 3–5 working days.",
                onConfirm: function () {
                  AZ.update("payments", p.id, { status: "Refunded", refund: p.amount });
                  AZ.update("bookings", p.bookingId, { payment: "Refunded", status: "Cancelled" });
                  U.toast("Refund issued", { body: money(p.amount) + " back to the guest.", tone: "ok" });
                  api.setRows(AZ.db.payments);
                }
              });
            });
          }
        });

        U.on(root, "click", "[data-export]", function () {
          var csv = "invoice,booking,guest,method,amount,status,date\n" + rows.map(function (p) {
            var g = AZ.guest(p.guestId);
            return [p.id, p.bookingId, (g ? g.name : "").replace(/,/g, " "), p.method, p.amount, p.status, p.date].join(",");
          }).join("\n");
          var url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
          var a = document.createElement("a");
          a.href = url; a.download = "azure-stay-payments.csv"; a.click();
          URL.revokeObjectURL(url);
          U.toast("CSV exported", { body: rows.length + " invoices.", tone: "ok" });
        });
      }
    };
  }

  /* ---------------- reviews ---------------- */

  function reviews() {
    var blocked = guard(); if (blocked) return blocked;
    var filter = "Pending";

    function list() { return AZ.db.reviews.filter(function (r) { return !filter || r.status === filter; }); }

    var html = '<div class="workbar"><div><h1>Reviews</h1>' +
      '<p class="muted" style="margin:0">Approve, hide or reply. Approved reviews feed the property score.</p></div></div>' +
      '<div class="tabs" style="margin-bottom:18px">' +
      [["Pending", "Pending"], ["Approved", "Approved"], ["Hidden", "Hidden"], ["", "All"]].map(function (t, i) {
        return '<button data-filter="' + t[0] + '"' + (i === 0 ? ' class="active"' : "") + ">" + t[1] +
          " (" + (t[0] ? AZ.db.reviews.filter(function (r) { return r.status === t[0]; }).length : AZ.db.reviews.length) + ")</button>";
      }).join("") + "</div><div data-list></div>";

    return {
      title: "Reviews — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        function draw() {
          var rows = list();
          U.qs("[data-list]", root).innerHTML = rows.length ? '<div class="stack">' + rows.slice(0, 30).map(function (r) {
            var g = AZ.guest(r.guestId), h = AZ.hotel(r.hotelId);
            return '<article class="card card-pad"><div class="row between wrap">' +
              '<div class="row">' + U.avatar(g ? g.name : "Guest") +
              "<div><div><strong>" + esc(g ? g.name : "Guest") + "</strong> · " + esc(h.name) + "</div>" +
              '<div class="small muted">' + U.date(r.date, true) + " · " + esc(r.id) + "</div></div></div>" +
              '<div class="row">' + U.pill(r.status) + '<span class="score">' + r.rating.toFixed(1) + "</span></div></div>" +
              "<h4 style=\"margin:12px 0 4px\">" + esc(r.title) + '</h4><p class="small" style="margin:0">' + esc(r.body) + "</p>" +
              (r.reply ? '<div class="reply"><strong>Reply</strong><br>' + esc(r.reply) + "</div>" : "") +
              '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
              (r.status !== "Approved" ? '<button class="btn btn-outline btn-sm" data-approve="' + r.id + '">' + I("check") + "Approve</button>" : "") +
              (r.status !== "Hidden" ? '<button class="btn btn-ghost btn-sm" data-hide="' + r.id + '">' + I("eyeOff") + "Hide</button>" : "") +
              '<button class="btn btn-ghost btn-sm" data-reply="' + r.id + '">' + I("message") + (r.reply ? "Edit reply" : "Reply") + "</button>" +
              '<button class="btn btn-ghost btn-sm" data-del="' + r.id + '" style="color:var(--danger)">' + I("trash") + "Delete</button>" +
              "</div></article>";
          }).join("") + "</div>"
            : U.empty("Nothing in this queue", "Reviews land here as guests check out and write them.");
        }
        draw();

        U.on(root, "click", "[data-filter]", function (e, b) {
          filter = b.getAttribute("data-filter");
          U.qsa("[data-filter]", root).forEach(function (x) { x.classList.toggle("active", x === b); });
          draw();
        });
        U.on(root, "click", "[data-approve]", function (e, b) {
          AZ.update("reviews", b.getAttribute("data-approve"), { status: "Approved" });
          U.toast("Review approved", { body: "It is live on the property page.", tone: "ok" });
          draw();
        });
        U.on(root, "click", "[data-hide]", function (e, b) {
          AZ.update("reviews", b.getAttribute("data-hide"), { status: "Hidden" });
          U.toast("Review hidden", { tone: "" });
          draw();
        });
        U.on(root, "click", "[data-del]", function (e, b) {
          var id = b.getAttribute("data-del");
          U.confirm({
            title: "Delete this review?", danger: true, confirm: "Delete",
            body: "Deleting is permanent and removes the score from the property average. Hiding is usually the better call.",
            onConfirm: function () { AZ.remove("reviews", id); U.toast("Review deleted", { tone: "" }); draw(); }
          });
        });
        U.on(root, "click", "[data-reply]", function (e, b) {
          var r = AZ.review(b.getAttribute("data-reply"));
          U.modal({
            title: "Reply to " + (AZ.guest(r.guestId) || {}).name,
            body: '<p class="small muted">Replies appear under the review on the property page. Keep it specific and short.</p>' +
              '<form data-reply-form>' + U.field({ name: "reply", label: "Your reply", type: "textarea", value: r.reply, required: true }) + "</form>",
            foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-send>Publish reply</button>',
            onOpen: function (scrim, close) {
              U.qs("[data-send]", scrim).addEventListener("click", function () {
                var form = U.qs("[data-reply-form]", scrim);
                var res = U.validate(form, { reply: "required|min2" });
                if (!res.ok) return;
                AZ.update("reviews", r.id, { reply: res.values.reply });
                close(); U.toast("Reply published", { tone: "ok" }); draw();
              });
            }
          });
        });
      }
    };
  }

  /* ---------------- promotions ---------------- */

  function promotions() {
    var blocked = guard(); if (blocked) return blocked;
    var rows = AZ.db.promotions;

    var html = '<div class="workbar"><div><h1>Promotions</h1>' +
      '<p class="muted" style="margin:0">Coupons, seasonal rates, flash sales and packages</p></div>' +
      '<div class="grow"></div><button class="btn btn-primary btn-sm" data-new-promo>' + I("plus") + "New promotion</button></div>" +
      '<div class="grid grid-4" style="gap:14px;margin-bottom:18px">' +
      ["Active", "Scheduled", "Expired"].map(function (s) {
        return U.stat({ icon: "tag", tone: s === "Active" ? "green" : s === "Scheduled" ? "" : "red", label: s,
          value: rows.filter(function (p) { return p.status === s; }).length });
      }).join("") +
      U.stat({ icon: "sparkles", tone: "amber", label: "Redemptions", value: U.num(rows.reduce(function (a, p) { return a + p.used; }, 0)) }) +
      "</div><div data-table></div>";

    return {
      title: "Promotions — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        var api = U.table(U.qs("[data-table]", root), {
          rows: rows, noun: "promotions", pageSize: 10, rowId: function (p) { return p.id; },
          searchIn: function (p) { return p.code + " " + p.name + " " + p.kind + " " + p.status; },
          searchPlaceholder: "Search code or name…",
          columns: [
            { key: "code", label: "Code", render: function (p) { return '<span class="mono cell-main">' + esc(p.code) + "</span>"; } },
            { key: "name", label: "Name", render: function (p) { return '<div class="cell-main">' + esc(p.name) + '</div><div class="cell-sub">' + esc(p.kind) + "</div>"; } },
            { key: "value", label: "Discount", render: function (p) { return p.unit === "%" ? p.value + "%" : money(p.value); } },
            { key: "minNights", label: "Min nights" },
            { key: "start", label: "Window", value: function (p) { return p.start; },
              render: function (p) { return '<span class="mono small">' + p.start + " → " + p.end + "</span>"; } },
            { key: "used", label: "Used", render: function (p) {
              return '<div style="min-width:110px">' + U.progress(p.used / p.cap * 100, p.used / p.cap > 0.85 ? "amber" : "") +
                '<div class="cell-sub mono">' + p.used + " / " + p.cap + "</div></div>";
            } },
            { key: "status", label: "Status", render: function (p) { return U.pill(p.status); } },
            { key: "actions", label: "", sortable: false, render: function (p) {
              return '<div class="row" style="gap:4px"><button class="btn btn-ghost btn-sm" data-edit-promo="' + p.id + '">Edit</button>' +
                '<button class="btn btn-ghost btn-sm" data-del-promo="' + p.id + '" style="color:var(--danger)">' + I("trash") + "</button></div>";
            } }
          ],
          afterRender: function (c) {
            U.on(c, "click", "[data-edit-promo]", function (e, b) { promoForm(AZ.promo(b.getAttribute("data-edit-promo")), api); });
            U.on(c, "click", "[data-del-promo]", function (e, b) {
              var id = b.getAttribute("data-del-promo");
              U.confirm({
                title: "Delete promotion?", danger: true, confirm: "Delete",
                body: "Guests who already used " + AZ.promo(id).code + " keep their discount. New bookings will not find it.",
                onConfirm: function () { AZ.remove("promotions", id); api.setRows(AZ.db.promotions); U.toast("Promotion deleted", { tone: "" }); }
              });
            });
          }
        });
        U.on(root, "click", "[data-new-promo]", function () { promoForm(null, api); });
      }
    };
  }

  function promoForm(p, api) {
    var isNew = !p;
    p = p || { code: "", name: "", kind: "Coupon", value: 10, unit: "%", minNights: 1,
      start: today(), end: AZ.iso(AZ.addDays(AZ.TODAY, 30)), used: 0, cap: 300, status: "Active" };
    U.modal({
      title: isNew ? "New promotion" : "Edit " + p.code,
      body: '<form data-promo novalidate><div class="form-grid">' +
        U.field({ name: "code", label: "Code", required: true, value: p.code, placeholder: "STAY15", hint: "Guests type this at payment." }) +
        U.field({ name: "name", label: "Name", required: true, value: p.name }) +
        U.field({ name: "kind", label: "Type", type: "select", value: p.kind, options: ["Coupon", "Seasonal", "Flash sale", "Weekend offer", "Holiday package"] }) +
        U.field({ name: "unit", label: "Discount unit", type: "select", value: p.unit, options: ["%", "USD"] }) +
        U.field({ name: "value", label: "Discount value", type: "number", value: p.value, required: true }) +
        U.field({ name: "minNights", label: "Minimum nights", type: "number", value: p.minNights }) +
        U.field({ name: "start", label: "Starts", type: "date", value: p.start }) +
        U.field({ name: "end", label: "Ends", type: "date", value: p.end }) +
        U.field({ name: "cap", label: "Redemption cap", type: "number", value: p.cap }) +
        U.field({ name: "status", label: "Status", type: "select", value: p.status, options: ["Active", "Scheduled", "Expired"] }) +
        "</div></form>",
      foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-save-promo>' +
        (isNew ? "Create promotion" : "Save changes") + "</button>",
      onOpen: function (scrim, close) {
        U.qs("[data-save-promo]", scrim).addEventListener("click", function () {
          var form = U.qs("[data-promo]", scrim);
          var res = U.validate(form, { code: "required|min2", name: "required|min2", value: "required" });
          if (!res.ok) return;
          var patch = {
            code: res.values.code.toUpperCase(), name: res.values.name, kind: form.elements.kind.value,
            unit: form.elements.unit.value, value: +form.elements.value.value, minNights: +form.elements.minNights.value,
            start: form.elements.start.value, end: form.elements.end.value, cap: +form.elements.cap.value,
            status: form.elements.status.value
          };
          if (isNew) {
            patch.id = "AZ-P" + String(AZ.db.promotions.length + 1).padStart(3, "0");
            patch.used = 0;
            AZ.db.promotions.unshift(patch);
            AZ.save();
          } else {
            AZ.update("promotions", p.id, patch);
          }
          close();
          U.toast(isNew ? "Promotion created" : "Promotion saved", { body: patch.code, tone: "ok" });
          if (api) api.setRows(AZ.db.promotions);
        });
      }
    });
  }

  /* ---------------- staff + roles ---------------- */

  function staff() {
    var blocked = guard(); if (blocked) return blocked;
    var rows = AZ.db.staff;
    var html = '<div class="workbar"><div><h1>Staff</h1>' +
      '<p class="muted" style="margin:0">Who is on the rota and what they can reach</p></div>' +
      '<div class="grow"></div><a class="btn btn-outline btn-sm" href="#/admin/roles">' + I("shield") + "Roles and permissions</a></div>" +
      "<div data-table></div>";
    return {
      title: "Staff — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        U.table(U.qs("[data-table]", root), {
          rows: rows, noun: "team members", pageSize: 10, rowId: function (s) { return s.id; },
          searchIn: function (s) { return s.name + " " + s.role + " " + s.email; },
          searchPlaceholder: "Search name or role…",
          columns: [
            { key: "name", label: "Name", render: function (s) {
              return '<div class="row" style="gap:8px">' + U.avatar(s.name) +
                '<div><div class="cell-main">' + esc(s.name) + '</div><div class="cell-sub">' + esc(s.email) + "</div></div></div>";
            } },
            { key: "role", label: "Role" },
            { key: "hotelId", label: "Based at", value: function (s) { return AZ.hotel(s.hotelId).name; },
              render: function (s) { return esc(AZ.hotel(s.hotelId).name); } },
            { key: "shift", label: "Shift", render: function (s) { return '<span class="mono small">' + esc(s.shift) + "</span>"; } },
            { key: "since", label: "Started", render: function (s) { return U.date(s.since, true); } },
            { key: "status", label: "Status", render: function (s) { return U.pill(s.status); } }
          ]
        });
      }
    };
  }

  function roles() {
    var blocked = guard(); if (blocked) return blocked;
    var perms = ["Reservations", "Room board", "Guest data", "Payments and refunds", "Promotions", "Reviews", "Staff", "Settings"];
    var matrix = {
      Administrator: [1, 1, 1, 1, 1, 1, 1, 1],
      "Front Office Manager": [1, 1, 1, 1, 1, 1, 0, 0],
      Receptionist: [1, 1, 1, 0, 0, 0, 0, 0],
      Housekeeping: [0, 1, 0, 0, 0, 0, 0, 0],
      "Revenue Manager": [1, 1, 0, 1, 1, 0, 0, 0]
    };
    var html = '<div class="workbar"><div><h1>Roles and permissions</h1>' +
      '<p class="muted" style="margin:0">What each role can open in the console</p></div></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Role</th>' +
      perms.map(function (p) { return "<th>" + esc(p) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      Object.keys(matrix).map(function (role) {
        return "<tr><td><strong>" + esc(role) + "</strong></td>" + matrix[role].map(function (v) {
          return '<td>' + (v ? '<span style="color:var(--success)">' + I("check") + "</span>"
            : '<span class="muted">' + I("minus") + "</span>") + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>" +
      '<div class="card card-pad" style="margin-top:18px"><h4>How access is decided</h4>' +
      '<p class="small muted" style="margin:0">Roles are assigned per property. A receptionist at Lisbon cannot open the Kyoto room board. ' +
      "Payments and refunds are the only actions that require a manager role at every property.</p></div>";
    return { title: "Roles — Azure Stay staff", layout: "admin", html: html, mount: function () {} };
  }

  /* ---------------- analytics ---------------- */

  function analytics() {
    var blocked = guard(); if (blocked) return blocked;
    var months = AZ.revenueByMonth(12);
    var occ = AZ.occupancySeries(30);
    var live = AZ.db.bookings.filter(function (b) { return b.status !== "Cancelled"; });
    var adr = months.map(function (m) {
      var set = live.filter(function (b) { return b.checkIn.slice(0, 7) === m.key; });
      var nights = set.reduce(function (a, b) { return a + b.nights; }, 0);
      var rev = set.reduce(function (a, b) { return a + b.roomTotal; }, 0);
      return { label: m.label, value: nights ? Math.round(rev / nights) : 0 };
    });
    var revpar = adr.map(function (a, i) {
      return { label: a.label, value: Math.round(a.value * (0.52 + AZ.rnd("revpar" + i) * 0.34)) };
    });
    var countries = {};
    AZ.db.guests.forEach(function (g) { countries[g.nationality] = (countries[g.nationality] || 0) + 1; });
    var topCountries = Object.keys(countries).map(function (c) { return { label: c, value: countries[c] }; })
      .sort(function (a, b) { return b.value - a.value; }).slice(0, 8);

    var sources = ["Website", "Mobile app", "Partner site", "Phone", "Walk-in", "Corporate"];
    var stackedCfg = {
      labels: months.slice(-6).map(function (m) { return m.label; }),
      series: sources.map(function (s, i) {
        return {
          name: s, color: [NAVY, BLUE, "#60a5fa", AMBER, GREEN, SLATE][i],
          values: months.slice(-6).map(function (m) {
            return live.filter(function (b) { return b.checkIn.slice(0, 7) === m.key && b.source === s; }).length;
          })
        };
      })
    };

    var html = '<div class="workbar"><div><h1>Analytics</h1>' +
      '<p class="muted" style="margin:0">Rolling twelve months across the group</p></div>' +
      '<div class="grow"></div><button class="btn btn-outline btn-sm" data-print>' + I("printer") + "Print</button></div>" +

      '<div class="grid grid-4" style="gap:14px;margin-bottom:18px">' +
      U.stat({ icon: "trend", tone: "green", label: "Revenue, 12 months", value: money(months.reduce(function (a, m) { return a + m.value; }, 0)) }) +
      U.stat({ icon: "bed", label: "Average daily rate", value: money(adr.reduce(function (a, x) { return a + x.value; }, 0) / adr.length) }) +
      U.stat({ icon: "chart", tone: "amber", label: "RevPAR", value: money(revpar.reduce(function (a, x) { return a + x.value; }, 0) / revpar.length) }) +
      U.stat({ icon: "users", label: "Average stay", value: (live.reduce(function (a, b) { return a + b.nights; }, 0) / live.length).toFixed(1) + " nights" }) +
      "</div>" +

      '<div class="split"><div class="card chart-card"><h4>Revenue</h4>' +
      '<div class="chart-wrap">' + C.area(months, { color: NAVY, fmt: function (v) { return money(v); } }) + "</div></div>" +
      '<div class="card chart-card"><h4>Occupancy, 30 days</h4>' +
      '<div class="chart-wrap">' + C.area(occ, { color: BLUE, fmt: function (v) { return Math.round(v) + "%"; } }) + "</div></div></div>" +

      '<div class="split" style="margin-top:20px"><div class="card chart-card"><h4>Average daily rate</h4>' +
      '<div class="chart-wrap">' + C.bars(adr, { color: AMBER, fmt: function (v) { return money(v); } }) + "</div></div>" +
      '<div class="card chart-card"><h4>Revenue per available room</h4>' +
      '<div class="chart-wrap">' + C.bars(revpar, { color: GREEN, fmt: function (v) { return money(v); } }) + "</div></div></div>" +

      '<div class="card chart-card" style="margin-top:20px"><h4>Bookings by source, last six months</h4>' +
      '<div class="chart-wrap">' + C.stacked(stackedCfg) + "</div>" +
      '<div class="legend">' + stackedCfg.series.map(function (s) {
        return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "</span>";
      }).join("") + "</div></div>" +

      '<div class="split" style="margin-top:20px"><div class="card chart-card"><h4>Where guests come from</h4>' +
      '<div class="chart-wrap">' + C.hbars(topCountries, { color: BLUE }) + "</div></div>" +
      '<div class="card chart-card"><h4>Reservations per month</h4>' +
      '<div class="chart-wrap">' + C.bars(months.map(function (m) { return { label: m.label, value: m.count }; }), { color: NAVY }) + "</div></div></div>";

    return {
      title: "Analytics — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) { U.on(root, "click", "[data-print]", function () { window.print(); }); }
    };
  }

  /* ---------------- reports ---------------- */

  function reports() {
    var blocked = guard(); if (blocked) return blocked;
    var defs = [
      ["Revenue report", "chart", "Booked and collected revenue by property and month."],
      ["Occupancy report", "bed", "Rooms sold against rooms available, night by night."],
      ["Guest report", "users", "Profiles, nationality mix and lifetime value."],
      ["Booking report", "calendar", "Every reservation in the period with status and source."],
      ["Payment report", "creditCard", "Invoices, refunds and outstanding balances."],
      ["Room performance", "grid", "Revenue and nights sold per room, ranked."]
    ];
    var html = '<div class="workbar"><div><h1>Reports</h1>' +
      '<p class="muted" style="margin:0">Generate, preview, print or export</p></div></div>' +
      '<div class="card card-pad" style="margin-bottom:18px"><div class="row wrap" style="gap:12px">' +
      '<div class="field"><label for="r-from">From</label><input class="input" id="r-from" type="date" value="' +
      AZ.iso(AZ.addDays(AZ.TODAY, -30)) + '"></div>' +
      '<div class="field"><label for="r-to">To</label><input class="input" id="r-to" type="date" value="' + today() + '"></div>' +
      '<div class="field grow"><label for="r-hotel">Property</label><select class="select" id="r-hotel">' +
      ['<option value="">All properties</option>'].concat(AZ.db.hotels.map(function (h) {
        return '<option value="' + h.id + '">' + esc(h.name) + "</option>";
      })).join("") + "</select></div></div></div>" +
      '<div class="grid grid-3">' + defs.map(function (d) {
        return '<div class="card card-pad stack"><div class="stat" style="padding:0"><div class="ico">' + I(d[1]) + "</div>" +
          "<div><h4 style=\"margin:0\">" + esc(d[0]) + '</h4><p class="small muted" style="margin:4px 0 0">' + esc(d[2]) + "</p></div></div>" +
          '<div class="row"><button class="btn btn-outline btn-sm" data-report="' + esc(d[0]) + '">Generate</button>' +
          '<button class="btn btn-ghost btn-sm" data-csv="' + esc(d[0]) + '">' + I("download") + "CSV</button></div></div>";
      }).join("") + "</div>";

    return {
      title: "Reports — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        function period() {
          return { from: U.qs("#r-from", root).value, to: U.qs("#r-to", root).value, hotel: U.qs("#r-hotel", root).value };
        }
        function rowsFor(p) {
          return AZ.db.bookings.filter(function (b) {
            return b.checkIn >= p.from && b.checkIn <= p.to && (!p.hotel || b.hotelId === p.hotel);
          });
        }
        U.on(root, "click", "[data-report]", function (e, b) {
          var name = b.getAttribute("data-report"), p = period(), set = rowsFor(p);
          var rev = set.reduce(function (a, x) { return x.status !== "Cancelled" ? a + x.total : a; }, 0);
          var nights = set.reduce(function (a, x) { return a + x.nights; }, 0);
          U.modal({
            title: name, wide: true,
            body: '<p class="small muted">' + U.date(p.from, true) + " to " + U.date(p.to, true) +
              (p.hotel ? " · " + esc(AZ.hotel(p.hotel).name) : " · all properties") + "</p>" +
              '<div class="grid grid-3" style="gap:12px;margin:14px 0">' +
              U.stat({ icon: "calendar", label: "Reservations", value: set.length }) +
              U.stat({ icon: "trend", tone: "green", label: "Revenue", value: money(rev) }) +
              U.stat({ icon: "bed", tone: "amber", label: "Room nights", value: nights }) + "</div>" +
              '<div class="table-wrap"><table class="data"><thead><tr><th>Reference</th><th>Property</th><th>Dates</th>' +
              "<th>Status</th><th>Total</th></tr></thead><tbody>" +
              (set.length ? set.slice(0, 40).map(function (x) {
                return "<tr><td class=\"mono small\">" + esc(x.id) + "</td><td>" + esc(AZ.hotel(x.hotelId).name) + "</td>" +
                  "<td class=\"mono small\">" + x.checkIn + " → " + x.checkOut + "</td><td>" + U.pill(x.status) + "</td>" +
                  "<td class=\"mono\">" + money(x.total) + "</td></tr>";
              }).join("") : '<tr><td colspan="5" class="center muted">No reservations in this window.</td></tr>') +
              "</tbody></table></div>",
            foot: '<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-primary" data-print-r>' +
              I("printer") + "Print report</button>",
            onOpen: function (scrim) {
              U.qs("[data-print-r]", scrim).addEventListener("click", function () { window.print(); });
            }
          });
        });
        U.on(root, "click", "[data-csv]", function (e, b) {
          var p = period(), set = rowsFor(p);
          var csv = "reference,property,room,check_in,check_out,nights,status,payment,total\n" + set.map(function (x) {
            return [x.id, AZ.hotel(x.hotelId).name.replace(/,/g, " "), AZ.room(x.roomId).number, x.checkIn, x.checkOut,
              x.nights, x.status, x.payment, x.total].join(",");
          }).join("\n");
          var url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
          var a = document.createElement("a");
          a.href = url; a.download = U.slug(b.getAttribute("data-csv")) + ".csv"; a.click();
          URL.revokeObjectURL(url);
          U.toast("Report exported", { body: set.length + " rows.", tone: "ok" });
        });
      }
    };
  }

  /* ---------------- settings ---------------- */

  function settings() {
    var blocked = guard(); if (blocked) return blocked;
    var h = AZ.db.hotels[0];
    var html = '<div class="workbar"><div><h1>Settings</h1>' +
      '<p class="muted" style="margin:0">Property details, tax, currency and messaging</p></div></div>' +
      '<div class="split"><div class="stack">' +
      '<form class="card card-pad" data-hotel-form><h3>Property information</h3>' +
      '<div class="form-grid" style="margin-top:12px">' +
      U.field({ name: "name", label: "Property", value: h.name, full: true }) +
      U.field({ name: "address", label: "Address", value: h.address, full: true }) +
      U.field({ name: "checkIn", label: "Check-in from", value: h.checkIn }) +
      U.field({ name: "checkOut", label: "Check-out by", value: h.checkOut }) +
      U.field({ name: "type", label: "Property type", type: "select", value: h.type, options: AZ.db.propertyTypes }) +
      U.field({ name: "stars", label: "Star rating", type: "select", value: h.stars, options: [1, 2, 3, 4, 5] }) +
      '</div><div class="row end" style="margin-top:14px"><button class="btn btn-primary" type="submit">Save property</button></div></form>' +

      '<div class="card card-pad"><h3>Tax and fees</h3><div class="form-grid" style="margin-top:12px">' +
      U.field({ name: "vat", label: "Accommodation tax", value: "10%", hint: "Applied to the room total after discount." }) +
      U.field({ name: "service", label: "Service fee", value: "5%" }) +
      U.field({ name: "city", label: "City tourist tax", value: "2.00 per person per night", full: true, hint: "Collected at the desk, shown on the property page." }) +
      "</div></div>" +

      '<div class="card card-pad"><h3>Currencies and languages</h3><div class="form-grid" style="margin-top:12px">' +
      U.field({ name: "baseCur", label: "Base currency", type: "select", value: "USD", options: ["USD", "EUR", "GBP", "JPY"] }) +
      U.field({ name: "displayCur", label: "Guest display currencies", type: "select", value: "USD, EUR, GBP", options: ["USD, EUR, GBP", "USD only", "All supported"] }) +
      U.field({ name: "langs", label: "Site languages", type: "select", value: "English, Português", full: true,
        options: ["English", "English, Português", "English, Português, 日本語"] }) +
      "</div></div>" +

      '<div class="card card-pad"><h3>Email templates</h3>' +
      '<div class="stack" style="gap:0;margin-top:8px">' +
      [["Booking confirmation", "Sent immediately after payment"],
       ["Pre-arrival", "72 hours before check-in"],
       ["Receipt", "Morning after check-out"],
       ["Review request", "Three days after check-out"],
       ["Cancellation", "On cancellation, with refund detail"]].map(function (t) {
        return '<div class="row between" style="padding:11px 0;border-bottom:1px solid var(--border)">' +
          "<div><div><strong>" + esc(t[0]) + '</strong></div><div class="small muted">' + esc(t[1]) + "</div></div>" +
          '<button class="btn btn-ghost btn-sm" data-template="' + esc(t[0]) + '">' + I("edit") + "Edit</button></div>";
      }).join("") + "</div></div></div>" +

      '<aside class="stack"><div class="card card-pad"><h4>Notifications</h4>' +
      '<div class="stack" style="margin-top:10px">' +
      [["New booking", true], ["Cancellation", true], ["Payment failure", true], ["Review submitted", false], ["Maintenance flag", true]]
        .map(function (n) {
          return '<label class="check"><input type="checkbox" ' + (n[1] ? "checked" : "") + "> <span>" + esc(n[0]) + "</span></label>";
        }).join("") + "</div></div>" +
      '<div class="card card-pad"><h4>Signed in</h4><dl class="kv">' +
      "<dt>User</dt><dd>" + esc(Store.state.user.name) + "</dd>" +
      "<dt>Role</dt><dd>" + esc(Store.state.user.role === "admin" ? "Administrator" : "Front desk") + "</dd>" +
      "<dt>Properties</dt><dd>" + AZ.db.hotels.length + "</dd></dl>" +
      '<button class="btn btn-outline btn-block" style="margin-top:12px" data-reset>' + I("refresh") + "Reset demo data</button></div></aside></div>";

    return {
      title: "Settings — Azure Stay staff", layout: "admin", html: html,
      mount: function (root) {
        U.qs("[data-hotel-form]", root).addEventListener("submit", function (e) {
          e.preventDefault();
          var f = e.target;
          AZ.update("hotels", h.id, {
            name: f.elements.name.value, address: f.elements.address.value,
            checkIn: f.elements.checkIn.value, checkOut: f.elements.checkOut.value,
            type: f.elements.type.value, stars: +f.elements.stars.value
          });
          U.toast("Property saved", { body: f.elements.name.value + " updated.", tone: "ok" });
        });
        U.on(root, "click", "[data-template]", function (e, b) {
          var name = b.getAttribute("data-template");
          U.modal({
            title: name,
            body: '<form><div class="field"><label for="tpl-sub">Subject</label>' +
              '<input class="input" id="tpl-sub" value="' + esc(name === "Booking confirmation" ? "Your stay at {{hotel}} is confirmed" : name + " · {{hotel}}") + '"></div>' +
              '<div class="field" style="margin-top:12px"><label for="tpl-body">Body</label>' +
              '<textarea class="input" id="tpl-body" style="min-height:180px">Hi {{first_name}},\n\n' +
              "Your booking {{reference}} at {{hotel}} is confirmed for {{check_in}} to {{check_out}}.\n\n" +
              "Room: {{room_type}}\nTotal: {{total}}\n\nThe desk is staffed 24 hours if anything changes.\n\nAzure Stay</textarea></div>" +
              '<p class="small muted" style="margin-top:10px">Placeholders in double braces are filled per guest.</p></form>',
            foot: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-close>Save template</button>'
          });
        });
        U.on(root, "click", "[data-reset]", function () {
          U.confirm({
            title: "Reset the demo data?", danger: true, confirm: "Reset everything",
            body: "Regenerates all properties, rooms, guests and bookings from the seed.",
            onConfirm: function () { AZ.reset(); }
          });
        });
      }
    };
  }

  window.PagesAdmin = {
    dashboard: dashboard, reservations: reservations, rooms: rooms, guests: guests,
    payments: payments, reviews: reviews, promotions: promotions, staff: staff, roles: roles,
    analytics: analytics, reports: reports, settings: settings
  };
})();
