/* Azure Stay — icons and procedural imagery.
   No image files ship with this project: every "photograph" is an SVG scene
   generated from the hotel's seed, so the repo stays under a megabyte and
   nothing 404s when it is served from a subfolder. */
(function () {
  "use strict";

  var P = {
    search: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM21 21l-4.3-4.3",
    pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z|M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    heart: "M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.4l8.8-8.7a5 5 0 0 0 0-7.1Z",
    star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z|M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
    menu: "M3 6h18M3 12h18M3 18h18",
    x: "M18 6 6 18M6 6l12 12",
    chevronRight: "m9 18 6-6-6-6",
    chevronLeft: "m15 18-6-6 6-6",
    chevronDown: "m6 9 6 6 6-6",
    check: "M20 6 9 17l-5-5",
    checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1|m9 11 3 3L22 4",
    xCircle: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|m15 9-6 6M9 9l6 6",
    alert: "M12 9v4M12 17h.01|M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 16v-4M12 8h.01",
    calendar: "M8 2v4M16 2v4M3 10h18|M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M12 6v6l4 2",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    bed: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 16h20M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",
    wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01",
    coffee: "M17 8h1a4 4 0 0 1 0 8h-1|M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8ZM6 2v3M10 2v3M14 2v3",
    waves: "M2 6c2.5-2 4.5 2 7 0s4.5-2 7 0 4.5 2 6 0M2 12c2.5-2 4.5 2 7 0s4.5-2 7 0 4.5 2 6 0M2 18c2.5-2 4.5 2 7 0s4.5-2 7 0 4.5 2 6 0",
    dumbbell: "M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11",
    sparkles: "M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z|M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z",
    car: "M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm18 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z|M3 17v-4l2-5h10l3 5h3v4",
    paw: "M11 15c-3 0-5 1.8-5 3.6C6 20.2 7.4 21 9 21h4c1.6 0 3-.8 3-2.4 0-1.8-2-3.6-5-3.6Z|M6 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM18 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM9.8 7a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 9.8 7ZM14.2 7a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
    wind: "M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h8",
    door: "M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17M2 21h20M13 12h.01",
    utensils: "M7 2v9a3 3 0 0 0 3 3v8M4 2v6M10 2v6M18 2c-1.5 2-2 4-2 7 0 2 .7 3 2 3v10",
    glass: "M8 22h8M12 15v7M5 3h14l-2 7a5 5 0 0 1-10 0L5 3Z",
    plane: "M17.8 19.2 16 11l4.5-4.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.4 3.9-2.1 2.1-2.3-.6-.9.9 3 2 2 3 .9-.9-.6-2.3 2.1-2.1 3.9 3.4a.5.5 0 0 0 .8-.5Z",
    laptop: "M4 5h16v11H4zM2 20h20",
    shirt: "M20.4 6.6 16 4a4 4 0 0 1-8 0L3.6 6.6a1 1 0 0 0-.4 1.3l1.6 3.1a1 1 0 0 0 1.3.4L8 10.5V21h8V10.5l1.9.9a1 1 0 0 0 1.3-.4l1.6-3.1a1 1 0 0 0-.4-1.3Z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    home: "m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9Z",
    building: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h2M8 11h2M8 15h2",
    key: "m15.5 7.5 3 3L22 7l-3-3M2 22l1-1|M9.5 20a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm0 0L19 10.5",
    tag: "M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z|M7.5 8h.01",
    creditCard: "M2 6h20v12H2zM2 10h20",
    receipt: "M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2Z|M8 8h8M8 12h8M8 16h5",
    chart: "M3 3v18h18|m7 14 3-4 3 3 5-7",
    pie: "M12 2v10l7 7A10 10 0 1 0 12 2Z",
    fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z|M14 2v6h6M9 13h6M9 17h6",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.1-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.1Z",
    logOut: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|m16 17 5-5-5-5M21 12H9",
    logIn: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4|m10 17 5-5-5-5M15 12H3",
    arrowRight: "M5 12h14m-6-7 7 7-7 7",
    arrowLeft: "M19 12H5m6 7-7-7 7-7",
    arrowUp: "M12 19V5m-7 7 7-7 7 7",
    arrowDown: "M12 5v14m7-7-7 7-7-7",
    trend: "m3 17 6-6 4 4 8-8|M17 7h4v4",
    trendDown: "m3 7 6 6 4-4 8 8|M17 17h4v-4",
    filter: "M4 4h16l-6.5 8v6l-3 2v-8L4 4Z",
    sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
    trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    eyeOff: "M9.9 5.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6|M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z",
    mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z|m22 7-10 6L2 7",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M2 12h20|M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z",
    printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2|M6 14h12v8H6z",
    download: "M12 3v12m-5-5 5 5 5-5M5 21h14",
    refresh: "M21 12a9 9 0 1 1-3-6.7L21 8|M21 3v5h-5",
    image: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z|m21 15-5-5L5 21",
    briefcase: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
    compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|m15.5 8.5-2 5.5-5.5 2 2-5.5 5.5-2Z",
    more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
    smile: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z|M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
  };

  function icon(name, cls) {
    var d = P[name] || P.info;
    var parts = d.split("|").map(function (seg) { return '<path d="' + seg + '"/>'; }).join("");
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + parts + "</svg>";
  }

  /* --- procedural scenery ------------------------------------------------
     kind: coast | city | mountain | garden | room
     Deterministic from the seed string, so a hotel always looks like itself. */
  function scene(seed, kind, variant) {
    var AZ = window.AZ;
    var uid = "s" + AZ.hash(seed + "|" + (variant || 0)).toString(36);
    function n(i) { return AZ.rnd(seed + "|" + (variant || 0) + "|" + i); }
    var hue = Math.floor(n(0) * 360);
    var W = 800, H = 560, out = [];
    var dusk = n(1) > 0.62;

    var skyTop = "hsl(" + (200 + n(2) * 24) + ",68%," + (dusk ? 26 : 74) + "%)";
    var skyBot = dusk ? "hsl(" + (28 + n(3) * 18) + ",78%,58%)" : "hsl(" + (198 + n(3) * 14) + ",82%,88%)";

    out.push('<defs><linearGradient id="sky' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + skyTop + '"/><stop offset="1" stop-color="' + skyBot + '"/></linearGradient>' +
      '<linearGradient id="wat' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="hsl(205,70%,' + (dusk ? 24 : 52) + '%)"/>' +
      '<stop offset="1" stop-color="hsl(212,72%,' + (dusk ? 14 : 34) + '%)"/></linearGradient></defs>');
    out.push('<rect width="' + W + '" height="' + H + '" fill="url(#sky' + uid + ')"/>');

    // sun or moon
    var sx = 120 + n(4) * 560, sy = 90 + n(5) * 90;
    out.push('<circle cx="' + sx.toFixed(0) + '" cy="' + sy.toFixed(0) + '" r="' + (34 + n(6) * 18).toFixed(0) +
      '" fill="' + (dusk ? "#fde68a" : "#fff7cf") + '" opacity="' + (dusk ? 0.95 : 0.8) + '"/>');

    // clouds
    for (var c = 0; c < 3; c++) {
      var cx = n(10 + c) * W, cy = 60 + n(20 + c) * 140, cw = 80 + n(30 + c) * 130;
      out.push('<ellipse cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" rx="' + cw.toFixed(0) +
        '" ry="' + (14 + n(40 + c) * 12).toFixed(0) + '" fill="#ffffff" opacity="' + (0.14 + n(50 + c) * 0.2).toFixed(2) + '"/>');
    }

    if (kind === "city") {
      var horizon = 380;
      out.push('<rect y="' + horizon + '" width="' + W + '" height="' + (H - horizon) + '" fill="hsl(218,32%,' + (dusk ? 12 : 24) + '%)"/>');
      var x = -20;
      var i = 0;
      while (x < W + 40) {
        var bw = 42 + n(60 + i) * 74, bh = 90 + n(70 + i) * 230;
        var shade = 18 + n(80 + i) * 22;
        out.push('<rect x="' + x.toFixed(0) + '" y="' + (horizon - bh).toFixed(0) + '" width="' + bw.toFixed(0) +
          '" height="' + bh.toFixed(0) + '" fill="hsl(' + (216 + n(90 + i) * 16).toFixed(0) + ',30%,' + shade.toFixed(0) + '%)"/>');
        for (var w = 0; w < 5; w++) {
          for (var v = 0; v < Math.floor(bh / 42); v++) {
            if (n(100 + i * 7 + w * 13 + v * 3) > 0.55) {
              out.push('<rect x="' + (x + 8 + w * (bw - 12) / 5).toFixed(0) + '" y="' + (horizon - bh + 14 + v * 40).toFixed(0) +
                '" width="8" height="12" fill="#fbbf24" opacity="' + (dusk ? 0.9 : 0.3) + '"/>');
            }
          }
        }
        x += bw + 6 + n(110 + i) * 14;
        i++;
      }
    } else if (kind === "mountain") {
      out.push('<path d="M0 400 L150 250 L250 330 L380 190 L520 340 L640 260 L800 400 L800 560 L0 560 Z" fill="hsl(' +
        (205 + n(7) * 20).toFixed(0) + ',26%,' + (dusk ? 20 : 40) + '%)"/>');
      out.push('<path d="M380 190 L420 235 L400 245 L370 232 Z" fill="#f8fafc" opacity=".85"/>');
      out.push('<path d="M0 450 L180 360 L340 440 L520 380 L700 460 L800 420 L800 560 L0 560 Z" fill="hsl(' +
        (160 + n(8) * 40).toFixed(0) + ',30%,' + (dusk ? 14 : 30) + '%)"/>');
    } else if (kind === "garden") {
      out.push('<rect y="380" width="' + W + '" height="180" fill="hsl(' + (110 + n(9) * 30).toFixed(0) + ',34%,' + (dusk ? 18 : 38) + '%)"/>');
      for (var t = 0; t < 7; t++) {
        var tx = 40 + n(120 + t) * 720, th = 90 + n(130 + t) * 120;
        out.push('<rect x="' + (tx - 5).toFixed(0) + '" y="' + (400 - th * 0.45).toFixed(0) + '" width="10" height="' + (th * 0.45).toFixed(0) + '" fill="hsl(28,32%,26%)"/>');
        out.push('<circle cx="' + tx.toFixed(0) + '" cy="' + (400 - th * 0.55).toFixed(0) + '" r="' + (34 + n(140 + t) * 34).toFixed(0) +
          '" fill="hsl(' + (100 + n(150 + t) * 40).toFixed(0) + ',40%,' + (dusk ? 22 : 36) + '%)" opacity=".95"/>');
      }
      out.push('<ellipse cx="400" cy="500" rx="230" ry="46" fill="hsl(196,60%,' + (dusk ? 26 : 54) + '%)" opacity=".7"/>');
    } else if (kind === "room") {
      out.push('<rect width="' + W + '" height="' + H + '" fill="hsl(' + hue + ',18%,' + (dusk ? 16 : 92) + '%)"/>');
      out.push('<rect x="60" y="60" width="300" height="220" rx="6" fill="hsl(205,70%,' + (dusk ? 26 : 70) + '%)"/>');
      out.push('<rect x="60" y="60" width="300" height="220" rx="6" fill="none" stroke="hsl(' + hue + ',12%,' + (dusk ? 40 : 70) + '%)" stroke-width="10"/>');
      out.push('<rect x="120" y="320" width="560" height="160" rx="14" fill="hsl(' + hue + ',16%,' + (dusk ? 26 : 100) + '%)" stroke="hsl(' + hue + ',14%,' + (dusk ? 40 : 76) + '%)" stroke-width="4"/>');
      out.push('<rect x="150" y="290" width="150" height="60" rx="12" fill="#fff" opacity=".92"/>');
      out.push('<rect x="320" y="290" width="150" height="60" rx="12" fill="#fff" opacity=".92"/>');
      out.push('<rect x="120" y="400" width="560" height="80" rx="10" fill="hsl(' + (hue + 20) % 360 + ',44%,' + (dusk ? 32 : 62) + '%)"/>');
      out.push('<circle cx="700" cy="180" r="34" fill="hsl(45,90%,' + (dusk ? 60 : 78) + '%)" opacity=".9"/>');
      return wrap(out.join(""), W, H);
    } else {
      // coast
      var hz = 330 + n(11) * 40;
      out.push('<rect y="' + hz.toFixed(0) + '" width="' + W + '" height="' + (H - hz).toFixed(0) + '" fill="url(#wat' + uid + ')"/>');
      out.push('<path d="M0 ' + hz.toFixed(0) + ' L120 ' + (hz - 60).toFixed(0) + ' L240 ' + hz.toFixed(0) + ' Z" fill="hsl(150,26%,' + (dusk ? 16 : 32) + '%)" opacity=".9"/>');
      out.push('<path d="M560 ' + hz.toFixed(0) + ' L680 ' + (hz - 90).toFixed(0) + ' L800 ' + hz.toFixed(0) + ' Z" fill="hsl(150,24%,' + (dusk ? 14 : 28) + '%)" opacity=".85"/>');
      for (var s = 0; s < 6; s++) {
        var wy = hz + 24 + s * 34, ww = 60 + n(160 + s) * 200, wx = n(170 + s) * (W - ww);
        out.push('<path d="M' + wx.toFixed(0) + ' ' + wy.toFixed(0) + ' q ' + (ww / 4).toFixed(0) + ' -8 ' + (ww / 2).toFixed(0) +
          ' 0 t ' + (ww / 2).toFixed(0) + ' 0" stroke="#ffffff" stroke-opacity=".3" stroke-width="3" fill="none"/>');
      }
      out.push('<rect y="' + (H - 60) + '" width="' + W + '" height="60" fill="hsl(42,54%,' + (dusk ? 30 : 78) + '%)"/>');
    }

    // a building silhouette for non-room scenes, so it reads as a hotel
    if (kind !== "room") {
      var bx = 470 + n(12) * 200, by = 300 + n(13) * 60;
      out.push('<g opacity=".95"><rect x="' + bx.toFixed(0) + '" y="' + by.toFixed(0) + '" width="150" height="' + (H - by - 40).toFixed(0) +
        '" rx="6" fill="hsl(' + hue + ',26%,' + (dusk ? 22 : 96) + '%)" stroke="hsl(' + hue + ',24%,' + (dusk ? 34 : 74) + '%)" stroke-width="3"/>');
      for (var f = 0; f < 4; f++) {
        for (var g = 0; g < 3; g++) {
          out.push('<rect x="' + (bx + 16 + g * 44).toFixed(0) + '" y="' + (by + 18 + f * 46).toFixed(0) +
            '" width="26" height="30" rx="3" fill="' + (dusk && n(200 + f * 5 + g) > 0.4 ? "#fbbf24" : "hsl(205,50%," + (dusk ? 30 : 66) + "%)") + '"/>');
        }
      }
      out.push('</g>');
    }
    return wrap(out.join(""), W, H);
  }

  function wrap(inner, w, h) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">' + inner + "</svg>";
  }

  function avatarColor(seed) {
    var h = window.AZ.hash(String(seed)) % 360;
    return "hsl(" + h + ",52%,42%)";
  }

  window.Icons = { icon: icon, scene: scene, avatarColor: avatarColor, paths: P };
})();
