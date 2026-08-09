/* Azure Stay — shared UI: formatting, cards, the rate rail, tables, modals,
   toasts, calendars and form validation. Everything returns markup strings so
   pages stay declarative. */
(function () {
  "use strict";
  var AZ = window.AZ, I = window.Icons.icon, scene = window.Icons.scene;

  /* ---------- formatting ---------- */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n, cur) {
    var symbol = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" }[cur || (window.Store && Store.state.settings.currency) || "USD"] || "$";
    return symbol + Math.round(n).toLocaleString("en-US");
  }
  function num(n) { return Math.round(n).toLocaleString("en-US"); }
  function date(s, long) {
    var d = AZ.parse(s);
    return (long ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] + " " : "") +
      d.getDate() + " " + MONTHS[d.getMonth()] + (long ? " " + d.getFullYear() : "");
  }
  function dateNum(s) { return s.slice(8) + "/" + s.slice(5, 7); }
  function range(a, b) {
    var A = AZ.parse(a), B = AZ.parse(b);
    var same = A.getMonth() === B.getMonth();
    return A.getDate() + (same ? "" : " " + MONTHS[A.getMonth()]) + " – " + B.getDate() + " " + MONTHS[B.getMonth()] +
      " " + B.getFullYear();
  }
  function relative(s) {
    var diff = Math.round((AZ.parse(s) - AZ.TODAY) / 86400000);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff === -1) return "yesterday";
    return diff > 0 ? "in " + diff + " days" : Math.abs(diff) + " days ago";
  }
  function ratingWord(score) {
    return score >= 9.2 ? "Exceptional" : score >= 8.6 ? "Excellent" : score >= 8 ? "Very good"
      : score >= 7.2 ? "Good" : score >= 6 ? "Pleasant" : "Fair";
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ""); }

  /* ---------- tiny DOM helpers ---------- */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(root, evt, sel, fn) {
    root.addEventListener(evt, function (e) {
      var t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  }

  /* ---------- atoms ---------- */
  function stars(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += I("star", i <= n ? "" : "off");
    return '<span class="stars" aria-label="' + n + ' star property">' + out + "</span>";
  }
  function pill(status) {
    return '<span class="pill s-' + slug(status) + '">' + esc(status) + "</span>";
  }
  function avatar(name, cls) {
    var initials = String(name).split(" ").map(function (p) { return p[0]; }).join("").slice(0, 2).toUpperCase();
    return '<span class="avatar ' + (cls || "") + '" style="background:' + window.Icons.avatarColor(name) + '" aria-hidden="true">' + initials + "</span>";
  }
  function amenityBadge(id) {
    var a = AZ.amenity(id);
    if (!a) return "";
    return '<span class="badge">' + I(a.icon) + esc(a.label) + "</span>";
  }
  function skeleton(n, cls) {
    var out = "";
    for (var i = 0; i < (n || 3); i++) out += '<div class="skel ' + (cls || "") + '"></div>';
    return '<div class="stack">' + out + "</div>";
  }
  function empty(title, body, action) {
    return '<div class="empty"><div class="ico">' + I("compass") + "</div><h3>" + esc(title) + "</h3><p>" +
      esc(body) + "</p>" + (action || "") + "</div>";
  }
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Breadcrumb">' + items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? I("chevronRight") : "") + (last || !it.href
        ? '<span aria-current="page">' + esc(it.label) + "</span>"
        : '<a href="' + it.href + '">' + esc(it.label) + "</a>");
    }).join("") + "</nav>";
  }
  function progress(pct, tone) {
    return '<div class="progress"><i class="' + (tone || "") + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div>';
  }
  function delta(v) {
    var up = v >= 0;
    return '<span class="delta ' + (up ? "up" : "down") + '">' + I(up ? "arrowUp" : "arrowDown") +
      Math.abs(v).toFixed(1) + "%</span>";
  }
  function stat(o) {
    return '<div class="card stat">' +
      '<div class="ico ' + (o.tone || "") + '">' + I(o.icon || "chart") + "</div>" +
      '<div class="grow"><div class="v mono">' + o.value + "</div><div class=\"k\">" + esc(o.label) + "</div>" +
      (o.delta != null ? delta(o.delta) : "") + (o.note ? '<div class="small muted">' + esc(o.note) + "</div>" : "") +
      "</div>" + (o.spark || "") + "</div>";
  }

  /* ---------- the rate rail (signature element) ---------- */
  function rail(cells, opts) {
    opts = opts || {};
    var prices = cells.filter(function (c) { return c.free; }).map(function (c) { return c.price; });
    var lo = prices.length ? Math.min.apply(null, prices) : 0;
    var hi = prices.length ? Math.max.apply(null, prices) : 1;
    var span = Math.max(1, hi - lo);
    var track = cells.map(function (c) {
      var pctH = c.free ? 34 + ((c.price - lo) / span) * 66 : 100;
      var band = !c.free ? "out" : c.price <= lo + span * 0.25 ? "low" : c.price >= lo + span * 0.75 ? "high" : "";
      var sel = opts.selected && opts.selected.indexOf(c.date) >= 0 ? " sel" : "";
      var title = c.dow + " " + dateNum(c.date) + " · " + (c.free ? money(c.price) + (c.left ? " · " + c.left + " rooms left" : "") : "no availability");
      return '<span class="rail-cell ' + band + sel + '" style="height:' + pctH.toFixed(0) + '%" title="' + esc(title) +
        '" data-date="' + c.date + '"></span>';
    }).join("");
    return '<div class="rail">' +
      (opts.hideHead ? "" : '<div class="rail-head"><span class="tiny">' + esc(opts.label || "Next 14 nights") + "</span>" +
        '<span class="mono small">' + (prices.length ? "from " + money(lo) : "fully booked") + "</span></div>") +
      '<div class="rail-track" role="img" aria-label="Nightly rate and availability for the next ' + cells.length + ' nights">' + track + "</div>" +
      (opts.scale === false ? "" : '<div class="rail-scale"><span>' + dateNum(cells[0].date) + "</span><span>" +
        dateNum(cells[cells.length - 1].date) + "</span></div>") +
      (opts.legend ? '<div class="rail-legend">' +
        '<span><i style="background:var(--success)"></i>cheapest nights</span>' +
        '<span><i style="background:var(--navy)"></i>peak nights</span>' +
        '<span><i style="background:var(--border-strong)"></i>sold out</span></div>' : "") +
      "</div>";
  }

  /* ---------- cards ---------- */
  function hotelCard(h, opts) {
    opts = opts || {};
    var fav = Store.isFav(h.id);
    var cells = AZ.hotelRail(h, opts.from, 14);
    return '<article class="card card-hover hotel-card ' + (opts.list ? "list-card" : "") + '">' +
      '<div class="thumb">' + scene(h.id, h.kind, 0) +
      '<button class="icon-btn fav ' + (fav ? "on" : "") + '" data-fav="' + h.id + '" aria-pressed="' + fav +
      '" aria-label="Save ' + esc(h.name) + '">' + I("heart") + "</button>" +
      (h.freeCancellation ? '<span class="badge badge-green tag">Free cancellation</span>' : "") + "</div>" +
      '<div class="body">' +
      '<div class="row between" style="align-items:flex-start">' +
      "<div><h3><a href=\"#/hotel/" + h.id + '">' + esc(h.name) + "</a></h3>" +
      '<div class="loc">' + I("pin") + esc(h.city + ", " + h.country) + " · " + h.distance + " km to centre</div></div>" +
      '<span class="score" title="' + ratingWord(h.rating) + '">' + h.rating.toFixed(1) + "</span></div>" +
      '<div class="row wrap" style="gap:8px">' + stars(h.stars) +
      '<span class="small muted">' + esc(h.type) + " · " + h.reviews + " reviews</span></div>" +
      (opts.list ? '<p class="small muted" style="margin:0">' + esc(h.description.slice(0, 150)) + "…</p>" : "") +
      '<div class="amenity-row">' + h.amenities.slice(0, opts.list ? 6 : 3).map(amenityBadge).join("") + "</div>" +
      rail(cells, { label: "Nightly rate", scale: false }) +
      '<div class="price-line"><div><div class="price">' + money(h.priceFrom) + " <small>/ night</small></div>" +
      '<div class="small muted">incl. taxes from ' + money(h.priceFrom * 1.15) + "</div></div>" +
      '<a class="btn btn-primary btn-sm" href="#/hotel/' + h.id + '">See rooms</a></div>' +
      "</div></article>";
  }

  function roomCard(room, hotel, opts) {
    opts = opts || {};
    var cells = AZ.railFor(room, opts.from, 14);
    return '<article class="card card-hover hotel-card">' +
      '<div class="thumb">' + scene(room.id, "room", 1) +
      '<span class="badge badge-blue tag">' + esc(room.type) + "</span></div>" +
      '<div class="body">' +
      "<h3>" + esc(room.type + " · " + room.view) + "</h3>" +
      '<div class="row wrap small muted" style="gap:12px">' +
      "<span>" + I("bed") + " " + esc(room.beds) + "</span>" +
      "<span>" + I("users") + " up to " + room.capacity + "</span>" +
      "<span>" + room.size + " m²</span></div>" +
      '<div class="amenity-row">' + room.amenities.slice(0, 3).map(amenityBadge).join("") + "</div>" +
      rail(cells, { label: "Rate rail", scale: false }) +
      '<div class="price-line"><div><div class="price">' + money(room.price) + " <small>/ night</small></div>" +
      '<div class="small muted">' + esc(room.cancellation) + "</div></div>" +
      '<a class="btn btn-primary btn-sm" href="#/room/' + room.id + '">Choose</a></div>' +
      "</div></article>";
  }

  /* ---------- toast ---------- */
  function toast(title, opts) {
    opts = opts || {};
    var root = document.getElementById("toast-root");
    var el = document.createElement("div");
    el.className = "toast " + (opts.tone || "");
    el.innerHTML = I(opts.tone === "err" ? "xCircle" : opts.tone === "warn" ? "alert" : "checkCircle") +
      '<div class="grow"><div class="t">' + esc(title) + "</div>" +
      (opts.body ? '<div class="d">' + esc(opts.body) + "</div>" : "") + "</div>";
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity .25s";
      setTimeout(function () { el.remove(); }, 260);
    }, opts.ms || 3600);
  }

  /* ---------- modal ---------- */
  var lastFocus = null;
  function modal(o) {
    var root = document.getElementById("modal-root");
    lastFocus = document.activeElement;
    var scrim = document.createElement("div");
    scrim.className = "modal-scrim";
    scrim.innerHTML =
      '<div class="modal ' + (o.wide ? "wide" : "") + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title || "Dialog") + '">' +
      '<div class="modal-head"><h3>' + esc(o.title || "") + '</h3>' +
      '<button class="icon-btn" data-close aria-label="Close dialog">' + I("x") + "</button></div>" +
      '<div class="modal-body">' + (o.body || "") + "</div>" +
      (o.foot ? '<div class="modal-foot">' + o.foot + "</div>" : "") + "</div>";
    root.appendChild(scrim);

    function close() {
      scrim.remove();
      document.removeEventListener("keydown", key);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function key(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        var f = qsa('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', scrim);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    scrim.addEventListener("click", function (e) {
      if (e.target === scrim || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", key);
    var focusable = qs("input,select,textarea,button:not([data-close])", scrim) || qs("[data-close]", scrim);
    if (focusable) focusable.focus();
    if (o.onOpen) o.onOpen(scrim, close);
    return close;
  }

  function confirm(o) {
    return modal({
      title: o.title,
      body: "<p>" + esc(o.body) + "</p>",
      foot: '<button class="btn btn-ghost" data-close>Keep it</button>' +
        '<button class="btn ' + (o.danger ? "btn-danger" : "btn-primary") + '" data-yes>' + esc(o.confirm || "Confirm") + "</button>",
      onOpen: function (scrim, close) {
        qs("[data-yes]", scrim).addEventListener("click", function () { close(); o.onConfirm(); });
      }
    });
  }

  /* ---------- calendar ---------- */
  function calendar(o) {
    var view = AZ.parse(o.month + "-01");
    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var lead = first.getDay();
    var cells = ["<div class=\"dow\">Su</div><div class=\"dow\">Mo</div><div class=\"dow\">Tu</div><div class=\"dow\">We</div>" +
      "<div class=\"dow\">Th</div><div class=\"dow\">Fr</div><div class=\"dow\">Sa</div>"];
    for (var i = 0; i < lead; i++) cells.push("<span></span>");
    for (var d = 1; d <= days; d++) {
      var ds = AZ.iso(new Date(view.getFullYear(), view.getMonth(), d));
      var past = AZ.parse(ds) < AZ.TODAY;
      var free = o.room ? AZ.isFree(o.room.id, ds) : true;
      var price = o.room ? AZ.nightlyRate(o.room, ds) : null;
      var cls = [];
      if (o.from && o.to && ds > o.from && ds < o.to) cls.push("in-range");
      if (ds === o.from || ds === o.to) cls.push("edge");
      cells.push('<button type="button" data-day="' + ds + '" class="' + cls.join(" ") + '"' +
        (past || !free ? " disabled" : "") + ' aria-label="' + date(ds, true) + (free ? "" : ", unavailable") + '">' +
        d + (price && free && !past ? "<em>" + Math.round(price) + "</em>" : "") + "</button>");
    }
    return '<div class="stack">' +
      '<div class="row between"><button class="icon-btn" type="button" data-cal-prev aria-label="Previous month">' + I("chevronLeft") + "</button>" +
      "<strong>" + MONTHS_LONG[view.getMonth()] + " " + view.getFullYear() + "</strong>" +
      '<button class="icon-btn" type="button" data-cal-next aria-label="Next month">' + I("chevronRight") + "</button></div>" +
      '<div class="calendar">' + cells.join("") + "</div></div>";
  }

  /* ---------- data table ---------- */
  function table(container, cfg) {
    var state = { page: 1, sort: cfg.sort || null, dir: cfg.dir || "asc", q: "", size: cfg.pageSize || 10 };

    function rows() {
      var out = cfg.rows.slice();
      if (state.q && cfg.searchIn) {
        var q = state.q.toLowerCase();
        out = out.filter(function (r) {
          return cfg.searchIn(r).toLowerCase().indexOf(q) >= 0;
        });
      }
      if (state.sort) {
        var col = cfg.columns.filter(function (c) { return c.key === state.sort; })[0];
        out.sort(function (a, b) {
          var va = col.value ? col.value(a) : a[state.sort];
          var vb = col.value ? col.value(b) : b[state.sort];
          if (typeof va === "string") { va = va.toLowerCase(); vb = String(vb).toLowerCase(); }
          return (va > vb ? 1 : va < vb ? -1 : 0) * (state.dir === "asc" ? 1 : -1);
        });
      }
      return out;
    }

    function render() {
      var all = rows();
      var pages = Math.max(1, Math.ceil(all.length / state.size));
      if (state.page > pages) state.page = pages;
      var slice = all.slice((state.page - 1) * state.size, state.page * state.size);

      var head = cfg.columns.map(function (c) {
        var arrow = state.sort === c.key ? (state.dir === "asc" ? I("arrowUp") : I("arrowDown")) : "";
        return "<th" + (c.width ? ' style="width:' + c.width + '"' : "") + ">" +
          (c.sortable === false ? esc(c.label) : '<button data-sort="' + c.key + '">' + esc(c.label) + arrow + "</button>") + "</th>";
      }).join("");

      var body = slice.length ? slice.map(function (r, i) {
        return '<tr data-row="' + (cfg.rowId ? cfg.rowId(r) : i) + '">' + cfg.columns.map(function (c) {
          return "<td>" + (c.render ? c.render(r) : esc(r[c.key])) + "</td>";
        }).join("") + "</tr>";
      }).join("")
        : '<tr><td colspan="' + cfg.columns.length + '">' + empty(cfg.emptyTitle || "Nothing to show",
          cfg.emptyBody || "Adjust the filters or search to see more rows.") + "</td></tr>";

      var pagerBtns = "";
      for (var p = 1; p <= pages; p++) {
        if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - state.page) > 1) {
          if (p === 3) pagerBtns += '<button disabled>…</button>';
          continue;
        }
        pagerBtns += '<button data-page="' + p + '"' + (p === state.page ? ' aria-current="page"' : "") + ">" + p + "</button>";
      }

      // Fresh wrapper per render: handlers bound in afterRender die with it.
      container.innerHTML = "";
      var view = document.createElement("div");
      container.appendChild(view);
      view.innerHTML =
        (cfg.searchIn || cfg.toolbar
          ? '<div class="row wrap between" style="margin-bottom:12px">' +
            (cfg.searchIn ? '<div class="row" style="min-width:min(320px,100%)">' +
              '<input class="input" data-q placeholder="' + esc(cfg.searchPlaceholder || "Search…") + '" value="' + esc(state.q) + '" aria-label="Search table"></div>' : "<span></span>") +
            (cfg.toolbar || "") + "</div>"
          : "") +
        '<div class="table-wrap"><table class="data"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table>" +
        '<div class="table-foot"><span>' + all.length + " " + (cfg.noun || "rows") +
        (all.length ? " · showing " + ((state.page - 1) * state.size + 1) + "–" + Math.min(all.length, state.page * state.size) : "") +
        '</span><div class="pager">' + pagerBtns + "</div></div></div>";

      var q = qs("[data-q]", view);
      if (q) {
        q.addEventListener("input", function () { state.q = this.value; state.page = 1; render(); this === document.activeElement; });
        q.addEventListener("keyup", function (e) { if (e.key === "Enter") render(); });
      }
      qsa("[data-sort]", view).forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-sort");
          if (state.sort === k) state.dir = state.dir === "asc" ? "desc" : "asc";
          else { state.sort = k; state.dir = "asc"; }
          render();
        });
      });
      qsa("[data-page]", view).forEach(function (b) {
        b.addEventListener("click", function () { state.page = +b.getAttribute("data-page"); render(); window.scrollTo({ top: container.offsetTop - 90, behavior: "smooth" }); });
      });
      if (cfg.onRow) {
        qsa("tbody tr[data-row]", view).forEach(function (tr) {
          tr.style.cursor = "pointer";
          tr.addEventListener("click", function (e) {
            if (e.target.closest("button,a,input,select")) return;
            cfg.onRow(tr.getAttribute("data-row"), tr);
          });
        });
      }
      if (cfg.afterRender) cfg.afterRender(view, state);
      var focusQ = qs("[data-q]", view);
      if (focusQ && state.q) { focusQ.focus(); focusQ.setSelectionRange(state.q.length, state.q.length); }
    }

    render();
    return { render: render, state: state, setRows: function (r) { cfg.rows = r; render(); } };
  }

  /* ---------- forms ---------- */
  function field(o) {
    var id = o.id || o.name;
    var input;
    if (o.type === "select") {
      input = '<select class="select" id="' + id + '" name="' + o.name + '"' + (o.required ? " required" : "") + ">" +
        o.options.map(function (op) {
          var v = op.value != null ? op.value : op;
          var l = op.label != null ? op.label : op;
          return '<option value="' + esc(v) + '"' + (String(o.value) === String(v) ? " selected" : "") + ">" + esc(l) + "</option>";
        }).join("") + "</select>";
    } else if (o.type === "textarea") {
      input = '<textarea class="input" id="' + id + '" name="' + o.name + '" placeholder="' + esc(o.placeholder || "") + '"' +
        (o.required ? " required" : "") + ">" + esc(o.value || "") + "</textarea>";
    } else {
      input = '<input class="input" id="' + id + '" name="' + o.name + '" type="' + (o.type || "text") + '"' +
        (o.min ? ' min="' + o.min + '"' : "") + (o.max ? ' max="' + o.max + '"' : "") +
        (o.step ? ' step="' + o.step + '"' : "") +
        ' placeholder="' + esc(o.placeholder || "") + '" value="' + esc(o.value == null ? "" : o.value) + '"' +
        (o.required ? " required" : "") + (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : "") + ">";
    }
    return '<div class="field ' + (o.full ? "full" : "") + '"><label for="' + id + '">' + esc(o.label) +
      (o.required ? ' <span aria-hidden="true" style="color:var(--danger)">*</span>' : "") + "</label>" + input +
      (o.hint ? '<span class="small muted">' + esc(o.hint) + "</span>" : "") +
      '<span class="field-error" data-error-for="' + o.name + '"></span></div>';
  }

  var validators = {
    required: function (v) { return String(v).trim() ? null : "This field is required."; },
    email: function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : "Enter an email address in the form name@example.com."; },
    phone: function (v) { return String(v).replace(/\D/g, "").length >= 7 ? null : "Enter a phone number with at least 7 digits."; },
    min2: function (v) { return String(v).trim().length >= 2 ? null : "Use at least 2 characters."; },
    password: function (v) { return String(v).length >= 8 ? null : "Use at least 8 characters."; },
    card: function (v) { return String(v).replace(/\D/g, "").length === 16 ? null : "Card numbers are 16 digits."; },
    cvc: function (v) { return /^\d{3,4}$/.test(String(v).trim()) ? null : "The security code is 3 or 4 digits."; },
    expiry: function (v) { return /^(0[1-9]|1[0-2])\/\d{2}$/.test(String(v).trim()) ? null : "Use MM/YY."; }
  };

  function validate(form, schema) {
    var values = {}, errors = {}, ok = true;
    qsa("[data-error-for]", form).forEach(function (e) { e.textContent = ""; });
    qsa(".input,.select", form).forEach(function (i) { i.classList.remove("invalid"); });
    Object.keys(schema).forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      var v = el.type === "checkbox" ? el.checked : el.value;
      values[name] = v;
      var rules = schema[name].split("|");
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule === "optional" && !String(v).trim()) break;
        if (rule === "checked") { if (!v) { errors[name] = "Tick this to continue."; break; } continue; }
        var fn = validators[rule];
        if (!fn) continue;
        var msg = fn(v);
        if (msg) { errors[name] = msg; break; }
      }
    });
    Object.keys(errors).forEach(function (name) {
      ok = false;
      var slot = qs('[data-error-for="' + name + '"]', form);
      if (slot) slot.textContent = errors[name];
      var el = form.elements[name];
      if (el && el.classList) el.classList.add("invalid");
    });
    if (!ok) {
      var firstBad = qs(".invalid", form);
      if (firstBad) firstBad.focus();
    }
    return { ok: ok, values: values, errors: errors };
  }

  window.UI = {
    esc: esc, money: money, num: num, date: date, dateNum: dateNum, range: range, relative: relative,
    ratingWord: ratingWord, slug: slug, MONTHS: MONTHS, MONTHS_LONG: MONTHS_LONG,
    qs: qs, qsa: qsa, on: on,
    stars: stars, pill: pill, avatar: avatar, amenityBadge: amenityBadge, skeleton: skeleton,
    empty: empty, crumbs: crumbs, progress: progress, delta: delta, stat: stat,
    rail: rail, hotelCard: hotelCard, roomCard: roomCard,
    toast: toast, modal: modal, confirm: confirm, calendar: calendar, table: table,
    field: field, validate: validate, icon: I, scene: scene
  };
})();
