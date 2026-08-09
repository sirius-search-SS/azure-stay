/* Azure Stay — client state.
   Session, theme, favourites, the current search and the in-progress booking.
   Anything the guest would expect to survive a refresh lives here. */
(function () {
  "use strict";
  var KEY = "azure-stay/v1/state";
  var AZ = window.AZ;

  var backing = (function () {
    try {
      window.localStorage.setItem("__azs__", "1");
      window.localStorage.removeItem("__azs__");
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

  var DEMO_ACCOUNTS = [
    { email: "guest@azurestay.example", password: "azure2026", role: "guest", guestId: "AZ-G0001",
      name: (AZ.db.guests[0] && AZ.db.guests[0].name) || "Demo Guest" },
    { email: "manager@azurestay.example", password: "azure2026", role: "staff", name: "Ines Marchetti", title: "Front Office Manager" },
    { email: "admin@azurestay.example", password: "azure2026", role: "admin", name: "Otto Bergstrom", title: "General Manager" }
  ];

  var defaults = {
    theme: "light",
    user: null,
    favorites: [],
    recent: [],
    search: {
      destination: "",
      checkIn: AZ.iso(AZ.addDays(AZ.TODAY, 14)),
      checkOut: AZ.iso(AZ.addDays(AZ.TODAY, 17)),
      adults: 2,
      children: 0,
      rooms: 1
    },
    filters: { price: 900, rating: 0, types: [], roomTypes: [], amenities: [], sort: "recommended" },
    draft: null,
    settings: { currency: "USD", language: "English", emails: true, sms: false, deals: true }
  };

  var state;
  try { state = Object.assign({}, defaults, JSON.parse(backing.getItem(KEY) || "{}")); }
  catch (e) { state = Object.assign({}, defaults); }
  state.search = Object.assign({}, defaults.search, state.search || {});
  state.filters = Object.assign({}, defaults.filters, state.filters || {});
  state.settings = Object.assign({}, defaults.settings, state.settings || {});

  var listeners = [];

  function persist() {
    try { backing.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function emit() { listeners.forEach(function (fn) { fn(state); }); }

  var Store = {
    get state() { return state; },
    on: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    set: function (patch) { Object.assign(state, patch); persist(); emit(); },
    patchSearch: function (patch) { state.search = Object.assign({}, state.search, patch); persist(); emit(); },
    patchFilters: function (patch) { state.filters = Object.assign({}, state.filters, patch); persist(); emit(); },
    resetFilters: function () { state.filters = Object.assign({}, defaults.filters); persist(); emit(); },
    patchSettings: function (patch) { state.settings = Object.assign({}, state.settings, patch); persist(); emit(); },

    isFav: function (id) { return state.favorites.indexOf(id) >= 0; },
    toggleFav: function (id) {
      var on = Store.isFav(id);
      state.favorites = on ? state.favorites.filter(function (x) { return x !== id; }) : state.favorites.concat([id]);
      persist(); emit();
      return !on;
    },
    remember: function (hotelId) {
      state.recent = [hotelId].concat(state.recent.filter(function (x) { return x !== hotelId; })).slice(0, 6);
      persist();
    },

    accounts: DEMO_ACCOUNTS,
    login: function (email, password) {
      var acct = DEMO_ACCOUNTS.filter(function (a) {
        return a.email.toLowerCase() === String(email).trim().toLowerCase() && a.password === password;
      })[0];
      if (!acct) return null;
      var user = { email: acct.email, role: acct.role, name: acct.name, title: acct.title || "", guestId: acct.guestId || null };
      Store.set({ user: user });
      return user;
    },
    register: function (fields) {
      var guest = {
        id: "AZ-G" + String(AZ.db.guests.length + 1).padStart(4, "0"),
        first: fields.first, last: fields.last, name: fields.first + " " + fields.last,
        email: fields.email, phone: fields.phone || "", nationality: fields.nationality || "Portugal",
        tier: "Classic", preferences: [], joined: AZ.iso(AZ.TODAY), bookings: 0, spend: 0
      };
      AZ.db.guests.push(guest);
      AZ.save();
      Store.set({ user: { email: guest.email, role: "guest", name: guest.name, guestId: guest.id } });
      return guest;
    },
    logout: function () { Store.set({ user: null }); },
    currentGuest: function () {
      if (!state.user || !state.user.guestId) return null;
      return AZ.guest(state.user.guestId);
    },

    startDraft: function (draft) { Store.set({ draft: draft }); },
    patchDraft: function (patch) { state.draft = Object.assign({}, state.draft || {}, patch); persist(); emit(); },
    clearDraft: function () { Store.set({ draft: null }); },

    setTheme: function (theme) {
      state.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      persist(); emit();
    },
    toggleTheme: function () { Store.setTheme(state.theme === "dark" ? "light" : "dark"); }
  };

  document.documentElement.setAttribute("data-theme", state.theme);
  window.Store = Store;
})();
