/* Azure Stay — hash router.
   Hash routing keeps the whole thing working from file:// and from any
   subfolder on GitHub Pages without server rewrites. */
(function () {
  "use strict";

  var routes = [];
  var current = null;
  var onRender = null;

  function add(pattern, handler) {
    var names = [];
    var rx = new RegExp("^" + pattern.replace(/:[^/]+/g, function (m) {
      names.push(m.slice(1));
      return "([^/]+)";
    }).replace(/\//g, "\\/") + "$");
    routes.push({ rx: rx, names: names, handler: handler, pattern: pattern });
  }

  function parse() {
    var raw = location.hash.replace(/^#/, "") || "/";
    var qi = raw.indexOf("?");
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var query = {};
    if (qi >= 0) {
      raw.slice(qi + 1).split("&").forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split("=");
        query[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
      });
    }
    if (path.length > 1 && path.slice(-1) === "/") path = path.slice(0, -1);
    return { path: path, query: query, raw: raw };
  }

  function resolve() {
    var ctx = parse();
    for (var i = 0; i < routes.length; i++) {
      var m = ctx.path.match(routes[i].rx);
      if (m) {
        ctx.params = {};
        routes[i].names.forEach(function (n, j) { ctx.params[n] = decodeURIComponent(m[j + 1]); });
        ctx.route = routes[i].pattern;
        return { ctx: ctx, handler: routes[i].handler };
      }
    }
    return { ctx: ctx, handler: null };
  }

  function render() {
    var hit = resolve();
    var page;
    try {
      page = hit.handler ? hit.handler(hit.ctx) : window.PagesCustomer.notFound();
    } catch (err) {
      if (window.console) console.error("Route failed:", err);
      page = window.PagesCustomer.error(500);
    }
    current = { ctx: hit.ctx, page: page };
    if (onRender) onRender(page, hit.ctx);
  }

  window.Router = {
    add: add,
    start: function (cb) {
      onRender = cb;
      window.addEventListener("hashchange", render);
      if (!location.hash) location.hash = "#/";
      render();
    },
    reload: render,
    current: function () { return current; },
    parse: parse,
    go: function (hash) { location.hash = hash; }
  };
})();
