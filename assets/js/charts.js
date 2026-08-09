/* Azure Stay — charts.
   Hand-built SVG so the console has no charting dependency. Every chart is a
   string of markup with a viewBox, which means it scales, prints and survives
   dark mode without a redraw. */
(function () {
  "use strict";

  var GRID = 'style="stroke:var(--border)"';
  var LBL = 'style="fill:var(--muted)"';

  function nice(max) {
    if (max <= 0) return 10;
    var pow = Math.pow(10, Math.floor(Math.log10(max)));
    var n = max / pow;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  }
  function short(n) {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return String(Math.round(n));
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function frame(opts, body, extra) {
    var w = opts.w || 640, h = opts.h || 230;
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="chart" role="img" aria-label="' +
      esc(opts.title || "chart") + '">' + body + (extra || "") + "</svg>";
  }

  function axes(o) {
    var out = [], i;
    for (i = 0; i <= o.ticks; i++) {
      var y = o.top + (o.ph / o.ticks) * i;
      var val = o.max - (o.max / o.ticks) * i;
      out.push('<line x1="' + o.left + '" y1="' + y.toFixed(1) + '" x2="' + (o.left + o.pw) + '" y2="' + y.toFixed(1) +
        '" ' + GRID + ' stroke-width="1" stroke-dasharray="' + (i === o.ticks ? "0" : "3 4") + '"/>');
      out.push('<text x="' + (o.left - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="10.5" ' +
        LBL + ' font-family="JetBrains Mono, monospace">' + (o.fmt ? o.fmt(val) : short(val)) + "</text>");
    }
    return out.join("");
  }

  function xlabels(o, labels) {
    var step = o.pw / labels.length;
    var every = labels.length > 16 ? Math.ceil(labels.length / 12) : 1;
    return labels.map(function (l, i) {
      if (i % every) return "";
      return '<text x="' + (o.left + step * i + step / 2).toFixed(1) + '" y="' + (o.top + o.ph + 18) +
        '" text-anchor="middle" font-size="10.5" ' + LBL + ">" + esc(l) + "</text>";
    }).join("");
  }

  /* Area / line chart */
  function area(data, opts) {
    opts = opts || {};
    var w = opts.w || 640, h = opts.h || 230;
    var o = { left: 44, top: 14, pw: w - 60, ph: h - 46, ticks: 4, fmt: opts.fmt };
    var max = nice(Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.12) || 10;
    o.max = max;
    var step = o.pw / Math.max(1, data.length - 1);
    var color = opts.color || "#2563eb";
    var pts = data.map(function (d, i) {
      return [o.left + step * i, o.top + o.ph - (d.value / max) * o.ph];
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var fill = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (o.top + o.ph) + " L" + pts[0][0].toFixed(1) + " " + (o.top + o.ph) + " Z";
    var id = "g" + Math.random().toString(36).slice(2, 8);
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2" fill="' + color +
        '"><title>' + esc(data[i].label) + ": " + (opts.fmt ? opts.fmt(data[i].value) : data[i].value) + "</title></circle>";
    }).join("");
    var body =
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity=".32"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      axes(o) +
      '<path d="' + fill + '" fill="url(#' + id + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots +
      data.map(function (d, i) {
        if (data.length > 16 && i % Math.ceil(data.length / 12)) return "";
        return '<text x="' + (o.left + step * i).toFixed(1) + '" y="' + (o.top + o.ph + 18) +
          '" text-anchor="middle" font-size="10.5" ' + LBL + ">" + esc(d.label) + "</text>";
      }).join("");
    return frame({ w: w, h: h, title: opts.title }, body);
  }

  /* Vertical bars */
  function bars(data, opts) {
    opts = opts || {};
    var w = opts.w || 640, h = opts.h || 230;
    var o = { left: 44, top: 14, pw: w - 60, ph: h - 46, ticks: 4, fmt: opts.fmt };
    var max = nice(Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.15) || 10;
    o.max = max;
    var step = o.pw / data.length;
    var bw = Math.min(38, step * 0.6);
    var color = opts.color || "#1e3a8a";
    var rects = data.map(function (d, i) {
      var bh = (d.value / max) * o.ph;
      var x = o.left + step * i + (step - bw) / 2;
      var c = opts.colorFor ? opts.colorFor(d, i) : color;
      return '<rect x="' + x.toFixed(1) + '" y="' + (o.top + o.ph - bh).toFixed(1) + '" width="' + bw.toFixed(1) +
        '" height="' + Math.max(1, bh).toFixed(1) + '" rx="4" fill="' + c + '"><title>' + esc(d.label) + ": " +
        (opts.fmt ? opts.fmt(d.value) : d.value) + "</title></rect>";
    }).join("");
    return frame({ w: w, h: h, title: opts.title }, axes(o) + rects + xlabels(o, data.map(function (d) { return d.label; })));
  }

  /* Stacked bars: { labels, series:[{name,color,values[]}] } */
  function stacked(cfg, opts) {
    opts = opts || {};
    var w = opts.w || 640, h = opts.h || 230;
    var o = { left: 44, top: 14, pw: w - 60, ph: h - 46, ticks: 4, fmt: opts.fmt };
    var totals = cfg.labels.map(function (_, i) {
      return cfg.series.reduce(function (a, s) { return a + (s.values[i] || 0); }, 0);
    });
    var max = nice(Math.max.apply(null, totals) * 1.15) || 10;
    o.max = max;
    var step = o.pw / cfg.labels.length;
    var bw = Math.min(34, step * 0.58);
    var out = [];
    cfg.labels.forEach(function (label, i) {
      var acc = 0;
      cfg.series.forEach(function (s) {
        var v = s.values[i] || 0;
        var bh = (v / max) * o.ph;
        var y = o.top + o.ph - bh - acc;
        out.push('<rect x="' + (o.left + step * i + (step - bw) / 2).toFixed(1) + '" y="' + y.toFixed(1) +
          '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, bh).toFixed(1) + '" fill="' + s.color +
          '"><title>' + esc(label + " · " + s.name) + ": " + v + "</title></rect>");
        acc += bh;
      });
    });
    return frame({ w: w, h: h, title: opts.title }, axes(o) + out.join("") + xlabels(o, cfg.labels));
  }

  /* Donut / pie */
  function donut(data, opts) {
    opts = opts || {};
    var size = opts.size || 220, r = size / 2, inner = opts.pie ? 0 : r * 0.58;
    var total = data.reduce(function (a, d) { return a + d.value; }, 0) || 1;
    var angle = -Math.PI / 2, out = [];
    data.forEach(function (d) {
      var slice = (d.value / total) * Math.PI * 2;
      var end = angle + slice;
      var large = slice > Math.PI ? 1 : 0;
      var x1 = r + Math.cos(angle) * r, y1 = r + Math.sin(angle) * r;
      var x2 = r + Math.cos(end) * r, y2 = r + Math.sin(end) * r;
      var path;
      if (inner) {
        var ix1 = r + Math.cos(end) * inner, iy1 = r + Math.sin(end) * inner;
        var ix2 = r + Math.cos(angle) * inner, iy2 = r + Math.sin(angle) * inner;
        path = "M" + x1.toFixed(1) + " " + y1.toFixed(1) + " A" + r + " " + r + " 0 " + large + " 1 " + x2.toFixed(1) + " " + y2.toFixed(1) +
          " L" + ix1.toFixed(1) + " " + iy1.toFixed(1) + " A" + inner + " " + inner + " 0 " + large + " 0 " + ix2.toFixed(1) + " " + iy2.toFixed(1) + " Z";
      } else {
        path = "M" + r + " " + r + " L" + x1.toFixed(1) + " " + y1.toFixed(1) + " A" + r + " " + r + " 0 " + large + " 1 " + x2.toFixed(1) + " " + y2.toFixed(1) + " Z";
      }
      out.push('<path d="' + path + '" fill="' + d.color + '"><title>' + esc(d.label) + ": " + d.value +
        " (" + Math.round(d.value / total * 100) + "%)</title></path>");
      angle = end;
    });
    var mid = opts.center
      ? '<text x="' + r + '" y="' + (r - 2) + '" text-anchor="middle" font-size="24" font-family="JetBrains Mono, monospace" font-weight="600" style="fill:var(--text)">' +
        esc(opts.center) + '</text><text x="' + r + '" y="' + (r + 18) + '" text-anchor="middle" font-size="11" ' + LBL + ">" + esc(opts.centerLabel || "") + "</text>"
      : "";
    return '<svg viewBox="0 0 ' + size + " " + size + '" class="chart" role="img" aria-label="' + esc(opts.title || "donut") + '">' +
      out.join("") + mid + "</svg>";
  }

  /* Horizontal bars, good for rankings */
  function hbars(data, opts) {
    opts = opts || {};
    var w = opts.w || 640, rowH = opts.rowH || 30, h = data.length * rowH + 10;
    var labelW = opts.labelW || 132;
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) || 1;
    var out = data.map(function (d, i) {
      var bw = (d.value / max) * (w - labelW - 66);
      var y = i * rowH + 6;
      return '<text x="0" y="' + (y + 14) + '" font-size="12" style="fill:var(--text)">' + esc(d.label) + "</text>" +
        '<rect x="' + labelW + '" y="' + y + '" width="' + Math.max(2, bw).toFixed(1) + '" height="17" rx="4" fill="' +
        (d.color || opts.color || "#2563eb") + '"><title>' + esc(d.label) + ": " + d.value + "</title></rect>" +
        '<text x="' + (labelW + Math.max(2, bw) + 8).toFixed(1) + '" y="' + (y + 13) + '" font-size="11.5" ' + LBL +
        ' font-family="JetBrains Mono, monospace">' + (opts.fmt ? opts.fmt(d.value) : short(d.value)) + "</text>";
    }).join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="chart" role="img" aria-label="' + esc(opts.title || "ranking") + '">' + out + "</svg>";
  }

  /* Sparkline for stat cards */
  function spark(values, color) {
    var w = 90, h = 28;
    var max = Math.max.apply(null, values) || 1, min = Math.min.apply(null, values);
    var step = w / Math.max(1, values.length - 1);
    var d = values.map(function (v, i) {
      var y = h - 2 - ((v - min) / Math.max(1, max - min)) * (h - 6);
      return (i ? "L" : "M") + (i * step).toFixed(1) + " " + y.toFixed(1);
    }).join(" ");
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="' + (color || "#2563eb") + '" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  window.Charts = { area: area, bars: bars, stacked: stacked, donut: donut, hbars: hbars, spark: spark, short: short };
})();
