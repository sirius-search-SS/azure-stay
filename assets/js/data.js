/* Azure Stay — data layer
   Everything is generated from a fixed seed so the demo is identical on every
   machine, then persisted to localStorage. Dates are anchored to "today", so
   the property always has arrivals today, stays in house and history behind it.
   Replace this file with API calls to swap in a real backend. */
(function () {
  "use strict";

  var SEED = 20260420;
  var KEY = "azure-stay/v1/db";

  /* ---------- deterministic randomness ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rnd(seedStr) { return mulberry32(hash(String(seedStr)))(); }

  var r = mulberry32(SEED);
  function int(min, max) { return Math.floor(r() * (max - min + 1)) + min; }
  function pick(a) { return a[Math.floor(r() * a.length)]; }
  function some(a, n) {
    var copy = a.slice(), out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
    return out;
  }
  function chance(p) { return r() < p; }
  function round(n, step) { return Math.round(n / step) * step; }

  /* ---------- dates ---------- */
  var MS = 86400000;
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  var TODAY = startOfDay(new Date());
  function addDays(date, n) { return new Date(startOfDay(date).getTime() + n * MS); }
  function iso(d) {
    var x = startOfDay(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function nights(a, b) { return Math.max(1, Math.round((parse(b) - parse(a)) / MS)); }
  function dayName(s) { return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parse(s).getDay()]; }

  /* ---------- vocabularies ---------- */
  var DESTINATIONS = [
    { id: "d1", city: "Lisbon", country: "Portugal", kind: "coast", hue: 205, blurb: "Tiled facades, tram bells and an estuary that turns copper at seven." },
    { id: "d2", city: "Kyoto", country: "Japan", kind: "garden", hue: 145, blurb: "Temple gardens raked at dawn, machiya lanes, and river dining in summer." },
    { id: "d3", city: "Cape Town", country: "South Africa", kind: "mountain", hue: 25, blurb: "A working harbour under a flat mountain, with vineyards forty minutes out." },
    { id: "d4", city: "Reykjavik", country: "Iceland", kind: "mountain", hue: 195, blurb: "Low light, geothermal pools and a coastline that keeps changing colour." },
    { id: "d5", city: "Amalfi", country: "Italy", kind: "coast", hue: 190, blurb: "Cliff terraces, lemon groves and boats that leave before the heat." },
    { id: "d6", city: "Singapore", country: "Singapore", kind: "city", hue: 230, blurb: "Hawker suppers, rooftop pools and a skyline that never fully sleeps." },
    { id: "d7", city: "Marrakesh", country: "Morocco", kind: "garden", hue: 30, blurb: "Riad courtyards, a red medina wall and the Atlas on a clear morning." },
    { id: "d8", city: "Queenstown", country: "New Zealand", kind: "mountain", hue: 165, blurb: "Lake water, alpine air, and trailheads a short drive from the door." },
    { id: "d9", city: "Copenhagen", country: "Denmark", kind: "city", hue: 215, blurb: "Harbour swimming, bicycles by the thousand and long blue evenings." },
    { id: "d10", city: "Chiang Mai", country: "Thailand", kind: "garden", hue: 120, blurb: "Old-city moats, teak guesthouses and mountain roads north of town." },
    { id: "d11", city: "Porto Santo", country: "Portugal", kind: "coast", hue: 185, blurb: "Nine kilometres of pale sand and almost nothing else to do." },
    { id: "d12", city: "Vancouver", country: "Canada", kind: "coast", hue: 200, blurb: "Seawall runs, seaplanes, and skiing an hour from the lobby." }
  ];

  var HOTEL_NAMES = [
    ["Azure", "Meridian"], ["Harbour", "House"], ["The", "Salt Rooms"], ["Northlight", "Hotel"],
    ["Casa", "Verano"], ["The", "Quiet Quarter"], ["Marina", "Rise"], ["Olive", "& Stone"],
    ["Lantern", "Court"], ["The", "Blue Hour"], ["Terrace", "Nine"], ["Dune", "Lodge"],
    ["Kestrel", "Hotel"], ["The", "Long Room"], ["Riverbend", "Suites"], ["Aurora", "Bay"],
    ["The", "Copper Door"], ["Palm", "& Pine"], ["Solstice", "Hotel"], ["The", "Anchorage"]
  ];

  var PROPERTY_TYPES = ["Resort", "Boutique", "City Hotel", "Villa", "Aparthotel", "Guesthouse"];
  var ROOM_TYPES = [
    { name: "Standard", cap: 2, beds: "1 queen bed", size: 24, mult: 1.0 },
    { name: "Deluxe", cap: 2, beds: "1 king bed", size: 32, mult: 1.35 },
    { name: "Twin", cap: 2, beds: "2 single beds", size: 26, mult: 1.05 },
    { name: "Family", cap: 4, beds: "1 king + 2 singles", size: 44, mult: 1.75 },
    { name: "Executive", cap: 3, beds: "1 king + sofa bed", size: 48, mult: 2.1 },
    { name: "Suite", cap: 4, beds: "1 king, separate living room", size: 62, mult: 2.8 },
    { name: "Presidential", cap: 6, beds: "2 kings, 2 bathrooms", size: 96, mult: 4.6 }
  ];
  var VIEWS = ["Ocean view", "City view", "Garden view", "Mountain view", "Courtyard view", "Pool view"];

  var AMENITIES = [
    { id: "wifi", label: "Free WiFi", icon: "wifi" },
    { id: "breakfast", label: "Breakfast included", icon: "coffee" },
    { id: "pool", label: "Swimming pool", icon: "waves" },
    { id: "gym", label: "Gym", icon: "dumbbell" },
    { id: "spa", label: "Spa", icon: "sparkles" },
    { id: "parking", label: "Parking", icon: "car" },
    { id: "pets", label: "Pet friendly", icon: "paw" },
    { id: "ac", label: "Air conditioning", icon: "wind" },
    { id: "ocean", label: "Ocean view rooms", icon: "sun" },
    { id: "balcony", label: "Balcony", icon: "door" },
    { id: "restaurant", label: "Restaurant", icon: "utensils" },
    { id: "bar", label: "Bar", icon: "glass" },
    { id: "shuttle", label: "Airport shuttle", icon: "plane" },
    { id: "workspace", label: "Workspace", icon: "laptop" },
    { id: "laundry", label: "Laundry", icon: "shirt" },
    { id: "family", label: "Family rooms", icon: "users" }
  ];

  var FIRST = ["Aiko", "Marcus", "Leila", "Tomas", "Priya", "Jonas", "Amara", "Diego", "Noor", "Elena",
    "Kwame", "Sofia", "Hiroshi", "Ines", "Rafael", "Mei", "Otto", "Yara", "Lucas", "Fatima",
    "Nadia", "Peter", "Sanne", "Ravi", "Clara", "Ibrahim", "Mila", "Andres", "Thandi", "Erik",
    "Junko", "Paolo", "Zara", "Henrik", "Aisha", "Bruno", "Linnea", "Omar", "Camila", "Sebastian"];
  var LAST = ["Okafor", "Lindqvist", "Haddad", "Moreau", "Ferreira", "Tanaka", "Silva", "Novak", "Rahman", "Bergstrom",
    "Costa", "Nakamura", "Adeyemi", "Rossi", "Dubois", "Sorensen", "Mensah", "Kaur", "Almeida", "Vogel",
    "Ibrahim", "Marchetti", "Andersen", "Chen", "Oliveira", "Fernandes", "Bakker", "Nilsen", "Reyes", "Sato"];
  var NATIONALITIES = ["Portugal", "Japan", "Germany", "Brazil", "Canada", "France", "Nigeria", "Sweden",
    "Italy", "Thailand", "Netherlands", "South Africa", "Spain", "India", "Denmark", "United Kingdom",
    "Australia", "Mexico", "Singapore", "Norway"];
  var TIERS = ["Classic", "Silver", "Gold", "Platinum"];
  var SOURCES = ["Website", "Mobile app", "Partner site", "Phone", "Walk-in", "Corporate"];
  var PREFS = ["High floor", "Away from lift", "Late check-out", "Extra pillows", "Quiet room",
    "Twin beds", "Early check-in", "No housekeeping", "Feather-free", "Ground floor"];

  var REVIEW_TITLES = [
    "Exactly what the photos promised", "Great bones, slow breakfast", "Worth the walk uphill",
    "Quiet, clean, close to everything", "Staff made the trip", "Lovely room, thin walls",
    "Best sleep of the trip", "Would book the same room again", "Good value out of season",
    "Charming, if a little worn", "Terrace is the whole point", "Efficient and unfussy"
  ];
  var REVIEW_BODIES = [
    "Check-in took two minutes and the room was ready early. The terrace at sunset is the reason to book here.",
    "Room was spotless and the bed was excellent. Breakfast is slow when the property is full, so go early or skip it.",
    "The location does everything a location can do. Ten minutes on foot to the old town, quiet street, easy taxis.",
    "Front desk stored our bags for a full day without being asked twice and booked a table we could not get ourselves.",
    "Good bones and a lovely courtyard. Walls are thin, so ask for a room away from the stairwell if you sleep light.",
    "Third stay in two years. Nothing has slipped. The housekeeping team is the most consistent I have come across.",
    "Booked the deluxe on a rate that felt too low for the season and it turned out to be the quietest room in the building.",
    "Small bathroom, but the shower pressure is real and the water is hot immediately, which is rarer than it should be.",
    "Pool is smaller than it looks online, though never crowded. Bar staff remembered our order on the second night.",
    "Arrived at midnight after a delayed flight and the kitchen still sent up a plate. That is the whole review."
  ];

  var STAFF_ROLES = ["General Manager", "Front Office Manager", "Receptionist", "Reservations Agent",
    "Housekeeping Supervisor", "Revenue Manager", "Concierge", "Night Auditor", "Maintenance Lead", "Guest Relations"];

  /* ---------- builders ---------- */
  function money(n) { return Math.round(n); }

  function buildHotels() {
    return HOTEL_NAMES.map(function (parts, i) {
      var dest = DESTINATIONS[i % DESTINATIONS.length];
      var type = pick(PROPERTY_TYPES);
      var stars = type === "Guesthouse" ? int(2, 3) : type === "Resort" ? int(4, 5) : int(3, 5);
      var base = round(48 + stars * 46 + r() * 90, 5);
      var am = some(AMENITIES.map(function (a) { return a.id; }), int(6, 11));
      if (dest.kind === "coast" && am.indexOf("ocean") < 0) am.push("ocean");
      if (am.indexOf("wifi") < 0) am.push("wifi");
      return {
        id: "AZ-H" + String(i + 1).padStart(2, "0"),
        name: (parts[0] + " " + parts[1]).trim(),
        destId: dest.id,
        city: dest.city,
        country: dest.country,
        kind: dest.kind,
        hue: (dest.hue + int(-12, 12) + 360) % 360,
        type: type,
        stars: stars,
        rating: +(7.4 + r() * 2.4).toFixed(1),
        reviews: int(84, 1420),
        priceFrom: base,
        amenities: am,
        address: int(2, 180) + " " + pick(["Rua da Alfândega", "Kiyamachi Street", "Bree Street", "Laugavegur",
          "Via Lorenzo", "Keong Saik Road", "Derb el Ferrane", "Beach Street", "Nyhavn", "Nimman Road",
          "Praia Grande", "Denman Street"]) + ", " + dest.city,
        lat: 12 + r() * 68,
        lng: 8 + r() * 78,
        distance: +(0.2 + r() * 4.6).toFixed(1),
        breakfast: am.indexOf("breakfast") >= 0,
        freeCancellation: chance(0.72),
        description:
          "A " + stars + "-star " + type.toLowerCase() + " a " + (+(0.2 + r() * 2).toFixed(1)) +
          " km walk from the centre of " + dest.city + ". " + dest.blurb +
          " Rooms were refurbished in " + int(2019, 2025) + "; the quietest face the " +
          pick(["courtyard", "garden", "back street", "water"]) + ".",
        checkIn: pick(["14:00", "15:00", "16:00"]),
        checkOut: pick(["10:00", "11:00", "12:00"]),
        featured: i < 8,
        createdAt: iso(addDays(TODAY, -int(200, 1400)))
      };
    });
  }

  function buildRooms(hotels) {
    var rooms = [];
    var perHotel = Math.floor(150 / hotels.length);
    hotels.forEach(function (h, hi) {
      var count = perHotel + (hi < 150 - perHotel * hotels.length ? 1 : 0);
      for (var i = 0; i < count; i++) {
        var t = ROOM_TYPES[Math.min(ROOM_TYPES.length - 1, Math.floor(Math.pow(r(), 1.7) * ROOM_TYPES.length))];
        var floor = int(1, Math.max(2, Math.min(9, 2 + Math.floor(count / 2))));
        var num = floor * 100 + (i % 12) + 1;
        var status = pick(["Available", "Available", "Available", "Occupied", "Occupied", "Reserved", "Cleaning", "Maintenance"]);
        rooms.push({
          id: h.id + "-R" + String(num),
          hotelId: h.id,
          number: String(num),
          floor: floor,
          type: t.name,
          beds: t.beds,
          capacity: t.cap,
          size: t.size + int(-3, 6),
          view: h.kind === "coast" && chance(0.5) ? "Ocean view" : pick(VIEWS),
          price: money(h.priceFrom * t.mult * (0.92 + r() * 0.2)),
          amenities: some(AMENITIES.map(function (a) { return a.id; }), int(4, 8)),
          status: status,
          cleaning: status === "Cleaning" ? "In progress" : pick(["Clean", "Clean", "Clean", "Due"]),
          maintenance: status === "Maintenance" ? pick(["Aircon service", "Bathroom leak", "Window seal", "TV replacement"]) : "None",
          smoking: false,
          cancellation: h.freeCancellation ? "Free cancellation until 24h before arrival" : "Non-refundable rate",
          images: 5
        });
      }
    });
    return rooms;
  }

  function buildGuests() {
    var out = [];
    for (var i = 0; i < 500; i++) {
      var first = pick(FIRST), last = pick(LAST);
      out.push({
        id: "AZ-G" + String(i + 1).padStart(4, "0"),
        first: first,
        last: last,
        name: first + " " + last,
        email: (first + "." + last).toLowerCase().replace(/[^a-z.]/g, "") + "@" + pick(["example.com", "mail.example", "post.example"]),
        phone: "+" + int(1, 99) + " " + int(200, 999) + " " + int(100, 999) + " " + int(1000, 9999),
        nationality: pick(NATIONALITIES),
        tier: TIERS[Math.min(3, Math.floor(Math.pow(r(), 2.2) * 4))],
        preferences: some(PREFS, int(0, 3)),
        joined: iso(addDays(TODAY, -int(20, 1500))),
        bookings: 0,
        spend: 0
      });
    }
    return out;
  }

  function buildBookings(hotels, rooms, guests) {
    var out = [];
    var byHotel = {};
    rooms.forEach(function (rm) { (byHotel[rm.hotelId] = byHotel[rm.hotelId] || []).push(rm); });
    for (var i = 0; i < 800; i++) {
      var hotel = pick(hotels);
      var room = pick(byHotel[hotel.id]);
      var guest = pick(guests);
      var offset = int(-210, 130);
      var stay = Math.min(14, 1 + Math.floor(Math.pow(r(), 1.8) * 9));
      var ci = addDays(TODAY, offset);
      var co = addDays(ci, stay);
      var status;
      if (offset + stay < 0) status = chance(0.06) ? "Cancelled" : chance(0.03) ? "No-show" : "Checked out";
      else if (offset <= 0 && offset + stay >= 0) status = chance(0.1) ? "Confirmed" : "Checked in";
      else status = chance(0.08) ? "Cancelled" : chance(0.22) ? "Pending" : "Confirmed";
      var adults = Math.min(room.capacity, int(1, 3));
      var children = room.capacity > 2 && chance(0.3) ? int(1, 2) : 0;
      var roomTotal = room.price * stay;
      var discount = chance(0.22) ? money(roomTotal * (0.05 + r() * 0.15)) : 0;
      var taxes = money((roomTotal - discount) * 0.1);
      var fee = money((roomTotal - discount) * 0.05);
      var total = roomTotal - discount + taxes + fee;
      var payStatus = status === "Cancelled" ? (chance(0.5) ? "Refunded" : "Failed")
        : status === "Pending" ? "Pending"
          : chance(0.9) ? "Paid" : "Pending";
      out.push({
        id: "AZ-B" + String(20260 + i),
        guestId: guest.id,
        hotelId: hotel.id,
        roomId: room.id,
        checkIn: iso(ci),
        checkOut: iso(co),
        nights: stay,
        adults: adults,
        children: children,
        rooms: 1,
        status: status,
        payment: payStatus,
        method: pick(["Credit card", "Debit card", "QR payment", "Cash at hotel"]),
        source: pick(SOURCES),
        roomTotal: roomTotal,
        discount: discount,
        taxes: taxes,
        fee: fee,
        total: total,
        requests: chance(0.35) ? pick(["Late arrival, around 23:00.", "Honeymoon — quiet room if possible.",
          "Cot for a 1-year-old.", "Two key cards please.", "Allergic to feather bedding.",
          "Arriving by car, need parking."]) : "",
        createdAt: iso(addDays(ci, -int(2, 90)))
      });
    }
    out.sort(function (a, b) { return a.checkIn < b.checkIn ? 1 : -1; });
    return out;
  }

  function buildReviews(hotels, guests, bookings) {
    var done = bookings.filter(function (b) { return b.status === "Checked out"; });
    var out = [];
    for (var i = 0; i < 200; i++) {
      var b = done.length ? done[Math.floor(r() * done.length)] : pick(bookings);
      var score = Math.min(10, Math.max(4, Math.round((7 + r() * 3.4) * 10) / 10));
      out.push({
        id: "AZ-RV" + String(i + 1).padStart(3, "0"),
        hotelId: b.hotelId,
        guestId: b.guestId,
        bookingId: b.id,
        rating: score,
        title: pick(REVIEW_TITLES),
        body: pick(REVIEW_BODIES),
        date: iso(addDays(parse(b.checkOut), int(1, 20))),
        status: chance(0.78) ? "Approved" : chance(0.6) ? "Pending" : "Hidden",
        reply: chance(0.4) ? "Thank you for the detail — we have passed the note about breakfast timing to the kitchen team." : "",
        helpful: int(0, 46)
      });
    }
    out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return out;
  }

  function buildPromotions() {
    var kinds = ["Coupon", "Seasonal", "Flash sale", "Weekend offer", "Holiday package"];
    var out = [];
    for (var i = 0; i < 50; i++) {
      var start = addDays(TODAY, int(-120, 60));
      var end = addDays(start, int(5, 90));
      var status = end < TODAY ? "Expired" : start > TODAY ? "Scheduled" : "Active";
      out.push({
        id: "AZ-P" + String(i + 1).padStart(3, "0"),
        code: pick(["STAY", "AZURE", "BLUE", "SALT", "HARBOUR", "LONG", "EARLY", "SUN"]) + int(5, 40),
        name: pick(["Early bird", "Long stay", "Weekend escape", "Shoulder season", "Members only",
          "Third night free", "Spa package", "Family break", "Business rate", "Last minute"]),
        kind: kinds[i % kinds.length],
        value: pick([5, 8, 10, 12, 15, 20, 25, 30]),
        unit: chance(0.85) ? "%" : "USD",
        minNights: pick([1, 1, 2, 3, 5]),
        start: iso(start),
        end: iso(end),
        used: int(0, 320),
        cap: int(200, 600),
        status: status
      });
    }
    return out;
  }

  function buildPayments(bookings) {
    var out = [];
    for (var i = 0; i < 100; i++) {
      var b = bookings[Math.floor(r() * bookings.length)];
      out.push({
        id: "INV-" + String(4100 + i),
        bookingId: b.id,
        guestId: b.guestId,
        hotelId: b.hotelId,
        method: b.method,
        amount: b.total,
        status: b.payment,
        refund: b.payment === "Refunded" ? money(b.total * (chance(0.5) ? 1 : 0.5)) : 0,
        date: b.createdAt
      });
    }
    out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return out;
  }

  function buildStaff(hotels) {
    return STAFF_ROLES.map(function (role, i) {
      var first = pick(FIRST), last = pick(LAST);
      return {
        id: "AZ-S" + String(i + 1).padStart(2, "0"),
        name: first + " " + last,
        role: role,
        email: (first[0] + last).toLowerCase() + "@azurestay.example",
        phone: "+351 9" + int(10, 99) + " " + int(100, 999) + " " + int(100, 999),
        hotelId: hotels[i % hotels.length].id,
        shift: pick(["06:00 – 14:00", "14:00 – 22:00", "22:00 – 06:00", "Flexible"]),
        status: i === 9 ? "On leave" : "Active",
        since: iso(addDays(TODAY, -int(120, 2200)))
      };
    });
  }

  function buildNotifications(bookings) {
    var kinds = [
      ["Booking confirmed", "Your stay at %h is confirmed for %d.", "check"],
      ["Check-in opens tomorrow", "Online check-in for %h opens at 12:00.", "clock"],
      ["Rate drop on a saved hotel", "%h is 12% cheaper for your dates.", "trend"],
      ["Receipt available", "The invoice for %h is ready to download.", "receipt"],
      ["Review request", "How was your stay at %h?", "star"]
    ];
    var out = [];
    for (var i = 0; i < 20; i++) {
      var b = bookings[Math.floor(r() * bookings.length)];
      var k = kinds[i % kinds.length];
      out.push({
        id: "N" + (i + 1),
        title: k[0],
        icon: k[2],
        body: k[1],
        hotelId: b.hotelId,
        bookingId: b.id,
        date: iso(addDays(TODAY, -int(0, 25))),
        read: chance(0.45)
      });
    }
    out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return out;
  }

  /* ---------- assemble ---------- */
  function build() {
    var hotels = buildHotels();
    var rooms = buildRooms(hotels);
    var guests = buildGuests();
    var bookings = buildBookings(hotels, rooms, guests);
    var reviews = buildReviews(hotels, guests, bookings);
    var promotions = buildPromotions();
    var payments = buildPayments(bookings);
    var staff = buildStaff(hotels);
    var notifications = buildNotifications(bookings);

    // The signed-in demo guest needs a history worth looking at, so a spread of
    // upcoming, in-house, past and cancelled stays is reassigned to guests[0].
    var demo = guests[0];
    demo.email = "guest@azurestay.example";
    demo.tier = "Gold";
    demo.preferences = ["High floor", "Late check-out", "Quiet room"];
    ["Confirmed", "Confirmed", "Pending", "Checked in", "Checked out", "Checked out",
      "Checked out", "Checked out", "Cancelled"].forEach(function (want) {
      var hit = bookings.filter(function (b) { return b.status === want && b.guestId !== demo.id; })[0];
      if (hit) hit.guestId = demo.id;
    });

    var byGuest = {};
    bookings.forEach(function (b) {
      if (b.status === "Cancelled") return;
      var g = byGuest[b.guestId] = byGuest[b.guestId] || { n: 0, s: 0 };
      g.n++; g.s += b.total;
    });
    guests.forEach(function (g) {
      var agg = byGuest[g.id] || { n: 0, s: 0 };
      g.bookings = agg.n;
      g.spend = money(agg.s);
    });

    hotels.forEach(function (h) {
      var rs = reviews.filter(function (v) { return v.hotelId === h.id && v.status === "Approved"; });
      if (rs.length) h.rating = +(rs.reduce(function (a, v) { return a + v.rating; }, 0) / rs.length).toFixed(1);
      var hr = rooms.filter(function (rm) { return rm.hotelId === h.id; });
      h.roomCount = hr.length;
      h.priceFrom = hr.reduce(function (m, rm) { return Math.min(m, rm.price); }, 99999);
    });

    return {
      version: 1,
      seededOn: iso(TODAY),
      destinations: DESTINATIONS,
      amenities: AMENITIES,
      roomTypes: ROOM_TYPES,
      propertyTypes: PROPERTY_TYPES,
      hotels: hotels,
      rooms: rooms,
      guests: guests,
      bookings: bookings,
      reviews: reviews,
      promotions: promotions,
      payments: payments,
      staff: staff,
      notifications: notifications
    };
  }

  /* ---------- persistence (degrades to memory on file://) ---------- */
  var store = (function () {
    try {
      var t = "__az__";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      return window.localStorage;
    } catch (e) {
      var mem = {};
      return {
        getItem: function (k) { return k in mem ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; }
      };
    }
  })();

  var db;
  try {
    var raw = store.getItem(KEY);
    db = raw ? JSON.parse(raw) : null;
    if (db && db.seededOn !== iso(TODAY)) db = null; // re-anchor dates on a new day
  } catch (e) { db = null; }
  if (!db) { db = build(); }

  function save() {
    try { store.setItem(KEY, JSON.stringify(db)); } catch (e) { /* quota or file:// — demo still works in memory */ }
  }
  save();

  /* ---------- occupancy + nightly rates ---------- */
  var occupied = Object.create(null);
  function indexOccupancy() {
    occupied = Object.create(null);
    db.bookings.forEach(function (b) {
      if (b.status === "Cancelled" || b.status === "No-show") return;
      var d = parse(b.checkIn), end = parse(b.checkOut);
      while (d < end) { occupied[b.roomId + "|" + iso(d)] = b.id; d = addDays(d, 1); }
    });
  }
  indexOccupancy();

  function seasonFactor(dateStr) {
    var d = parse(dateStr);
    var m = d.getMonth();
    var high = [6, 7, 11].indexOf(m) >= 0 ? 1.22 : [3, 4, 5, 8].indexOf(m) >= 0 ? 1.08 : 0.94;
    var dow = d.getDay();
    var weekend = dow === 5 || dow === 6 ? 1.16 : dow === 0 ? 1.04 : 1;
    return high * weekend;
  }

  function nightlyRate(room, dateStr) {
    var noise = 0.92 + rnd(room.id + dateStr) * 0.18;
    return money(room.price * seasonFactor(dateStr) * noise);
  }

  function isFree(roomId, dateStr) { return !occupied[roomId + "|" + dateStr]; }

  function railFor(room, fromStr, days) {
    var out = [], start = fromStr ? parse(fromStr) : TODAY;
    for (var i = 0; i < (days || 14); i++) {
      var d = iso(addDays(start, i));
      out.push({ date: d, price: nightlyRate(room, d), free: isFree(room.id, d), dow: dayName(d) });
    }
    return out;
  }

  function hotelRail(hotel, fromStr, days) {
    var rooms = db.rooms.filter(function (rm) { return rm.hotelId === hotel.id; });
    var start = fromStr ? parse(fromStr) : TODAY;
    var out = [];
    for (var i = 0; i < (days || 14); i++) {
      var d = iso(addDays(start, i));
      var best = null, free = 0;
      rooms.forEach(function (rm) {
        if (isFree(rm.id, d)) { free++; var p = nightlyRate(rm, d); if (best === null || p < best) best = p; }
      });
      out.push({ date: d, price: best === null ? nightlyRate(rooms[0], d) : best, free: free > 0, left: free, dow: dayName(d) });
    }
    return out;
  }

  function quote(room, checkIn, checkOut, promo) {
    var n = nights(checkIn, checkOut), d = parse(checkIn), lines = [];
    for (var i = 0; i < n; i++) {
      var ds = iso(addDays(d, i));
      lines.push({ date: ds, price: nightlyRate(room, ds), free: isFree(room.id, ds) });
    }
    var roomTotal = lines.reduce(function (a, l) { return a + l.price; }, 0);
    var discount = 0, applied = null;
    if (promo) {
      var p = db.promotions.filter(function (x) {
        return x.code.toUpperCase() === String(promo).toUpperCase() && x.status === "Active" && n >= x.minNights;
      })[0];
      if (p) {
        applied = p;
        discount = p.unit === "%" ? money(roomTotal * p.value / 100) : Math.min(roomTotal, p.value);
      }
    }
    var taxes = money((roomTotal - discount) * 0.1);
    var fee = money((roomTotal - discount) * 0.05);
    return {
      nights: n, lines: lines, roomTotal: roomTotal, discount: discount, promo: applied,
      taxes: taxes, fee: fee, total: roomTotal - discount + taxes + fee,
      allFree: lines.every(function (l) { return l.free; })
    };
  }

  /* ---------- lookups + mutations ---------- */
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0] || null; }

  var API = {
    db: db,
    TODAY: TODAY,
    iso: iso,
    parse: parse,
    addDays: addDays,
    nights: nights,
    dayName: dayName,
    rnd: rnd,
    hash: hash,
    save: save,
    reset: function () { try { store.removeItem(KEY); } catch (e) {} location.reload(); },

    hotel: function (id) { return byId(db.hotels, id); },
    room: function (id) { return byId(db.rooms, id); },
    guest: function (id) { return byId(db.guests, id); },
    booking: function (id) { return byId(db.bookings, id); },
    review: function (id) { return byId(db.reviews, id); },
    promo: function (id) { return byId(db.promotions, id); },
    payment: function (id) { return byId(db.payments, id); },
    destination: function (id) { return byId(db.destinations, id); },
    amenity: function (id) { return byId(db.amenities, id); },

    roomsOf: function (hotelId) { return db.rooms.filter(function (r2) { return r2.hotelId === hotelId; }); },
    reviewsOf: function (hotelId) { return db.reviews.filter(function (r2) { return r2.hotelId === hotelId; }); },
    bookingsOf: function (guestId) { return db.bookings.filter(function (b) { return b.guestId === guestId; }); },

    nightlyRate: nightlyRate,
    isFree: isFree,
    railFor: railFor,
    hotelRail: hotelRail,
    quote: quote,
    reindex: indexOccupancy,

    addBooking: function (b) {
      b.id = "AZ-B" + (21100 + db.bookings.length);
      db.bookings.unshift(b);
      db.payments.unshift({
        id: "INV-" + (4200 + db.payments.length), bookingId: b.id, guestId: b.guestId,
        hotelId: b.hotelId, method: b.method, amount: b.total, status: b.payment, refund: 0, date: iso(TODAY)
      });
      indexOccupancy();
      save();
      return b;
    },
    update: function (list, id, patch) {
      var item = byId(db[list], id);
      if (!item) return null;
      Object.keys(patch).forEach(function (k) { item[k] = patch[k]; });
      if (list === "bookings") indexOccupancy();
      save();
      return item;
    },
    remove: function (list, id) {
      db[list] = db[list].filter(function (x) { return x.id !== id; });
      API.db = db;
      save();
    },

    /* small analytics helpers used by the staff console */
    revenueByMonth: function (months) {
      months = months || 12;
      var out = [];
      for (var i = months - 1; i >= 0; i--) {
        var d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
        var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        var sum = db.bookings.reduce(function (a, b) {
          return b.checkIn.slice(0, 7) === key && b.status !== "Cancelled" ? a + b.total : a;
        }, 0);
        var count = db.bookings.filter(function (b) { return b.checkIn.slice(0, 7) === key && b.status !== "Cancelled"; }).length;
        out.push({ label: d.toLocaleString("en", { month: "short" }), key: key, value: Math.round(sum), count: count });
      }
      return out;
    },
    occupancySeries: function (days) {
      days = days || 14;
      var total = db.rooms.length, out = [];
      for (var i = 0; i < days; i++) {
        var ds = iso(addDays(TODAY, i - Math.floor(days / 2)));
        var used = db.rooms.filter(function (rm) { return !isFree(rm.id, ds); }).length;
        out.push({ label: ds.slice(8) + "/" + ds.slice(5, 7), value: Math.round(used / total * 100), date: ds });
      }
      return out;
    },
    stayingOn: function (dateStr) {
      return db.bookings.filter(function (b) {
        return b.status !== "Cancelled" && b.checkIn <= dateStr && b.checkOut > dateStr;
      });
    },
    arrivalsOn: function (dateStr) { return db.bookings.filter(function (b) { return b.checkIn === dateStr && b.status !== "Cancelled"; }); },
    departuresOn: function (dateStr) { return db.bookings.filter(function (b) { return b.checkOut === dateStr && b.status !== "Cancelled"; }); }
  };

  window.AZ = API;
})();
