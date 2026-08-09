/* Azure Stay — guest-facing pages. */
(function () {
  "use strict";
  var AZ = window.AZ, U = window.UI, I = window.Icons.icon, scene = window.Icons.scene;
  var esc = U.esc, money = U.money;

  /* ---------------- shared bits ---------------- */

  function searchPanel(compact) {
    var s = Store.state.search;
    return '<form class="searchbar ' + (compact ? "inline" : "") + '" data-search>' +
      '<div class="field suggest"><label for="q-dest">Where to</label>' +
      '<input class="input" id="q-dest" name="destination" autocomplete="off" placeholder="City, country or hotel" value="' + esc(s.destination) + '">' +
      '<div class="suggest-list hide" data-suggest></div></div>' +
      '<div class="field"><label for="q-in">Check in</label><input class="input" id="q-in" name="checkIn" type="date" value="' + s.checkIn + '" min="' + AZ.iso(AZ.TODAY) + '"></div>' +
      '<div class="field"><label for="q-out">Check out</label><input class="input" id="q-out" name="checkOut" type="date" value="' + s.checkOut + '" min="' + AZ.iso(AZ.addDays(AZ.TODAY, 1)) + '"></div>' +
      '<div class="field"><label for="q-guests">Guests</label>' +
      '<select class="select" id="q-guests" name="guests">' +
      [1, 2, 3, 4, 5, 6].map(function (n) {
        return '<option value="' + n + '"' + (s.adults + s.children === n ? " selected" : "") + ">" + n + " guest" + (n > 1 ? "s" : "") + "</option>";
      }).join("") + "</select></div>" +
      '<div class="field search-go"><button class="btn btn-accent" type="submit">' + I("search") + "Search</button></div>" +
      "</form>";
  }

  function wireSearch(root, onSubmit) {
    var form = U.qs("[data-search]", root);
    if (!form) return;
    var input = form.elements.destination;
    var list = U.qs("[data-suggest]", form);

    function close() { list.classList.add("hide"); }
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 1) return close();
      var hits = [];
      AZ.db.destinations.forEach(function (d) {
        if ((d.city + " " + d.country).toLowerCase().indexOf(q) >= 0) hits.push({ t: d.city + ", " + d.country, i: "pin", v: d.city });
      });
      AZ.db.hotels.forEach(function (h) {
        if (h.name.toLowerCase().indexOf(q) >= 0) hits.push({ t: h.name + " · " + h.city, i: "building", v: h.name });
      });
      hits = hits.slice(0, 7);
      if (!hits.length) return close();
      list.innerHTML = hits.map(function (h) {
        return '<button type="button" data-pick="' + esc(h.v) + '">' + I(h.i) + "<span>" + esc(h.t) + "</span></button>";
      }).join("");
      list.classList.remove("hide");
    });
    input.addEventListener("blur", function () { setTimeout(close, 160); });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]");
      if (!b) return;
      input.value = b.getAttribute("data-pick");
      close();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var guests = +form.elements.guests.value;
      if (form.elements.checkOut.value <= form.elements.checkIn.value) {
        form.elements.checkOut.value = AZ.iso(AZ.addDays(AZ.parse(form.elements.checkIn.value), 2));
        U.toast("Check-out moved", { body: "Check-out has to be after check-in, so we pushed it two nights.", tone: "warn" });
      }
      Store.patchSearch({
        destination: input.value.trim(),
        checkIn: form.elements.checkIn.value,
        checkOut: form.elements.checkOut.value,
        adults: Math.min(guests, 2) === 2 && guests > 2 ? 2 : guests,
        children: guests > 2 ? guests - 2 : 0
      });
      if (onSubmit) onSubmit();
      else location.hash = "#/search";
    });
  }

  function wireFavs(root) {
    U.on(root, "click", "[data-fav]", function (e, b) {
      e.preventDefault();
      var id = b.getAttribute("data-fav");
      var on = Store.toggleFav(id);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      U.toast(on ? "Saved to your list" : "Removed from your list", {
        body: on ? AZ.hotel(id).name + " is in Favourites." : "", tone: on ? "ok" : ""
      });
    });
  }

  /* ---------------- home ---------------- */

  function home() {
    var db = AZ.db;
    var featured = db.hotels.filter(function (h) { return h.featured; }).slice(0, 6);
    var rooms = db.rooms.filter(function (r) { return r.type === "Suite" || r.type === "Executive"; }).slice(0, 3);
    var offers = db.promotions.filter(function (p) { return p.status === "Active"; }).slice(0, 3);
    var reviews = db.reviews.filter(function (r) { return r.status === "Approved" && r.rating > 8.6; }).slice(0, 3);
    var dests = db.destinations.slice(0, 6);
    var live = AZ.stayingOn(AZ.iso(AZ.TODAY)).length;

    var html =
      '<section class="hero"><div class="hero-scene">' + scene("azure-stay-hero", "coast", 3) + "</div>" +
      '<div class="hero-inner container">' +
      '<span class="eyebrow">Twenty properties · twelve cities</span>' +
      "<h1>Book the night, not just the room.</h1>" +
      '<p class="lede">Every hotel and every room on Azure Stay shows a rate rail: fourteen nights of real prices and real availability, before you commit to dates.</p>' +
      '<div class="hero-stats">' +
      "<div><strong>" + db.hotels.length + "</strong><span>properties</span></div>" +
      "<div><strong>" + db.rooms.length + "</strong><span>rooms live</span></div>" +
      "<div><strong>" + live + "</strong><span>guests in house tonight</span></div>" +
      "<div><strong>" + (db.reviews.length) + "</strong><span>verified reviews</span></div>" +
      "</div></div></section>" +

      '<div class="container" style="margin-top:-42px;position:relative;z-index:5">' + searchPanel() + "</div>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Featured</span><h2>Properties we would book ourselves</h2>' +
      "<p>Chosen for consistency rather than gloss — the ones where the third stay is as good as the first.</p></div>" +
      '<a class="btn btn-outline btn-sm" href="#/search">See all ' + db.hotels.length + " " + I("arrowRight") + "</a></div>" +
      '<div class="grid grid-3">' + featured.map(function (h) { return U.hotelCard(h); }).join("") + "</div></section>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Destinations</span><h2>Where guests are going this season</h2></div></div>' +
      '<div class="grid grid-3">' + dests.map(function (d) {
        var count = db.hotels.filter(function (h) { return h.destId === d.id; }).length;
        return '<a class="dest-card" href="#/search?destination=' + encodeURIComponent(d.city) + '">' +
          scene("dest-" + d.id, d.kind, 2) +
          '<span class="cap"><b>' + esc(d.city) + "</b><br><span class=\"small\">" + esc(d.country) + " · " + count + " propert" + (count === 1 ? "y" : "ies") + "</span></span></a>";
      }).join("") + "</div></section>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Rooms</span><h2>Suites and executive rooms</h2>' +
      "<p>The larger rooms, with the rate rail attached so you can see which nights are worth taking.</p></div></div>" +
      '<div class="grid grid-3">' + rooms.map(function (r) { return U.roomCard(r, AZ.hotel(r.hotelId)); }).join("") + "</div></section>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Included</span><h2>What you get everywhere</h2>' +
      "<p>These are standard across the group. Anything property-specific is listed on the hotel page.</p></div></div>" +
      '<div class="grid grid-4">' + [
        ["wifi", "WiFi that holds a call", "Measured at 50 Mbps or better in every room, not just the lobby."],
        ["coffee", "Breakfast until 10:30", "Later on Sundays. Coffee is available from 06:00 for early flights."],
        ["clock", "24-hour front desk", "A real person, at every property, at every hour."],
        ["shield", "No surprise fees", "The price you see includes taxes and the service fee at checkout."]
      ].map(function (a) {
        return '<div class="card card-pad"><div class="stat" style="padding:0"><div class="ico">' + I(a[0]) + "</div>" +
          "<div><h4>" + esc(a[1]) + '</h4><p class="small muted" style="margin:0">' + esc(a[2]) + "</p></div></div></div>";
      }).join("") + "</div></section>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Offers</span><h2>Live promotions</h2>' +
      "<p>Apply the code at the payment step. Each one has its own minimum stay.</p></div></div>" +
      '<div class="grid grid-3">' + offers.map(function (p, i) {
        return '<div class="offer' + (i === 1 ? " warm" : "") + '"><span class="code">' + esc(p.code) + "</span>" +
          "<h3 style=\"margin-top:14px\">" + esc(p.name) + "</h3>" +
          "<p>" + (p.unit === "%" ? p.value + "% off" : money(p.value) + " off") + " on stays of " + p.minNights +
          " night" + (p.minNights > 1 ? "s" : "") + " or more. Ends " + U.date(p.end) + ".</p>" +
          '<div class="small">' + (p.cap - p.used) + " of " + p.cap + " left</div></div>";
      }).join("") + "</div></section>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Reviews</span><h2>From guests who checked out last month</h2></div>' +
      '<a class="btn btn-outline btn-sm" href="#/search">Browse hotels</a></div>' +
      '<div class="grid grid-3">' + reviews.map(function (rv) {
        var g = AZ.guest(rv.guestId), h = AZ.hotel(rv.hotelId);
        return '<blockquote class="card card-pad" style="margin:0">' +
          '<div class="row between"><span class="score">' + rv.rating.toFixed(1) + "</span>" +
          '<span class="small muted">' + U.date(rv.date) + "</span></div>" +
          "<h4 style=\"margin-top:12px\">" + esc(rv.title) + '</h4><p class="small">' + esc(rv.body) + "</p>" +
          '<footer class="row" style="margin-top:12px">' + U.avatar(g ? g.name : "Guest") +
          "<div><div class=\"small\"><strong>" + esc(g ? g.name : "Verified guest") + '</strong></div>' +
          '<div class="small muted">' + esc(h.name) + ", " + esc(h.city) + "</div></div></footer></blockquote>";
      }).join("") + "</div></section>" +

      '<section class="section container">' +
      '<div class="section-head"><div><span class="eyebrow">Nearby</span><h2>Worth walking to</h2>' +
      "<p>Attractions our front desks are asked about most, with the walk from the door.</p></div></div>" +
      '<div class="grid grid-4">' + [
        ["Miradouro da Senhora do Monte", "Lisbon", "12 min walk"],
        ["Philosopher's Path", "Kyoto", "8 min walk"],
        ["Sea Point Promenade", "Cape Town", "5 min walk"],
        ["Sun Voyager sculpture", "Reykjavik", "15 min walk"]
      ].map(function (n) {
        return '<div class="card card-pad"><div class="tiny muted">' + esc(n[1]) + "</div><h4>" + esc(n[0]) + "</h4>" +
          '<div class="small muted row" style="gap:6px">' + I("pin") + esc(n[2]) + "</div></div>";
      }).join("") + "</div></section>" +

      '<section class="section container"><div class="card card-pad" style="background:var(--navy);color:#fff;border:0">' +
      '<div class="split" style="align-items:center">' +
      "<div><h2 style=\"color:#fff\">Rate alerts, once a week</h2>" +
      '<p style="color:#cbd5e1;margin:0">Tell us the cities you watch and we will send the nights that drop below your number. No newsletters, no filler.</p></div>' +
      '<form class="row" data-newsletter style="gap:10px;flex-wrap:wrap">' +
      '<input class="input grow" type="email" name="email" placeholder="you@example.com" aria-label="Email address" required>' +
      '<button class="btn btn-accent" type="submit">Subscribe</button></form></div></div></section>';

    return {
      title: "Azure Stay — hotel booking",
      html: html,
      mount: function (root) {
        wireSearch(root);
        wireFavs(root);
        var nl = U.qs("[data-newsletter]", root);
        nl.addEventListener("submit", function (e) {
          e.preventDefault();
          U.toast("You are on the list", { body: "Weekly rate alerts will go to " + nl.elements.email.value + ".", tone: "ok" });
          nl.reset();
        });
      }
    };
  }

  /* ---------------- search results ---------------- */

  function search(ctx) {
    if (ctx.query.destination) Store.patchSearch({ destination: ctx.query.destination });
    var f = Store.state.filters;
    var s = Store.state.search;

    var html =
      '<div class="container">' + U.crumbs([{ label: "Home", href: "#/" }, { label: "Search" }]) +
      searchPanel(true) +
      '<div class="split" style="margin-top:24px">' +
      '<div><div class="row between wrap" style="margin-bottom:16px">' +
      '<div><h1 style="font-size:26px;margin:0" data-count></h1>' +
      '<p class="small muted" style="margin:0">' + U.range(s.checkIn, s.checkOut) + " · " + AZ.nights(s.checkIn, s.checkOut) +
      " nights · " + (s.adults + s.children) + " guests</p></div>" +
      '<div class="row"><label class="label" for="sort">Sort</label>' +
      '<select class="select" id="sort" style="width:auto" data-sort>' +
      [["recommended", "Recommended"], ["price", "Price: low to high"], ["priceDesc", "Price: high to low"],
       ["rating", "Guest rating"], ["popular", "Most reviewed"], ["newest", "Recently added"]]
        .map(function (o) { return '<option value="' + o[0] + '"' + (f.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
      "</select>" +
      '<button class="icon-btn no-print" data-toggle-filters aria-label="Show filters">' + I("sliders") + "</button></div></div>" +
      '<div data-results class="stack" style="gap:20px"></div>' +
      '<div class="center" style="margin-top:24px"><button class="btn btn-outline" data-more>Load more</button></div>' +
      "</div>" +
      '<aside class="stack" data-filters>' + filtersPanel() + "</aside>" +
      "</div></div>";

    return {
      title: "Search hotels — Azure Stay",
      html: html,
      mount: function (root) {
        var shown = 6;
        function results() {
          var list = filterHotels();
          U.qs("[data-count]", root).textContent = list.length + (list.length === 1 ? " property" : " properties") +
            (Store.state.search.destination ? " in " + Store.state.search.destination : "");
          var box = U.qs("[data-results]", root);
          box.innerHTML = list.length
            ? list.slice(0, shown).map(function (h) { return U.hotelCard(h, { list: true, from: Store.state.search.checkIn }); }).join("")
            : U.empty("No property matches those filters",
              "Widen the price range or drop an amenity. Free cancellation and breakfast are the two that cut results hardest.",
              '<button class="btn btn-outline" data-clear>Clear filters</button>');
          var more = U.qs("[data-more]", root);
          more.classList.toggle("hide", shown >= list.length);
          more.textContent = "Load more (" + Math.max(0, list.length - shown) + " left)";
        }
        results();
        wireSearch(root, function () { shown = 6; results(); });
        wireFavs(root);

        U.on(root, "click", "[data-more]", function () { shown += 6; results(); });
        U.on(root, "click", "[data-clear]", function () { Store.resetFilters(); U.qs("[data-filters]", root).innerHTML = filtersPanel(); results(); });
        U.on(root, "change", "[data-sort]", function (e, el) { Store.patchFilters({ sort: el.value }); results(); });
        U.on(root, "click", "[data-toggle-filters]", function () { U.qs("[data-filters]", root).classList.toggle("hide"); });

        U.on(root, "input", "[data-price]", function (e, el) {
          U.qs("[data-price-out]", root).textContent = "up to " + money(el.value);
          Store.patchFilters({ price: +el.value });
          shown = 6; results();
        });
        U.on(root, "click", "[data-facet]", function (e, el) {
          var group = el.getAttribute("data-facet"), value = el.getAttribute("data-value");
          var cur = Store.state.filters[group] || [];
          var next = cur.indexOf(value) >= 0 ? cur.filter(function (x) { return x !== value; }) : cur.concat([value]);
          var patch = {}; patch[group] = next;
          Store.patchFilters(patch);
          el.setAttribute("aria-pressed", String(next.indexOf(value) >= 0));
          shown = 6; results();
        });
        U.on(root, "change", "[data-rating]", function (e, el) {
          Store.patchFilters({ rating: +el.value });
          shown = 6; results();
        });
      }
    };
  }

  function filtersPanel() {
    var f = Store.state.filters;
    function facet(group, values, labelFor) {
      return values.map(function (v) {
        var on = (f[group] || []).indexOf(v) >= 0;
        return '<button class="chip" type="button" data-facet="' + group + '" data-value="' + esc(v) + '" aria-pressed="' + on + '">' +
          esc(labelFor ? labelFor(v) : v) + "</button>";
      }).join("");
    }
    return '<div class="card card-pad sticky-side stack" style="gap:18px">' +
      '<div class="row between"><h3 style="margin:0">Filters</h3>' +
      '<button class="btn btn-ghost btn-sm" data-clear>Reset</button></div>' +

      '<div class="field"><label for="price">Max nightly rate <span class="mono" data-price-out>up to ' + money(f.price) + "</span></label>" +
      '<input id="price" type="range" min="60" max="1200" step="20" value="' + f.price + '" data-price></div>' +

      '<div class="field"><label for="rating">Guest rating</label>' +
      '<select class="select" id="rating" data-rating>' +
      [[0, "Any rating"], [7, "7+ Good"], [8, "8+ Very good"], [9, "9+ Excellent"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (f.rating === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
      }).join("") + "</select></div>" +

      "<div><div class=\"label\" style=\"margin-bottom:8px\">Property type</div>" +
      '<div class="row wrap" style="gap:6px">' + facet("types", AZ.db.propertyTypes) + "</div></div>" +

      "<div><div class=\"label\" style=\"margin-bottom:8px\">Room type</div>" +
      '<div class="row wrap" style="gap:6px">' + facet("roomTypes", AZ.db.roomTypes.map(function (t) { return t.name; })) + "</div></div>" +

      "<div><div class=\"label\" style=\"margin-bottom:8px\">Amenities</div>" +
      '<div class="row wrap" style="gap:6px">' + facet("amenities", AZ.db.amenities.map(function (a) { return a.id; }), function (id) {
        return AZ.amenity(id).label;
      }) + "</div></div>" +
      "</div>";
  }

  function filterHotels() {
    var f = Store.state.filters, s = Store.state.search;
    var q = (s.destination || "").toLowerCase();
    var out = AZ.db.hotels.filter(function (h) {
      if (q && (h.city + " " + h.country + " " + h.name).toLowerCase().indexOf(q) < 0) return false;
      if (h.priceFrom > f.price) return false;
      if (f.rating && h.rating < f.rating) return false;
      if (f.types.length && f.types.indexOf(h.type) < 0) return false;
      if (f.amenities.length && !f.amenities.every(function (a) { return h.amenities.indexOf(a) >= 0; })) return false;
      if (f.roomTypes.length) {
        var types = AZ.roomsOf(h.id).map(function (r) { return r.type; });
        if (!f.roomTypes.some(function (t) { return types.indexOf(t) >= 0; })) return false;
      }
      return true;
    });
    var sorters = {
      price: function (a, b) { return a.priceFrom - b.priceFrom; },
      priceDesc: function (a, b) { return b.priceFrom - a.priceFrom; },
      rating: function (a, b) { return b.rating - a.rating; },
      popular: function (a, b) { return b.reviews - a.reviews; },
      newest: function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; },
      recommended: function (a, b) { return (b.rating * 10 + (b.featured ? 6 : 0)) - (a.rating * 10 + (a.featured ? 6 : 0)); }
    };
    return out.sort(sorters[f.sort] || sorters.recommended);
  }

  /* ---------------- hotel details ---------------- */

  function hotel(ctx) {
    var h = AZ.hotel(ctx.params.id);
    if (!h) return notFound();
    Store.remember(h.id);
    var rooms = AZ.roomsOf(h.id);
    var reviews = AZ.reviewsOf(h.id).filter(function (r) { return r.status === "Approved"; });
    var s = Store.state.search;

    var faqs = [
      ["What time can I check in?", "Check-in opens at " + h.checkIn + " and check-out is " + h.checkOut + ". Bags can be left at the desk from 08:00 either side."],
      ["Is breakfast included?", h.breakfast ? "Yes, breakfast is included in every rate at this property." : "Breakfast is not included. It can be added at the desk for " + money(18) + " per person."],
      ["Can I cancel?", h.freeCancellation ? "Yes — free cancellation until 24 hours before arrival on all standard rates." : "Rates at this property are non-refundable, so the dates are worth double-checking."],
      ["Do you have parking?", h.amenities.indexOf("parking") >= 0 ? "On-site parking is available and can be reserved at the desk." : "There is no on-site parking. The nearest public garage is a four-minute walk."],
      ["Are pets allowed?", h.amenities.indexOf("pets") >= 0 ? "Dogs under 20 kg stay free. Tell us in the booking notes." : "This property does not accept pets, with the exception of assistance animals."]
    ];

    var html = '<div class="container">' +
      U.crumbs([{ label: "Home", href: "#/" }, { label: "Search", href: "#/search" }, { label: h.city, href: "#/search?destination=" + encodeURIComponent(h.city) }, { label: h.name }]) +
      '<div class="row between wrap" style="margin-bottom:16px">' +
      "<div>" + U.stars(h.stars) +
      "<h1 style=\"margin:6px 0 4px\">" + esc(h.name) + "</h1>" +
      '<div class="row wrap small muted" style="gap:14px"><span>' + I("pin") + " " + esc(h.address) + "</span>" +
      "<span>" + esc(h.type) + "</span><span>" + h.roomCount + " rooms</span></div></div>" +
      '<div class="row"><button class="icon-btn ' + (Store.isFav(h.id) ? "on" : "") + '" data-fav="' + h.id + '" aria-pressed="' + Store.isFav(h.id) + '" aria-label="Save hotel">' + I("heart") + "</button>" +
      '<span class="score" style="font-size:18px;padding:8px 12px">' + h.rating.toFixed(1) + "</span>" +
      "<div><div><strong>" + U.ratingWord(h.rating) + "</strong></div>" +
      '<div class="small muted">' + h.reviews + " reviews</div></div></div></div>" +

      '<div class="gallery">' + [0, 1, 2, 3, 4].map(function (i) {
        return '<button data-shot="' + i + '" aria-label="Open photo ' + (i + 1) + ' of 5">' + scene(h.id, i === 0 ? h.kind : i % 2 ? "room" : h.kind, i) +
          (i === 4 ? '<span class="more">+18 photos</span>' : "") + "</button>";
      }).join("") + "</div>" +

      '<div class="tabs" style="margin:24px 0 20px" data-tabs>' +
      ["Overview", "Rooms", "Reviews", "Location", "Policies", "FAQ"].map(function (t, i) {
        return '<button data-tab="' + U.slug(t) + '"' + (i === 0 ? ' class="active"' : "") + ">" + t + "</button>";
      }).join("") + "</div>" +

      '<div class="split"><div data-panels>' +

      '<section data-panel="overview"><h2>About this property</h2><p>' + esc(h.description) + "</p>" +
      '<div class="grid grid-2" style="margin:20px 0"><div class="card card-pad"><h4>Amenities</h4>' +
      '<div class="amenity-row">' + h.amenities.map(U.amenityBadge).join("") + "</div></div>" +
      '<div class="card card-pad"><h4>Good to know</h4><dl class="kv">' +
      "<dt>Check in</dt><dd>" + h.checkIn + "</dd><dt>Check out</dt><dd>" + h.checkOut + "</dd>" +
      "<dt>Cancellation</dt><dd>" + (h.freeCancellation ? "Free until 24h before" : "Non-refundable") + "</dd>" +
      "<dt>Breakfast</dt><dd>" + (h.breakfast ? "Included" : "Available, " + money(18) + " pp") + "</dd>" +
      "<dt>Distance</dt><dd>" + h.distance + " km to centre</dd></dl></div></div>" +
      '<div class="card card-pad"><h4>Rate rail · next 30 nights</h4>' +
      '<p class="small muted">Cheapest available room, per night. Hatched columns are sold out.</p>' +
      U.rail(AZ.hotelRail(h, s.checkIn, 30), { hideHead: true, legend: true }) + "</div></section>" +

      '<section data-panel="rooms" hidden><h2>' + rooms.length + " rooms at this property</h2>" +
      '<div class="stack" style="gap:16px">' + rooms.map(function (r) { return roomRow(r, h); }).join("") + "</div></section>" +

      '<section data-panel="reviews" hidden><div class="row between wrap"><h2>Guest reviews</h2>' +
      '<div class="row"><span class="score" style="font-size:17px;padding:7px 11px">' + h.rating.toFixed(1) + "</span>" +
      '<span class="small muted">' + reviews.length + " published</span></div></div>" +
      '<div class="card card-pad" style="margin:16px 0">' + ratingBreakdown(reviews) + "</div>" +
      (reviews.length ? reviews.slice(0, 8).map(reviewBlock).join("")
        : U.empty("No reviews yet", "Reviews appear once a guest has checked out and the note has been approved.")) +
      "</section>" +

      '<section data-panel="location" hidden><h2>Where you will be</h2>' +
      '<p class="muted">' + esc(h.address) + "</p>" + mapBlock(h) +
      '<h3 style="margin-top:24px">Nearby</h3><div class="grid grid-2">' +
      [["Old town", 0.6], ["Central station", 1.4], ["Airport", 12.5], ["Nearest beach or park", 0.9]].map(function (n, i) {
        return '<div class="card card-pad row between"><span>' + esc(n[0]) + '</span><span class="mono small muted">' +
          (n[1] + AZ.rnd(h.id + i)).toFixed(1) + " km</span></div>";
      }).join("") + "</div></section>" +

      '<section data-panel="policies" hidden><h2>Policies</h2>' +
      '<div class="stack">' + [
        ["Check-in and check-out", "Check-in from " + h.checkIn + ", check-out by " + h.checkOut + ". Late check-out until 14:00 is " + money(35) + " when the room is free."],
        ["Cancellation", h.freeCancellation ? "Cancel free of charge up to 24 hours before arrival. After that the first night is charged." : "This property sells non-refundable rates only. Dates cannot be moved."],
        ["Children and beds", "Children under 6 stay free in an existing bed. Cots are free; extra beds are " + money(30) + " per night."],
        ["Payment", "Cards are pre-authorised at booking and charged on arrival. Cash is accepted at the desk."],
        ["Damage and smoking", "Smoking indoors carries a " + money(180) + " cleaning charge. Damage is billed at cost with photographs."]
      ].map(function (p) {
        return '<div class="card card-pad"><h4>' + esc(p[0]) + '</h4><p class="small muted" style="margin:0">' + esc(p[1]) + "</p></div>";
      }).join("") + "</div></section>" +

      '<section data-panel="faq" hidden><h2>Questions guests ask</h2>' +
      '<div class="stack">' + faqs.map(function (f, i) {
        return '<details class="card card-pad"' + (i === 0 ? " open" : "") + "><summary><strong>" + esc(f[0]) +
          '</strong></summary><p class="small muted" style="margin:10px 0 0">' + esc(f[1]) + "</p></details>";
      }).join("") + "</div></section>" +

      "</div>" +
      '<aside><div class="card card-pad sticky-side stack">' +
      '<div><div class="small muted">From</div><div class="price">' + money(h.priceFrom) + " <small>/ night</small></div></div>" +
      '<div class="small muted">' + U.range(s.checkIn, s.checkOut) + " · " + AZ.nights(s.checkIn, s.checkOut) + " nights</div>" +
      U.rail(AZ.hotelRail(h, s.checkIn, 14), { label: "Availability" }) +
      '<a class="btn btn-primary btn-block" href="#" data-goto-rooms>See ' + rooms.length + " rooms</a>" +
      '<div class="small muted center">' + (h.freeCancellation ? "Free cancellation until 24h before arrival" : "Non-refundable rate") + "</div>" +
      '<hr style="border:0;border-top:1px solid var(--border);width:100%">' +
      '<div class="row" style="gap:10px">' + I("phone") + '<div><div class="small"><strong>Front desk</strong></div>' +
      '<div class="small muted mono">+351 210 ' + (100 + (AZ.hash(h.id) % 800)) + " " + (100 + (AZ.hash(h.name) % 800)) + "</div></div></div>" +
      "</div></aside></div></div>";

    return {
      title: h.name + " — Azure Stay",
      html: html,
      mount: function (root) {
        wireFavs(root);
        function show(name) {
          U.qsa("[data-panel]", root).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
          U.qsa("[data-tab]", root).forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
        }
        U.on(root, "click", "[data-tab]", function (e, b) { show(b.getAttribute("data-tab")); });
        U.on(root, "click", "[data-goto-rooms]", function (e) { e.preventDefault(); show("rooms"); U.qs('[data-panel="rooms"]', root).scrollIntoView({ behavior: "smooth", block: "start" }); });
        U.on(root, "click", "[data-shot]", function (e, b) {
          var i = +b.getAttribute("data-shot");
          U.modal({
            title: h.name + " — photo " + (i + 1) + " of 5",
            wide: true,
            body: '<div style="border-radius:12px;overflow:hidden">' + scene(h.id, i === 0 ? h.kind : i % 2 ? "room" : h.kind, i) + "</div>" +
              '<p class="small muted" style="margin-top:12px">' + esc(h.name) + ", " + esc(h.city) + ". Images on this demo are generated, not photographed.</p>"
          });
        });
      }
    };
  }

  function roomRow(r, h) {
    return '<article class="card" style="overflow:hidden"><div class="split" style="gap:0">' +
      '<div style="padding:18px"><div class="row between wrap">' +
      "<div><h3 style=\"margin-bottom:4px\">" + esc(r.type) + " · " + esc(r.view) + "</h3>" +
      '<div class="row wrap small muted" style="gap:14px"><span>' + I("bed") + " " + esc(r.beds) + "</span>" +
      "<span>" + I("users") + " up to " + r.capacity + "</span><span>" + r.size + " m²</span>" +
      "<span>Room " + esc(r.number) + ", floor " + r.floor + "</span></div></div></div>" +
      '<div class="amenity-row" style="margin-top:12px">' + r.amenities.slice(0, 5).map(U.amenityBadge).join("") + "</div>" +
      '<div style="margin-top:14px">' + U.rail(AZ.railFor(r, Store.state.search.checkIn, 14), { label: "Rate rail", legend: false }) + "</div></div>" +
      '<div style="padding:18px;border-left:1px solid var(--border);display:flex;flex-direction:column;gap:10px;justify-content:center">' +
      '<div class="price">' + money(r.price) + ' <small>/ night</small></div>' +
      '<div class="small muted">' + esc(r.cancellation) + "</div>" +
      '<a class="btn btn-primary" href="#/room/' + r.id + '">Select room</a>' +
      '<a class="btn btn-ghost btn-sm" href="#/room/' + r.id + '">Full details</a></div></div></article>';
  }

  function ratingBreakdown(reviews) {
    var cats = ["Cleanliness", "Location", "Staff", "Comfort", "Value", "WiFi"];
    return '<div class="grid grid-3" style="gap:14px">' + cats.map(function (c, i) {
      var base = reviews.length ? reviews.reduce(function (a, r) { return a + r.rating; }, 0) / reviews.length : 8.4;
      var v = Math.max(6, Math.min(10, base + (AZ.rnd(c + reviews.length) - 0.5) * 1.4));
      return '<div><div class="row between small"><span>' + c + '</span><span class="mono">' + v.toFixed(1) + "</span></div>" +
        U.progress(v * 10, v >= 9 ? "green" : v >= 8 ? "" : "amber") + "</div>";
    }).join("") + "</div>";
  }

  function reviewBlock(rv) {
    var g = AZ.guest(rv.guestId);
    return '<article class="review"><div class="row between wrap">' +
      '<div class="row">' + U.avatar(g ? g.name : "Guest") +
      "<div><div><strong>" + esc(g ? g.name : "Verified guest") + '</strong></div>' +
      '<div class="small muted">' + esc(g ? g.nationality : "") + " · stayed " + U.date(rv.date) + "</div></div></div>" +
      '<span class="score">' + rv.rating.toFixed(1) + "</span></div>" +
      "<h4 style=\"margin:12px 0 4px\">" + esc(rv.title) + '</h4><p class="small" style="margin:0">' + esc(rv.body) + "</p>" +
      (rv.reply ? '<div class="reply"><strong>Reply from the property</strong><br>' + esc(rv.reply) + "</div>" : "") +
      "</article>";
  }

  function mapBlock(h) {
    var others = AZ.db.hotels.filter(function (x) { return x.destId === h.destId && x.id !== h.id; }).slice(0, 3);
    return '<div class="map">' +
      '<span class="pin" style="left:50%;top:52%">' + I("pin") + "<span>" + esc(h.name) + "</span></span>" +
      others.map(function (o, i) {
        return '<span class="pin alt" style="left:' + (18 + i * 26) + "%;top:" + (28 + i * 14) + '%">' + I("pin") + "<span>" + esc(o.name) + "</span></span>";
      }).join("") + "</div>";
  }

  /* ---------------- room details ---------------- */

  function room(ctx) {
    var r = AZ.room(ctx.params.id);
    if (!r) return notFound();
    var h = AZ.hotel(r.hotelId);
    var s = Store.state.search;
    var month = s.checkIn.slice(0, 7);

    var html = '<div class="container">' +
      U.crumbs([{ label: "Home", href: "#/" }, { label: h.city, href: "#/search?destination=" + encodeURIComponent(h.city) },
        { label: h.name, href: "#/hotel/" + h.id }, { label: r.type + " " + r.number }]) +
      '<div class="split"><div>' +
      '<div class="gallery">' + [0, 1, 2].map(function (i) {
        return "<button data-shot=\"" + i + '" aria-label="Photo ' + (i + 1) + '">' + scene(r.id, "room", i) + "</button>";
      }).join("") + "</div>" +
      "<h1 style=\"margin-top:22px\">" + esc(r.type) + " · " + esc(r.view) + "</h1>" +
      '<p class="muted">Room ' + esc(r.number) + " on floor " + r.floor + " at <a href=\"#/hotel/" + h.id + '">' + esc(h.name) + "</a>, " + esc(h.city) + ".</p>" +
      '<div class="grid grid-4" style="gap:12px;margin:20px 0">' + [
        ["bed", r.beds, "Beds"], ["users", "Up to " + r.capacity, "Guests"], ["home", r.size + " m²", "Size"], ["sun", r.view, "Outlook"]
      ].map(function (x) {
        return '<div class="card card-pad"><div class="row" style="gap:10px">' + I(x[0]) +
          "<div><div class=\"small muted\">" + esc(x[2]) + "</div><strong>" + esc(x[1]) + "</strong></div></div></div>";
      }).join("") + "</div>" +
      '<div class="card card-pad"><h3>What is in the room</h3>' +
      '<div class="amenity-row">' + r.amenities.map(U.amenityBadge).join("") + "</div></div>" +
      '<div class="card card-pad" style="margin-top:18px"><h3>Rate rail · next 30 nights</h3>' +
      '<p class="small muted">Each column is one night at this exact room. Hatched means it is already sold.</p>' +
      U.rail(AZ.railFor(r, s.checkIn, 30), { hideHead: true, legend: true, selected: nightsBetween(s.checkIn, s.checkOut) }) + "</div>" +
      '<div class="card card-pad" style="margin-top:18px"><h3>Availability calendar</h3>' +
      '<p class="small muted">Prices under each date are what that night costs. Pick a check-in, then a check-out.</p>' +
      '<div data-cal>' + U.calendar({ month: month, room: r, from: s.checkIn, to: s.checkOut }) + "</div></div>" +
      '<div class="card card-pad" style="margin-top:18px"><h3>Cancellation</h3>' +
      '<p class="small muted" style="margin:0">' + esc(r.cancellation) + " Check-in from " + h.checkIn + ", check-out by " + h.checkOut + ".</p></div>" +
      "</div>" +

      '<aside><div class="card card-pad sticky-side stack" data-book>' +
      '<div class="row between"><div><div class="small muted">Nightly from</div>' +
      '<div class="price">' + money(r.price) + "</div></div>" + U.stars(h.stars) + "</div>" +
      '<div class="form-grid" style="gap:10px">' +
      '<div class="field"><label for="b-in">Check in</label><input class="input" id="b-in" type="date" value="' + s.checkIn + '" min="' + AZ.iso(AZ.TODAY) + '"></div>' +
      '<div class="field"><label for="b-out">Check out</label><input class="input" id="b-out" type="date" value="' + s.checkOut + '" min="' + AZ.iso(AZ.addDays(AZ.TODAY, 1)) + '"></div>' +
      '<div class="field"><label for="b-adults">Adults</label><select class="select" id="b-adults">' +
      [1, 2, 3, 4].filter(function (n) { return n <= r.capacity; }).map(function (n) {
        return '<option' + (s.adults === n ? " selected" : "") + ">" + n + "</option>";
      }).join("") + "</select></div>" +
      '<div class="field"><label for="b-children">Children</label><select class="select" id="b-children">' +
      [0, 1, 2].map(function (n) { return '<option' + (s.children === n ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select></div></div>" +
      '<div data-quote></div>' +
      '<button class="btn btn-primary btn-block btn-lg" data-book-now>Book now</button>' +
      '<div class="small muted center">You will not be charged until the payment step.</div>' +
      "</div></aside></div></div>";

    return {
      title: r.type + " at " + h.name + " — Azure Stay",
      html: html,
      mount: function (root) {
        var calMonth = month;
        var pick = { from: s.checkIn, to: s.checkOut };

        function quote() {
          var q = AZ.quote(r, pick.from, pick.to);
          U.qs("[data-quote]", root).innerHTML =
            '<div class="stack" style="gap:0">' +
            '<div class="summary-line"><span>' + money(Math.round(q.roomTotal / q.nights)) + " × " + q.nights + " nights</span>" +
            '<span class="mono">' + money(q.roomTotal) + "</span></div>" +
            '<div class="summary-line"><span>Taxes (10%)</span><span class="mono">' + money(q.taxes) + "</span></div>" +
            '<div class="summary-line"><span>Service fee (5%)</span><span class="mono">' + money(q.fee) + "</span></div>" +
            '<div class="summary-line total"><span>Total</span><span class="mono">' + money(q.total) + "</span></div>" +
            (q.allFree ? "" : '<div class="badge badge-red" style="margin-top:8px">Some nights in that range are already booked</div>') +
            "</div>";
          var btn = U.qs("[data-book-now]", root);
          btn.disabled = !q.allFree;
          btn.textContent = q.allFree ? "Book now" : "Not available for those dates";
        }
        function redrawCal() {
          U.qs("[data-cal]", root).innerHTML = U.calendar({ month: calMonth, room: r, from: pick.from, to: pick.to });
        }
        quote();

        U.on(root, "click", "[data-cal-prev]", function () {
          var d = AZ.parse(calMonth + "-01"); d.setMonth(d.getMonth() - 1);
          calMonth = AZ.iso(d).slice(0, 7); redrawCal();
        });
        U.on(root, "click", "[data-cal-next]", function () {
          var d = AZ.parse(calMonth + "-01"); d.setMonth(d.getMonth() + 1);
          calMonth = AZ.iso(d).slice(0, 7); redrawCal();
        });
        U.on(root, "click", "[data-day]", function (e, b) {
          var ds = b.getAttribute("data-day");
          if (!pick.from || pick.to || ds <= pick.from) { pick.from = ds; pick.to = ""; }
          else pick.to = ds;
          if (pick.from && pick.to) {
            U.qs("#b-in", root).value = pick.from;
            U.qs("#b-out", root).value = pick.to;
            Store.patchSearch({ checkIn: pick.from, checkOut: pick.to });
            quote();
          }
          redrawCal();
        });
        ["#b-in", "#b-out"].forEach(function (sel) {
          U.qs(sel, root).addEventListener("change", function () {
            var from = U.qs("#b-in", root).value, to = U.qs("#b-out", root).value;
            if (to <= from) { to = AZ.iso(AZ.addDays(AZ.parse(from), 1)); U.qs("#b-out", root).value = to; }
            pick.from = from; pick.to = to;
            Store.patchSearch({ checkIn: from, checkOut: to });
            calMonth = from.slice(0, 7);
            redrawCal(); quote();
          });
        });
        U.on(root, "click", "[data-shot]", function (e, b) {
          U.modal({ title: r.type + " — photo " + (+b.getAttribute("data-shot") + 1), wide: true,
            body: '<div style="border-radius:12px;overflow:hidden">' + scene(r.id, "room", +b.getAttribute("data-shot")) + "</div>" });
        });
        U.on(root, "click", "[data-book-now]", function () {
          var adults = +U.qs("#b-adults", root).value, children = +U.qs("#b-children", root).value;
          Store.patchSearch({ adults: adults, children: children });
          Store.startDraft({
            roomId: r.id, hotelId: h.id, checkIn: pick.from, checkOut: pick.to,
            adults: adults, children: children, rooms: 1, promo: "", step: "guest"
          });
          location.hash = "#/booking";
        });
      }
    };
  }

  function nightsBetween(a, b) {
    var out = [], d = AZ.parse(a);
    while (AZ.iso(d) < b) { out.push(AZ.iso(d)); d = AZ.addDays(d, 1); }
    return out;
  }

  /* ---------------- booking: guest details + review ---------------- */

  function steps(current) {
    var list = [["search", "Search"], ["room", "Room"], ["guest", "Guest details"], ["review", "Review"], ["payment", "Payment"], ["done", "Confirmation"]];
    var idx = list.map(function (s) { return s[0]; }).indexOf(current);
    return '<div class="steps">' + list.map(function (s, i) {
      var cls = i < idx ? "done" : i === idx ? "now" : "";
      return '<span class="step ' + cls + '"><b>' + (i < idx ? "✓" : i + 1) + "</b>" + s[1] + "</span>";
    }).join("") + "</div>";
  }

  function draftSummary(draft, quote) {
    var h = AZ.hotel(draft.hotelId), r = AZ.room(draft.roomId);
    return '<div class="card card-pad sticky-side stack">' +
      '<div style="border-radius:12px;overflow:hidden;aspect-ratio:16/9">' + scene(h.id, h.kind, 0) + "</div>" +
      "<div><h3 style=\"margin-bottom:2px\">" + esc(h.name) + "</h3>" +
      '<div class="small muted">' + esc(h.city + ", " + h.country) + "</div></div>" +
      "<dl class=\"kv\"><dt>Room</dt><dd>" + esc(r.type + " · " + r.view) + "</dd>" +
      "<dt>Dates</dt><dd>" + U.range(draft.checkIn, draft.checkOut) + "</dd>" +
      "<dt>Nights</dt><dd>" + quote.nights + "</dd>" +
      "<dt>Guests</dt><dd>" + draft.adults + " adults" + (draft.children ? ", " + draft.children + " children" : "") + "</dd></dl>" +
      '<div class="stack" style="gap:0">' +
      '<div class="summary-line"><span>Room total</span><span class="mono">' + money(quote.roomTotal) + "</span></div>" +
      (quote.discount ? '<div class="summary-line"><span>Discount' + (quote.promo ? " · " + esc(quote.promo.code) : "") +
        '</span><span class="mono" style="color:var(--success)">−' + money(quote.discount) + "</span></div>" : "") +
      '<div class="summary-line"><span>Taxes</span><span class="mono">' + money(quote.taxes) + "</span></div>" +
      '<div class="summary-line"><span>Service fee</span><span class="mono">' + money(quote.fee) + "</span></div>" +
      '<div class="summary-line total"><span>Total</span><span class="mono">' + money(quote.total) + "</span></div></div>" +
      '<div class="small muted">' + esc(r.cancellation) + "</div></div>";
  }

  function booking() {
    var draft = Store.state.draft;
    if (!draft) return needRoom();
    var q = AZ.quote(AZ.room(draft.roomId), draft.checkIn, draft.checkOut, draft.promo);
    var g = Store.currentGuest();

    var html = '<div class="container">' + steps("guest") +
      '<div class="split"><div><h1>Who is staying?</h1>' +
      '<p class="muted">We pass the name on the booking to the front desk. It has to match the ID shown at check-in.</p>' +
      '<form class="card card-pad" data-guest-form novalidate>' +
      '<div class="form-grid">' +
      U.field({ name: "first", label: "First name", required: true, value: g ? g.first : "", autocomplete: "given-name" }) +
      U.field({ name: "last", label: "Last name", required: true, value: g ? g.last : "", autocomplete: "family-name" }) +
      U.field({ name: "email", label: "Email", type: "email", required: true, value: g ? g.email : "", hint: "The confirmation and receipt go here.", autocomplete: "email" }) +
      U.field({ name: "phone", label: "Phone", required: true, value: g ? g.phone : "", hint: "Used only if the property needs to reach you on the day.", autocomplete: "tel" }) +
      U.field({ name: "nationality", label: "Nationality", type: "select", value: g ? g.nationality : "Portugal",
        options: ["Portugal", "Japan", "Germany", "Brazil", "Canada", "France", "Nigeria", "Sweden", "Italy", "Thailand",
          "Netherlands", "South Africa", "Spain", "India", "Denmark", "United Kingdom", "Australia", "Mexico", "Singapore", "Norway"] }) +
      U.field({ name: "arrival", label: "Estimated arrival", type: "select", value: "15:00 – 18:00",
        options: ["Before 14:00", "14:00 – 15:00", "15:00 – 18:00", "18:00 – 21:00", "After 21:00", "Not sure yet"] }) +
      U.field({ name: "requests", label: "Special requests", type: "textarea", full: true,
        placeholder: "High floor, late arrival, cot for a baby — anything the desk should know.", hint: "Requests are passed on, not guaranteed." }) +
      '<label class="check full"><input type="checkbox" name="terms"> <span>I have read the ' +
      '<a href="#/terms">booking terms</a> and the cancellation policy for this rate.</span>' +
      '<span class="field-error" data-error-for="terms"></span></label>' +
      "</div>" +
      '<div class="row end" style="margin-top:18px;gap:10px">' +
      '<a class="btn btn-ghost" href="#/room/' + draft.roomId + '">Back to room</a>' +
      '<button class="btn btn-primary" type="submit">Review booking ' + I("arrowRight") + "</button></div></form></div>" +
      "<aside>" + draftSummary(draft, q) + "</aside></div></div>";

    return {
      title: "Guest details — Azure Stay",
      html: html,
      mount: function (root) {
        var form = U.qs("[data-guest-form]", root);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var res = U.validate(form, {
            first: "required|min2", last: "required|min2", email: "required|email",
            phone: "required|phone", terms: "checked"
          });
          if (!res.ok) { U.toast("Check the highlighted fields", { tone: "warn" }); return; }
          Store.patchDraft({
            guest: {
              first: res.values.first, last: res.values.last, email: res.values.email, phone: res.values.phone,
              nationality: form.elements.nationality.value, arrival: form.elements.arrival.value,
              requests: form.elements.requests.value
            },
            step: "review"
          });
          location.hash = "#/review";
        });
      }
    };
  }

  function review() {
    var draft = Store.state.draft;
    if (!draft || !draft.guest) return needRoom();
    var q = AZ.quote(AZ.room(draft.roomId), draft.checkIn, draft.checkOut, draft.promo);
    var h = AZ.hotel(draft.hotelId), r = AZ.room(draft.roomId);

    var html = '<div class="container">' + steps("review") +
      '<div class="split"><div><h1>Check this over</h1>' +
      '<p class="muted">Nothing has been charged yet. The next step takes payment and issues the booking reference.</p>' +

      '<div class="card card-pad"><div class="row between"><h3 style="margin:0">Your stay</h3>' +
      '<a class="btn btn-ghost btn-sm" href="#/room/' + r.id + '">' + I("edit") + "Change</a></div>" +
      '<dl class="kv" style="margin-top:14px">' +
      "<dt>Property</dt><dd>" + esc(h.name) + ", " + esc(h.city) + "</dd>" +
      "<dt>Room</dt><dd>" + esc(r.type + " · " + r.view + " · room " + r.number) + "</dd>" +
      "<dt>Check in</dt><dd>" + U.date(draft.checkIn, true) + " from " + h.checkIn + "</dd>" +
      "<dt>Check out</dt><dd>" + U.date(draft.checkOut, true) + " by " + h.checkOut + "</dd>" +
      "<dt>Guests</dt><dd>" + draft.adults + " adults" + (draft.children ? ", " + draft.children + " children" : "") + "</dd></dl></div>" +

      '<div class="card card-pad" style="margin-top:16px"><div class="row between"><h3 style="margin:0">Guest</h3>' +
      '<a class="btn btn-ghost btn-sm" href="#/booking">' + I("edit") + "Change</a></div>" +
      '<dl class="kv" style="margin-top:14px">' +
      "<dt>Name</dt><dd>" + esc(draft.guest.first + " " + draft.guest.last) + "</dd>" +
      "<dt>Email</dt><dd>" + esc(draft.guest.email) + "</dd>" +
      "<dt>Phone</dt><dd>" + esc(draft.guest.phone) + "</dd>" +
      "<dt>Arrival</dt><dd>" + esc(draft.guest.arrival) + "</dd>" +
      (draft.guest.requests ? "<dt>Requests</dt><dd>" + esc(draft.guest.requests) + "</dd>" : "") + "</dl></div>" +

      '<div class="card card-pad" style="margin-top:16px"><h3>Night by night</h3>' +
      '<div class="stack" style="gap:0">' + q.lines.map(function (l) {
        return '<div class="summary-line"><span>' + AZ.dayName(l.date) + " " + U.date(l.date) + '</span><span class="mono">' + money(l.price) + "</span></div>";
      }).join("") + "</div></div>" +

      '<div class="row end" style="margin-top:18px;gap:10px">' +
      '<a class="btn btn-ghost" href="#/booking">Back</a>' +
      '<a class="btn btn-primary" href="#/payment">Go to payment ' + I("arrowRight") + "</a></div></div>" +
      "<aside>" + draftSummary(draft, q) + "</aside></div></div>";

    return { title: "Review booking — Azure Stay", html: html, mount: function () {} };
  }

  /* ---------------- payment ---------------- */

  function payment() {
    var draft = Store.state.draft;
    if (!draft || !draft.guest) return needRoom();
    var q = AZ.quote(AZ.room(draft.roomId), draft.checkIn, draft.checkOut, draft.promo);

    var methods = [
      ["Credit card", "creditCard", "Visa, Mastercard, Amex. Pre-authorised now, charged on arrival."],
      ["Debit card", "creditCard", "Charged immediately. Refunds take 3–5 working days."],
      ["QR payment", "phone", "Scan with your banking app. Confirmation is instant."],
      ["Cash at hotel", "receipt", "Pay the full amount at the desk. The card is held as a guarantee only."]
    ];

    var html = '<div class="container">' + steps("payment") +
      '<div class="split"><div><h1>Payment</h1>' +
      '<p class="muted">This is a portfolio demo. Card details are validated in the browser and never sent anywhere.</p>' +

      '<form class="card card-pad" data-pay novalidate>' +
      "<h3>How would you like to pay?</h3>" +
      '<div class="grid grid-2" style="gap:12px;margin:14px 0">' + methods.map(function (m, i) {
        return '<label class="card card-pad check" style="align-items:flex-start;cursor:pointer">' +
          '<input type="radio" name="method" value="' + esc(m[0]) + '"' + (i === 0 ? " checked" : "") + ">" +
          "<span><strong>" + esc(m[0]) + '</strong><br><span class="small muted">' + esc(m[2]) + "</span></span></label>";
      }).join("") + "</div>" +

      '<div data-card-fields><div class="form-grid">' +
      U.field({ name: "cardName", label: "Name on card", required: true, full: true, autocomplete: "cc-name" }) +
      U.field({ name: "cardNumber", label: "Card number", required: true, full: true, placeholder: "4242 4242 4242 4242", autocomplete: "cc-number" }) +
      U.field({ name: "expiry", label: "Expiry", required: true, placeholder: "MM/YY", autocomplete: "cc-exp" }) +
      U.field({ name: "cvc", label: "Security code", required: true, placeholder: "123", autocomplete: "cc-csc" }) +
      "</div></div>" +

      '<div class="card card-pad" style="margin-top:16px;background:var(--surface-2)">' +
      '<div class="row wrap" style="gap:10px"><div class="field grow"><label for="promo">Promo code</label>' +
      '<input class="input" id="promo" name="promo" placeholder="Try STAY15" value="' + esc(draft.promo || "") + '"></div>' +
      '<button class="btn btn-outline" type="button" data-apply style="align-self:end">Apply</button></div>' +
      '<div class="small muted" style="margin-top:8px" data-promo-msg>' +
      (q.promo ? q.promo.code + " applied — " + (q.promo.unit === "%" ? q.promo.value + "% off" : money(q.promo.value) + " off") : "Codes are case-insensitive. Minimum stays apply.") +
      "</div></div>" +

      '<label class="check" style="margin-top:16px"><input type="checkbox" name="confirm">' +
      "<span>I understand the cancellation policy and authorise Azure Stay to hold this amount.</span>" +
      '<span class="field-error" data-error-for="confirm"></span></label>' +

      '<div class="row end" style="margin-top:18px;gap:10px">' +
      '<a class="btn btn-ghost" href="#/review">Back</a>' +
      '<button class="btn btn-primary btn-lg" type="submit">' + I("lock") + "Pay " + money(q.total) + "</button></div></form></div>" +
      "<aside>" + draftSummary(draft, q) + "</aside></div></div>";

    return {
      title: "Payment — Azure Stay",
      html: html,
      mount: function (root) {
        var form = U.qs("[data-pay]", root);
        function toggleCard() {
          var m = form.elements.method.value;
          U.qs("[data-card-fields]", root).classList.toggle("hide", m === "Cash at hotel" || m === "QR payment");
        }
        U.on(form, "change", '[name="method"]', toggleCard);
        toggleCard();

        U.on(form, "click", "[data-apply]", function () {
          var code = form.elements.promo.value.trim();
          Store.patchDraft({ promo: code });
          var q2 = AZ.quote(AZ.room(draft.roomId), draft.checkIn, draft.checkOut, code);
          var msg = U.qs("[data-promo-msg]", root);
          if (q2.promo) {
            msg.textContent = q2.promo.code + " applied — you save " + money(q2.discount) + ".";
            U.toast("Promo applied", { body: "New total " + money(q2.total) + ".", tone: "ok" });
            location.hash = "#/payment";
            window.Router.reload();
          } else {
            msg.textContent = code ? "That code is not active for these dates or this length of stay." : "Enter a code first.";
            U.toast("Code not applied", { tone: "warn", body: "Active codes are listed on the home page." });
          }
        });

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var m = form.elements.method.value;
          var schema = { confirm: "checked" };
          if (m === "Credit card" || m === "Debit card") {
            schema.cardName = "required|min2";
            schema.cardNumber = "required|card";
            schema.expiry = "required|expiry";
            schema.cvc = "required|cvc";
          }
          var res = U.validate(form, schema);
          if (!res.ok) { U.toast("Payment not sent", { tone: "warn", body: "Check the highlighted fields." }); return; }

          var btn = U.qs('button[type="submit"]', form);
          btn.disabled = true;
          btn.textContent = "Processing…";
          setTimeout(function () {
            var guest = Store.currentGuest();
            if (!guest) {
              guest = {
                id: "AZ-G" + String(AZ.db.guests.length + 1).padStart(4, "0"),
                first: draft.guest.first, last: draft.guest.last, name: draft.guest.first + " " + draft.guest.last,
                email: draft.guest.email, phone: draft.guest.phone, nationality: draft.guest.nationality,
                tier: "Classic", preferences: [], joined: AZ.iso(AZ.TODAY), bookings: 0, spend: 0
              };
              AZ.db.guests.push(guest);
            }
            var q3 = AZ.quote(AZ.room(draft.roomId), draft.checkIn, draft.checkOut, draft.promo);
            var booking = AZ.addBooking({
              guestId: guest.id, hotelId: draft.hotelId, roomId: draft.roomId,
              checkIn: draft.checkIn, checkOut: draft.checkOut, nights: q3.nights,
              adults: draft.adults, children: draft.children, rooms: 1,
              status: "Confirmed", payment: m === "Cash at hotel" ? "Pending" : "Paid", method: m,
              source: "Website", roomTotal: q3.roomTotal, discount: q3.discount, taxes: q3.taxes, fee: q3.fee,
              total: q3.total, requests: draft.guest.requests || "", createdAt: AZ.iso(AZ.TODAY)
            });
            guest.bookings++; guest.spend += q3.total;
            AZ.save();
            Store.clearDraft();
            location.hash = "#/confirmation/" + booking.id;
          }, 900);
        });
      }
    };
  }

  /* ---------------- confirmation ---------------- */

  function confirmation(ctx) {
    var b = AZ.booking(ctx.params.id);
    if (!b) return notFound();
    var h = AZ.hotel(b.hotelId), r = AZ.room(b.roomId), g = AZ.guest(b.guestId);

    var html = '<div class="container">' + steps("done") +
      '<div class="card card-pad center" style="border-color:var(--success)">' +
      '<div class="ico" style="width:56px;height:56px;border-radius:16px;background:var(--success-soft);color:#15803d;display:grid;place-items:center;margin:0 auto 14px">' +
      I("checkCircle") + "</div>" +
      "<h1 style=\"margin-bottom:6px\">You are booked</h1>" +
      '<p class="muted">A confirmation is on its way to ' + esc(g ? g.email : "your inbox") + ". Show the reference at the desk.</p>" +
      '<div class="mono" style="font-size:26px;font-weight:600;letter-spacing:.05em;margin:12px 0">' + esc(b.id) + "</div>" +
      '<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">' +
      '<button class="btn btn-primary" data-print>' + I("printer") + "Download receipt</button>" +
      '<a class="btn btn-outline" href="#/account/bookings">My bookings</a>' +
      '<a class="btn btn-ghost" href="#/">Back to home</a></div></div>' +

      '<div class="split" style="margin-top:22px"><div class="card card-pad">' +
      "<h3>Stay summary</h3><dl class=\"kv\" style=\"margin-top:12px\">" +
      "<dt>Property</dt><dd>" + esc(h.name) + ", " + esc(h.city) + "</dd>" +
      "<dt>Address</dt><dd>" + esc(h.address) + "</dd>" +
      "<dt>Room</dt><dd>" + esc(r.type + " · " + r.view + " · room " + r.number) + "</dd>" +
      "<dt>Guest</dt><dd>" + esc(g ? g.name : "") + "</dd>" +
      "<dt>Check in</dt><dd>" + U.date(b.checkIn, true) + " from " + h.checkIn + "</dd>" +
      "<dt>Check out</dt><dd>" + U.date(b.checkOut, true) + " by " + h.checkOut + "</dd>" +
      "<dt>Guests</dt><dd>" + b.adults + " adults" + (b.children ? ", " + b.children + " children" : "") + "</dd>" +
      "<dt>Payment</dt><dd>" + esc(b.method) + " · " + U.pill(b.payment) + "</dd>" +
      (b.requests ? "<dt>Requests</dt><dd>" + esc(b.requests) + "</dd>" : "") +
      "</dl></div>" +
      '<aside class="card card-pad stack">' +
      "<h3 style=\"margin:0\">Receipt</h3>" +
      '<div class="stack" style="gap:0">' +
      '<div class="summary-line"><span>Room · ' + b.nights + ' nights</span><span class="mono">' + money(b.roomTotal) + "</span></div>" +
      (b.discount ? '<div class="summary-line"><span>Discount</span><span class="mono" style="color:var(--success)">−' + money(b.discount) + "</span></div>" : "") +
      '<div class="summary-line"><span>Taxes</span><span class="mono">' + money(b.taxes) + "</span></div>" +
      '<div class="summary-line"><span>Service fee</span><span class="mono">' + money(b.fee) + "</span></div>" +
      '<div class="summary-line total"><span>Paid</span><span class="mono">' + money(b.total) + "</span></div></div>" +
      '<div class="small muted">Invoice available in your account under Payments.</div></aside></div></div>';

    return {
      title: "Booking " + b.id + " — Azure Stay",
      html: html,
      mount: function (root) {
        U.on(root, "click", "[data-print]", function () { window.print(); });
        U.toast("Booking confirmed", { body: b.id + " at " + h.name, tone: "ok" });
      }
    };
  }

  function needRoom() {
    return {
      title: "Pick a room first — Azure Stay",
      html: '<div class="container section">' + U.empty("No booking in progress",
        "Choose a property and a room, and the booking steps will pick up from there.",
        '<a class="btn btn-primary" href="#/search">Search hotels</a>') + "</div>",
      mount: function () {}
    };
  }

  /* ---------------- auth ---------------- */

  function authShell(title, lede, body, footer) {
    return '<div class="container" style="max-width:520px;padding-top:40px">' +
      '<div class="card card-pad">' +
      "<h1 style=\"font-size:28px\">" + esc(title) + '</h1><p class="muted">' + esc(lede) + "</p>" +
      body + "</div>" + (footer || "") + "</div>";
  }

  function login(ctx) {
    var next = ctx.query.next || "#/account";
    var body = '<form data-login novalidate class="stack">' +
      U.field({ name: "email", label: "Email", type: "email", required: true, value: "guest@azurestay.example", autocomplete: "username" }) +
      U.field({ name: "password", label: "Password", type: "password", required: true, value: "azure2026", autocomplete: "current-password" }) +
      '<div class="row between"><label class="check"><input type="checkbox" checked> <span class="small">Keep me signed in</span></label>' +
      '<a class="small" href="#/forgot">Forgot password?</a></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Sign in</button>' +
      '<div class="center small muted">New here? <a href="#/register">Create an account</a></div></form>';

    var footer = '<div class="card card-pad" style="margin-top:16px">' +
      '<div class="tiny muted">Demo accounts — click to fill</div>' +
      '<div class="stack" style="margin-top:10px;gap:8px">' + Store.accounts.map(function (a) {
        return '<button class="btn btn-outline btn-sm" data-acct="' + a.email + '" style="justify-content:space-between">' +
          "<span>" + esc(a.role === "guest" ? "Guest" : a.role === "staff" ? "Front desk" : "Administrator") + "</span>" +
          '<span class="mono small">' + esc(a.email) + "</span></button>";
      }).join("") + '</div><div class="small muted" style="margin-top:10px">Password for all three: <span class="mono">azure2026</span></div></div>';

    return {
      title: "Sign in — Azure Stay",
      html: authShell("Welcome back", "Sign in to see your bookings, saved hotels and receipts.", body, footer),
      mount: function (root) {
        U.on(root, "click", "[data-acct]", function (e, b) {
          root.querySelector('[name="email"]').value = b.getAttribute("data-acct");
          root.querySelector('[name="password"]').value = "azure2026";
        });
        var form = U.qs("[data-login]", root);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var res = U.validate(form, { email: "required|email", password: "required" });
          if (!res.ok) return;
          var user = Store.login(res.values.email, res.values.password);
          if (!user) {
            U.qs('[data-error-for="password"]', form).textContent = "That email and password do not match a demo account.";
            return;
          }
          U.toast("Signed in", { body: "Hello, " + user.name + ".", tone: "ok" });
          location.hash = user.role === "guest" ? next : "#/admin";
        });
      }
    };
  }

  function register() {
    var body = '<form data-register novalidate><div class="form-grid">' +
      U.field({ name: "first", label: "First name", required: true }) +
      U.field({ name: "last", label: "Last name", required: true }) +
      U.field({ name: "email", label: "Email", type: "email", required: true, full: true }) +
      U.field({ name: "phone", label: "Phone", required: true }) +
      U.field({ name: "nationality", label: "Nationality", type: "select", options: ["Portugal", "Japan", "Germany", "Brazil", "Canada", "France", "Nigeria", "Sweden", "Italy", "Thailand"] }) +
      U.field({ name: "password", label: "Password", type: "password", required: true, full: true, hint: "At least 8 characters." }) +
      '<label class="check full"><input type="checkbox" name="terms"> <span>I agree to the <a href="#/terms">terms</a> and <a href="#/privacy">privacy policy</a>.</span>' +
      '<span class="field-error" data-error-for="terms"></span></label></div>' +
      '<button class="btn btn-primary btn-block" type="submit" style="margin-top:18px">Create account</button>' +
      '<div class="center small muted" style="margin-top:12px">Already have one? <a href="#/login">Sign in</a></div></form>';

    return {
      title: "Create account — Azure Stay",
      html: authShell("Create your account", "One account covers bookings, saved hotels and receipts across all twenty properties.", body),
      mount: function (root) {
        var form = U.qs("[data-register]", root);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var res = U.validate(form, {
            first: "required|min2", last: "required|min2", email: "required|email",
            phone: "required|phone", password: "required|password", terms: "checked"
          });
          if (!res.ok) return;
          Store.register({
            first: res.values.first, last: res.values.last, email: res.values.email,
            phone: res.values.phone, nationality: form.elements.nationality.value
          });
          U.toast("Account created", { body: "You are signed in.", tone: "ok" });
          location.hash = "#/account";
        });
      }
    };
  }

  function forgot() {
    var body = '<form data-forgot novalidate class="stack">' +
      U.field({ name: "email", label: "Email", type: "email", required: true, hint: "We send a reset link that expires in 30 minutes." }) +
      '<button class="btn btn-primary btn-block" type="submit">Send reset link</button>' +
      '<div class="center small muted"><a href="#/login">Back to sign in</a></div></form>';
    return {
      title: "Reset password — Azure Stay",
      html: authShell("Reset your password", "Enter the email on the account and we will send a link.", body),
      mount: function (root) {
        var form = U.qs("[data-forgot]", root);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var res = U.validate(form, { email: "required|email" });
          if (!res.ok) return;
          U.toast("Check your inbox", { body: "A reset link is on the way to " + res.values.email + ".", tone: "ok" });
          form.reset();
        });
      }
    };
  }

  /* ---------------- content pages ---------------- */

  function about() {
    var html = '<div class="container section">' +
      '<span class="eyebrow">About</span><h1>Twenty properties, one standard</h1>' +
      '<p class="lede muted" style="max-width:70ch">Azure Stay started with one guesthouse in Lisbon and a complaint: nobody could tell what a room actually cost on a given night until they were three screens deep. Every property we have added since publishes its nightly rates up front.</p>' +
      '<div class="grid grid-3" style="margin-top:32px">' + [
        ["Rates in the open", "Every hotel and room shows fourteen nights of real prices and real availability before you pick dates."],
        ["No fee theatre", "Taxes and the service fee are in the total from the first screen. Nothing is added at the desk."],
        ["Staffed properly", "A 24-hour front desk at every property, and housekeeping targets we publish internally."]
      ].map(function (c) {
        return '<div class="card card-pad"><h3>' + esc(c[0]) + '</h3><p class="small muted" style="margin:0">' + esc(c[1]) + "</p></div>";
      }).join("") + "</div>" +
      '<div class="grid grid-4" style="margin-top:32px">' + [
        [AZ.db.hotels.length, "properties"], [AZ.db.rooms.length, "rooms"], ["12", "cities"], [AZ.db.guests.length + "+", "guests hosted"]
      ].map(function (s) {
        return '<div class="card card-pad center"><div class="v mono" style="font-size:30px;font-weight:600">' + s[0] + "</div>" +
          '<div class="small muted">' + s[1] + "</div></div>";
      }).join("") + "</div></div>";
    return { title: "About — Azure Stay", html: html, mount: function () {} };
  }

  function contact() {
    var html = '<div class="container section"><div class="split">' +
      '<div><span class="eyebrow">Contact</span><h1>Talk to a person</h1>' +
      '<p class="muted">Reservations answer within an hour between 07:00 and 23:00 CET. For anything about a stay in progress, call the property directly — the number is on your confirmation.</p>' +
      '<form class="card card-pad" data-contact novalidate><div class="form-grid">' +
      U.field({ name: "name", label: "Your name", required: true }) +
      U.field({ name: "email", label: "Email", type: "email", required: true }) +
      U.field({ name: "topic", label: "Topic", type: "select", full: true,
        options: ["A booking I already have", "A booking I want to make", "Billing or receipts", "Accessibility", "Press", "Something else"] }) +
      U.field({ name: "message", label: "Message", type: "textarea", required: true, full: true }) +
      "</div><button class=\"btn btn-primary\" type=\"submit\" style=\"margin-top:16px\">Send message</button></form></div>" +
      '<aside class="stack">' + [
        ["phone", "Reservations", "+351 210 555 010"],
        ["mail", "Email", "stay@azurestay.example"],
        ["clock", "Hours", "07:00 – 23:00 CET, seven days"],
        ["building", "Head office", "Rua da Alfândega 42, Lisbon"]
      ].map(function (c) {
        return '<div class="card card-pad row" style="gap:12px">' + I(c[0]) +
          "<div><div class=\"small muted\">" + esc(c[1]) + "</div><strong>" + esc(c[2]) + "</strong></div></div>";
      }).join("") + "</aside></div></div>";

    return {
      title: "Contact — Azure Stay",
      html: html,
      mount: function (root) {
        var form = U.qs("[data-contact]", root);
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var res = U.validate(form, { name: "required|min2", email: "required|email", message: "required|min2" });
          if (!res.ok) return;
          U.toast("Message sent", { body: "Reservations will reply to " + res.values.email + ".", tone: "ok" });
          form.reset();
        });
      }
    };
  }

  function faq() {
    var groups = [
      ["Booking", [
        ["Do I need an account to book?", "No. You can book as a guest; the confirmation and receipt go to the email on the booking. Creating an account afterwards links the stay automatically."],
        ["Why does the price change by night?", "Rates move with the day of the week and the season. The rate rail on every hotel and room shows exactly which nights are cheaper."],
        ["Can I hold a room?", "Rooms are held for 20 minutes once you reach the payment step."]
      ]],
      ["Payment", [
        ["When am I charged?", "Credit cards are pre-authorised at booking and charged on arrival. Debit cards are charged immediately."],
        ["Can I pay at the hotel?", "Yes, choose Cash at hotel. A card is still held as a guarantee."],
        ["Where is my invoice?", "Under Payments in your account, from the morning after check-out."]
      ]],
      ["Changes", [
        ["How do I cancel?", "Open the booking under My bookings and choose Cancel. Free-cancellation rates refund in full up to 24 hours before arrival."],
        ["Can I change dates?", "Cancel and rebook is the cleanest route. If the rate has moved, reservations can usually match the original."],
        ["What if I arrive late?", "Tell us in the arrival field. Every property is staffed 24 hours."]
      ]]
    ];
    var html = '<div class="container section"><span class="eyebrow">Help</span><h1>Frequently asked questions</h1>' +
      groups.map(function (g) {
        return "<h2 style=\"margin-top:32px\">" + esc(g[0]) + '</h2><div class="stack">' + g[1].map(function (q) {
          return '<details class="card card-pad"><summary><strong>' + esc(q[0]) + "</strong></summary>" +
            '<p class="small muted" style="margin:10px 0 0">' + esc(q[1]) + "</p></details>";
        }).join("") + "</div>";
      }).join("") + "</div>";
    return { title: "FAQ — Azure Stay", html: html, mount: function () {} };
  }

  function legal(kind) {
    var isPrivacy = kind === "privacy";
    var sections = isPrivacy ? [
      ["What we collect", "Name, email, phone, nationality and the details of your stay. Payment details are handled by the payment processor and never stored by us."],
      ["Why we hold it", "To run the booking, meet local guest-registration law, and send the receipt. Marketing email is opt-in and separate."],
      ["How long", "Booking records are kept for seven years for tax purposes. Marketing preferences are deleted on request, immediately."],
      ["Your choices", "Ask for a copy or a deletion at privacy@azurestay.example. We answer within 30 days."],
      ["Cookies", "One session cookie for sign-in and one preference cookie for theme and currency. No advertising trackers."]
    ] : [
      ["Booking a room", "A booking is a contract between you and the property. Azure Stay processes it and holds the payment."],
      ["Rates and taxes", "Displayed totals include local tax and the service fee. City tourist taxes, where they apply, are collected at the desk and stated on the hotel page."],
      ["Cancellation", "Free-cancellation rates can be cancelled up to 24 hours before arrival. Non-refundable rates cannot, including for no-shows."],
      ["Behaviour", "Properties may end a stay without refund for damage, smoking indoors or abuse of staff."],
      ["Liability", "We are responsible for the booking service. The property is responsible for the stay itself."]
    ];
    var html = '<div class="container section" style="max-width:820px">' +
      '<span class="eyebrow">Legal</span><h1>' + (isPrivacy ? "Privacy policy" : "Booking terms") + "</h1>" +
      '<p class="muted">Last updated ' + U.date(AZ.iso(AZ.addDays(AZ.TODAY, -34)), true) + ". This is demo copy written for a portfolio project.</p>" +
      sections.map(function (s, i) {
        return "<h3 style=\"margin-top:26px\">" + (i + 1) + ". " + esc(s[0]) + '</h3><p class="muted">' + esc(s[1]) + "</p>";
      }).join("") + "</div>";
    return { title: (isPrivacy ? "Privacy" : "Terms") + " — Azure Stay", html: html, mount: function () {} };
  }

  function errorPage(code) {
    var copy = {
      403: ["No access", "That area belongs to hotel staff. Sign in with a staff account to continue."],
      404: ["Page not found", "The link is wrong or the page has moved. The search page is the fastest way back."],
      500: ["Something broke on our side", "The booking engine returned an error. Nothing was charged. Try again in a moment."]
    }[code];
    var html = '<div class="container errorpage"><div class="code">' + code + "</div>" +
      "<h1>" + copy[0] + '</h1><p class="muted" style="max-width:46ch;margin-inline:auto">' + copy[1] + "</p>" +
      '<div class="row" style="justify-content:center;gap:10px;margin-top:20px">' +
      '<a class="btn btn-primary" href="#/">Home</a><a class="btn btn-outline" href="#/search">Search hotels</a>' +
      (code === 403 ? '<a class="btn btn-ghost" href="#/login">Sign in</a>' : "") + "</div></div>";
    return { title: code + " — Azure Stay", html: html, mount: function () {} };
  }

  function notFound() { return errorPage(404); }

  window.PagesCustomer = {
    home: home, search: search, hotel: hotel, room: room,
    booking: booking, review: review, payment: payment, confirmation: confirmation,
    login: login, register: register, forgot: forgot,
    about: about, contact: contact, faq: faq,
    privacy: function () { return legal("privacy"); },
    terms: function () { return legal("terms"); },
    error: errorPage, notFound: notFound,
    searchPanel: searchPanel, wireFavs: wireFavs, reviewBlock: reviewBlock
  };
})();
