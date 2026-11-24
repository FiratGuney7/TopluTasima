/*
 * Location map section of the listing page, with public transport as a side feature.
 * Two variations of the same section, rendered from the SAME data object:
 *   H  Yatay (horizontal) – main column, right above Features; wide map
 *   V  Dikey (vertical)   – sidebar, below "Every time correct prices"; taller, narrower map
 *
 * Visual system: Antalya Homes palette (navy #192B43, red #DA0021, blue #4596E6),
 * Open Sans, one icon set (Material Icons paths, Apache-2.0), light base map.
 */
(function () {
  "use strict";
  const TD = window.TransitData;
  // Mode colours (AA contrast with white text): tram = deep brand blue, bus = teal.
  const COLOR = { tram: "#2672c9", bus: "#0b7f73", other: "#7b8794" };
  const RED = "#da0021";
  const TZ = "Europe/Istanbul";

  // ---------------- formatting ----------------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // ---------------- texts (catalogue: transit-strings.js) ----------------
  const STR = new Map((window.TRANSIT_STRINGS || []).map((s, i) => [s.key, { ...s, n: i + 1 }]));
  // t(): text for `key` with {placeholders} filled in. Placeholder values are already safe HTML.
  // window.TRANSIT_TEXTS (key -> text) can supply another language; English is the fallback.
  // Annotate mode (translation guide) wraps every visible text in a numbered, colour-coded mark.
  function t(key, vars = {}, opt = {}) {
    const s = STR.get(key);
    if (!s) return esc(key);
    const tmpl = (window.TRANSIT_TEXTS && window.TRANSIT_TEXTS[key]) || s.en;
    const out = esc(tmpl).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    if (opt.plain) return out.replace(/<[^>]+>/g, "");
    if (window.TRANSIT_ANNOTATE) return `<mark class="i18n c-${s.cat}" data-n="${s.n}" title="#${s.n} · ${esc(s.cms)}">${out}</mark>`;
    return out;
  }
  const tp = (key, vars) => t(key, vars, { plain: true }); // for attributes, tooltips and inside other texts

  function fmtDist(m, plain = false) {
    if (m == null || isNaN(m)) return "–";
    const o = { plain };
    if (m < 100) return t("dist.metres", { n: Math.round(m) }, o);
    if (m < 1000) return t("dist.metres", { n: Math.round(m / 10) * 10 }, o);
    return t("dist.km", { n: (m / 1000).toFixed(1) }, o);
  }
  const round50 = (m) => Math.max(50, Math.round(m / 50) * 50);
  const mins = (sec) => Math.max(1, Math.round(sec / 60));
  function fmtTime(iso, withTime = true) {
    if (!iso) return "unknown";
    const o = { day: "numeric", month: "short", year: "numeric", timeZone: TZ };
    if (withTime) Object.assign(o, { hour: "2-digit", minute: "2-digit" });
    return new Date(iso).toLocaleString("en-GB", o);
  }
  const modeLabel = (m) => tp(m === "tram" ? "tip.tramStop" : "tip.busStop");
  // Source data is often ALL CAPS ("ASPENDOS BLV-7", "MEYDAN - VARSAK ALTIAYAK").
  // Display it in Turkish-aware title case; mixed-case strings are left alone.
  function nice(s) {
    if (!s || /[a-zçğıöşü]/.test(s)) return s || "";
    return s.toLocaleLowerCase("tr")
      .replace(/(^|[\s\-–(/.])(\p{L})/gu, (m, p, c) => p + c.toLocaleUpperCase("tr"))
      .replace(/(\s)(Ve|İle|De|Da)(?=\s)/g, (m, sp, w) => sp + w.toLocaleLowerCase("tr")); // Turkish conjunctions stay lower case
  }
  const niceDir = (s) => nice(s).replace(/\s+-\s*|\s*-\s+/g, " → ");

  // ---------------- icons (Material Icons paths, 24×24) ----------------
  const P = {
    tram: "M19 16.94V8.5c0-2.79-2.61-3.4-6.01-3.49l.76-1.51H17V2H7v1.5h4.75l-.76 1.52C7.86 5.11 5 5.73 5 8.5v8.44c0 1.45 1.19 2.66 2.59 2.97L6 21.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 20h-.08c1.69 0 2.58-1.37 2.58-3.06zm-7 1.56c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5-4.5H7V9h10v5z",
    bus: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
    walk: "M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    route: "M19 15.18V7c0-2.21-1.79-4-4-4s-4 1.79-4 4v10c0 1.1-.9 2-2 2s-2-.9-2-2V8.82C8.16 8.4 9 7.3 9 6c0-1.66-1.34-3-3-3S3 4.34 3 6c0 1.3.84 2.4 2 2.82V17c0 2.21 1.79 4 4 4s4-1.79 4-4V7c0-1.1.9-2 2-2s2 .9 2 2v8.18c-1.16.41-2 1.51-2 2.82 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.3-.84-2.4-2-2.82z",
    expand: "M21 11V3h-8l3.29 3.29-10 10L3 13v8h8l-3.29-3.29 10-10z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    chevron: "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z",
    info: "M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
    recenter: "M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z",
    map: "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z",
    arrow: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
    transit: "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  };
  const svg = (name, cls = "") => `<svg class="tc-svg ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${P[name]}"/></svg>`;
  const badge = (mode, size = "md") => `<span class="tc-badge tc-badge-${size} is-${mode}">${svg(P[mode] ? mode : "route")}</span>`;

  // ---------------- small components ----------------
  function chip(line) {
    const dirs = line.directions.map((d) => (d.from && d.to ? `${d.from} → ${d.to}` : niceDir(d.name))).join("  ·  ");
    return `<span class="tc-chip is-${esc(line.mode)}" title="${esc(`${line.ref}: ${dirs}`)}">${esc(line.ref)}</span>`;
  }
  function chips(stop, max = 0) {
    if (!stop.lines.length) return `<span class="tc-nolines">${t("lines.none")}</span>`;
    if (!max || stop.lines.length <= max) return stop.lines.map(chip).join("");
    const rest = stop.lines.slice(max - 1);
    return stop.lines.slice(0, max - 1).map(chip).join("") +
      `<span class="tc-chip is-more" title="${esc(rest.map((l) => l.ref).join(", "))}">+${rest.length}</span>`;
  }
  // One short disclaimer for every card and both location types, plus the required OpenStreetMap attribution.
  const disclaimer = () => `<p class="tc-disclaimer">${svg("info")}<span>${t("notice.disclaimer")} ${t("notice.attribution", { osm: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' })}</span></p>`;

  const nearestOf = (data, mode) => data.stops.find((s) => s.mode === mode) || null;
  // ---------------- map ----------------
  // Framing presets: keep the property (or the area) centred and choose the zoom
  // by intent, not by "fit every stop".
  //   exact        – walking scale: the focus stops comfortably in view, zoom clamped
  //   approximate  – the whole area circle with a margin (its shape says "somewhere in here")
  const FRAME = {
    mapTall: { exact: [14.75, 15.5], approx: [12.25, 14.5], pad: [60, 160], approxPadXY: [70, 110] },
    mapWide: { exact: [15, 15.75], approx: [12.5, 14.75], pad: [160, 80], approxPadXY: [120, 110] },
  };
  // Tile servers that also answer when the page is opened straight from disk (file://).
  // tile.openstreetmap.org refuses requests without a Referer ("Access blocked"), so it is not used.
  // If a server keeps failing before any tile loads, the next one is used (remembered for later maps).
  const OSM_ATTR = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
  const TILES = [
    { url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", subdomains: "abc", maxZoom: 19, attribution: `${OSM_ATTR} · <a href="https://www.hotosm.org/" target="_blank" rel="noopener">HOT</a>` },
    { url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png", maxZoom: 19, attribution: OSM_ATTR },
    { url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", maxZoom: 16, attribution: "Tiles © Esri" },
  ];
  let tileIdx = 0;
  function addTiles(map) {
    const p = TILES[tileIdx];
    const layer = L.tileLayer(p.url, { subdomains: p.subdomains || "abc", maxNativeZoom: p.maxZoom, maxZoom: 19, className: "tc-tiles", attribution: p.attribution });
    let ok = 0, bad = 0;
    layer.on("tileload", () => { ok++; });
    layer.on("tileerror", () => {
      if (++bad < 3 || ok || tileIdx >= TILES.length - 1 || !map._loaded) return;
      if (TILES[tileIdx] === p) tileIdx++;
      map.removeLayer(layer);
      addTiles(map);
    });
    layer.addTo(map);
  }
  function createMap(el, data, opts = {}) {
    const O = data.origin;
    const interactive = opts.interactive !== false;
    const preset = FRAME[opts.preset || "mapWide"];
    const map = L.map(el, {
      zoomControl: false, dragging: interactive, scrollWheelZoom: false, doubleClickZoom: interactive,
      boxZoom: false, keyboard: interactive, touchZoom: interactive, zoomSnap: 0.25, attributionControl: true,
      minZoom: 11, maxZoom: 18, // never zoom out to a meaningless region or into empty tiles
    });
    // Base map, visually softened in CSS (.tc-tiles) so stops and lines carry the colour.
    // window.TRANSIT_NO_TILES: schematic map without tiles.
    if (!window.TRANSIT_NO_TILES) addTiles(map);
    map.attributionControl.setPrefix("");
    // Scrolling the page must never get stuck on the map: zoom with Ctrl/⌘ + scroll,
    // pan with two fingers on phones. A short hint explains it when someone tries otherwise.
    if (interactive && opts.cooperative) {
      const hint = L.DomUtil.create("div", "tm-hint", el);
      hint.setAttribute("aria-hidden", "true");
      let timer = 0, lastZoom = 0;
      const show = (key) => {
        hint.textContent = tp(key);
        hint.classList.add("is-on");
        clearTimeout(timer);
        timer = setTimeout(() => hint.classList.remove("is-on"), 1400);
      };
      const mac = /Mac|iPhone|iPad/.test(navigator.platform || "");
      el.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          hint.classList.remove("is-on");
          const now = Date.now();
          if (now - lastZoom < 180) return;
          lastZoom = now;
          map.setZoomAround(map.mouseEventToContainerPoint(e), map.getZoom() + (e.deltaY < 0 ? 0.5 : -0.5));
        } else {
          show(mac ? "hint.cmdZoom" : "hint.ctrlZoom");
        }
      }, { passive: false });
      if (L.Browser.mobile) {
        map.dragging.disable();
        el.addEventListener("touchstart", (e) => { if (e.touches.length > 1) map.dragging.enable(); else map.dragging.disable(); }, { passive: true });
        el.addEventListener("touchmove", (e) => { if (e.touches.length === 1) show("hint.twoFingers"); }, { passive: true });
        el.addEventListener("touchend", () => map.dragging.disable(), { passive: true });
      }
    }
    if (opts.scale) L.control.scale({ metric: true, imperial: false, maxWidth: 90, position: "bottomleft" }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const walkLayer = L.layerGroup().addTo(map);
    let currentId = null, destroyed = false, label = null, focusStops = [];

    if (data.approximate) {
      // Same circle as the live site's approximate-location map (google.maps.Circle: radius 1000, #FF0000, 2 px, fill 0.2)
      L.circle([O.lat, O.lon], { radius: O.areaRadius, color: "#FF0000", opacity: 1, weight: 2, fillColor: "#FF0000", fillOpacity: 0.2, interactive: false }).addTo(map);
    } else {
      L.marker([O.lat, O.lon], {
        icon: L.divIcon({
          className: "tm-wrap",
          html: `<svg class="tm-prop" viewBox="0 0 34 44" aria-hidden="true"><path d="M17 1C8.2 1 1 8 1 16.7 1 28.4 17 43 17 43s16-14.6 16-26.3C33 8 25.8 1 17 1z" fill="${RED}" stroke="#fff" stroke-width="2"/><g transform="translate(8 7) scale(.75)"><path fill="#fff" d="${P.home}"/></g></svg>`,
          iconSize: [34, 44], iconAnchor: [17, 43],
        }),
        zIndexOffset: 1000, keyboard: false, interactive: false,
      }).addTo(map);
      L.marker([O.lat, O.lon], {
        icon: L.divIcon({ className: "tm-wrap", html: '<span class="tm-halo"></span>', iconSize: [46, 46], iconAnchor: [23, 23] }),
        zIndexOffset: -100, keyboard: false, interactive: false,
      }).addTo(map);
    }

    const markers = new Map();
    const emph = opts.emphasis ? new Set(opts.emphasis) : null;
    const groups = { transport: L.layerGroup().addTo(map) };
    const bigIcon = (s) => L.divIcon({ className: "tm-wrap", html: `<div class="tm-stop is-${s.mode}">${svg(s.mode)}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
    const dotIcon = (s) => L.divIcon({ className: "tm-wrap", html: `<div class="tm-dot is-${s.mode}"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] });
    for (const s of data.stops) {
      const big = !emph || emph.has(s.id);
      const m = L.marker([s.lat, s.lon], {
        icon: big ? bigIcon(s) : dotIcon(s),
        keyboard: interactive, title: `${nice(s.displayName)} · ${modeLabel(s.mode)}`, zIndexOffset: big ? 200 : 0,
        interactive: !!opts.onSelect,
      });
      if (opts.onSelect) {
        m.bindTooltip(`<b>${esc(nice(s.displayName))}</b><span>${modeLabel(s.mode)}</span>`, { direction: "top", offset: [0, -14], className: "tm-tip" });
        m.on("click", () => opts.onSelect(s.id));
      }
      m.addTo(groups.transport);
      markers.set(s.id, m);
    }
    function setVisible(layer, on) {
      const g = groups[layer]; if (!g) return;
      if (on && !map.hasLayer(g)) g.addTo(map); else if (!on && map.hasLayer(g)) map.removeLayer(g);
      if (!on && currentId) {
        routeLayer.clearLayers(); walkLayer.clearLayers(); if (label) { label.remove(); label = null; }
      }
    }

    // Zoom + "back to the property" controls (interactive maps only)
    if (interactive) {
      const Ctl = L.Control.extend({
        onAdd() {
          const box = L.DomUtil.create("div", `tm-ctl${opts.compactControls ? " is-sm" : ""}`);
          // Screen-reader labels stay in English (not translated on this site); the tooltip is translated.
          const back = tp(data.approximate ? "tip.backArea" : "tip.backProperty");
          box.innerHTML = `<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">−</button><button type="button" data-z="home" aria-label="${back}" title="${back}">${svg("recenter")}</button>`;
          L.DomEvent.disableClickPropagation(box);
          box.addEventListener("click", (e) => {
            const b = e.target.closest("button"); if (!b) return;
            if (b.dataset.z === "in") map.zoomIn(0.5); else if (b.dataset.z === "out") map.zoomOut(0.5); else frame(focusStops);
          });
          return box;
        },
      });
      new Ctl({ position: "topright" }).addTo(map);
    }

    function frame(focus = []) {
      focusStops = focus;
      let z;
      if (data.approximate) {
        z = map.getBoundsZoom(L.latLng(O.lat, O.lon).toBounds(O.areaRadius * 2), false, L.point(...(preset.approxPadXY || [preset.approxPad, preset.approxPad])));
        z = Math.max(preset.approx[0], Math.min(z, preset.approx[1]));
      } else {
        // mirror each focus stop around the property so the property stays centred
        const pts = [[O.lat, O.lon]];
        for (const s of focus) pts.push([s.lat, s.lon], [2 * O.lat - s.lat, 2 * O.lon - s.lon]);
        z = pts.length > 1 ? map.getBoundsZoom(L.latLngBounds(pts), false, L.point(...preset.pad)) : 16;
        z = Math.max(preset.exact[0], Math.min(z, preset.exact[1]));
      }
      map.setView([O.lat, O.lon], z, { animate: false });
      // A panel over part of the map: shift the view so the property sits in the middle of the visible part.
      const off = opts.offset ? opts.offset() : null;
      if (off && (off[0] || off[1])) map.panBy([-off[0], -off[1]], { animate: false });
    }

    function originBounds() {
      return data.approximate ? L.latLng(O.lat, O.lon).toBounds(O.areaRadius * 2) : L.latLngBounds([[O.lat, O.lon], [O.lat, O.lon]]);
    }

    function select(id, { pan = true } = {}) {
      routeLayer.clearLayers();
      walkLayer.clearLayers();
      if (label) { label.remove(); label = null; }
      currentId = id;
      markers.forEach((m, mid) => {
        // A stop shown as a context dot becomes a full marker while it is selected.
        if (emph && !emph.has(mid)) {
          const st = data.stops.find((x) => x.id === mid);
          const want = mid === id ? "big" : "dot";
          if (m._tcIcon !== want) { m.setIcon(want === "big" ? bigIcon(st) : dotIcon(st)); m._tcIcon = want; }
        }
        const el = m.getElement();
        if (el) el.classList.toggle("tm-selected", mid === id);
        m.setZIndexOffset(mid === id ? 800 : emph && !emph.has(mid) ? 0 : 200);
      });
      const s = data.stops.find((x) => x.id === id);
      if (!s) return;
      // Line routes (KentKart shapes or OSM relations). Shared corridors are drawn once.
      const drawn = new Set();
      for (const line of s.lines) {
        for (const gk of line.geomKeys || []) {
          const g = data.routeGeometry[gk];
          const sig = g && g.segments.length && `${g.segments[0][0]}|${g.segments.length}|${g.segments[0].length}`;
          if (!g || !g.segments.length || drawn.has(sig)) continue;
          drawn.add(sig);
          L.polyline(g.segments, { color: "#fff", weight: 7, opacity: 0.9, interactive: false }).addTo(routeLayer);
          L.polyline(g.segments, { color: COLOR[line.mode] || COLOR.other, weight: 4, opacity: 0.6, interactive: false }).addTo(routeLayer);
        }
      }
      if (!data.approximate) {
        const drawWalk = (geom) => {
          walkLayer.clearLayers();
          if (!geom) return;
          L.polyline(geom, { color: "#fff", weight: 7, opacity: 0.95, interactive: false }).addTo(walkLayer);
          L.polyline(geom, { color: RED, weight: 4, dashArray: "1 7", lineCap: "round", interactive: false }).addTo(walkLayer);
        };
        drawWalk(s.walk && s.walk.geometry);
        if (s.walk && !s.walk.geometry && data.walkingPath) {
          Promise.resolve(data.walkingPath(s)).then((g) => { if (g && currentId === id && !destroyed) drawWalk(g); });
        }
      }
      // Label beside the stop (never above it, where the property pin is), on whichever
      // side has room, so it is never clipped by the map edge.
      const placeLabel = () => {
        if (!opts.labels || currentId !== id || destroyed) return;
        if (label) label.remove();
        const pt = map.latLngToContainerPoint([s.lat, s.lon]);
        // Away from the property pin, unless that side runs off the map.
        const home = map.latLngToContainerPoint([O.lat, O.lon]);
        let left = pt.x < home.x;
        if (!left && pt.x > map.getSize().x - 170) left = true;
        if (left && pt.x < 170 + (opts.insets ? opts.insets()[0][0] : 0)) left = false;
        label = L.tooltip({ permanent: true, direction: left ? "left" : "right", offset: [left ? -18 : 18, 0], className: `tm-label ${left ? "is-left" : ""}`, interactive: false })
          .setLatLng([s.lat, s.lon]).setContent(`<span class="tm-label-txt">${esc(nice(s.displayName))}</span>`).addTo(map);
      };
      const b = originBounds().extend([s.lat, s.lon]);
      // Free part of the map (a panel may cover some of it): [top-left, bottom-right] insets in px.
      const ins = opts.insets ? opts.insets() : [[0, 0], [0, 0]];
      const size = map.getSize();
      const tl = map.latLngToContainerPoint(b.getNorthWest()), br = map.latLngToContainerPoint(b.getSouthEast());
      const m = 0.12 * Math.min(size.x, size.y);
      const visible = tl.x >= ins[0][0] + m && tl.y >= ins[0][1] + m && br.x <= size.x - ins[1][0] - m && br.y <= size.y - ins[1][1] - m;
      if (pan && !visible) {
        // Bring the stop into view without losing the property / area, then label it.
        map.once("moveend", placeLabel);
        map.flyToBounds(b, { paddingTopLeft: [ins[0][0] + 60, ins[0][1] + 60], paddingBottomRight: [ins[1][0] + 60, ins[1][1] + 60], maxZoom: map.getZoom(), duration: 0.5 });
      } else {
        placeLabel();
      }
    }

    // Keep the same centre when the container grows or shrinks (e.g. a panel opening next to it).
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (!destroyed) map.invalidateSize({ pan: true, animate: false }); }) : null;
    if (ro) ro.observe(el);

    // Every line serving the stops, drawn at once ("Show lines"); one line can be highlighted.
    const linesLayer = L.layerGroup();
    function showLines(on, focusRef = null) {
      linesLayer.clearLayers();
      if (!on) { if (map.hasLayer(linesLayer)) map.removeLayer(linesLayer); return; }
      const byRef = new Map();
      for (const st of data.stops) for (const l of st.lines) {
        const e = byRef.get(l.ref) || { ref: l.ref, mode: l.mode, keys: new Set() };
        (l.geomKeys || []).forEach((k) => e.keys.add(k));
        byRef.set(l.ref, e);
      }
      const order = [...byRef.values()].sort((a, b) => (a.ref === focusRef) - (b.ref === focusRef)); // highlighted line on top
      for (const e of order) {
        const hi = focusRef === e.ref, dim = focusRef && !hi;
        for (const gk of e.keys) {
          const g = data.routeGeometry[gk];
          if (!g || !g.segments.length) continue;
          if (hi) L.polyline(g.segments, { color: "#fff", weight: 8, opacity: 0.95, interactive: false }).addTo(linesLayer);
          L.polyline(g.segments, { color: COLOR[e.mode] || COLOR.other, weight: hi ? 5 : 3, opacity: dim ? 0.15 : hi ? 0.95 : 0.5, interactive: false }).addTo(linesLayer);
        }
      }
      linesLayer.addTo(map);
    }

    return { map, frame, select, setVisible, showLines, invalidate: () => map.invalidateSize(), destroy: () => { destroyed = true; if (ro) ro.disconnect(); map.remove(); } };
  }
  // ---------------- states ----------------
  const loadingHTML = () => `<div class="tc tc-card tc-state"><div class="tc-spinner"></div><div><b>${t("state.loading")}</b></div></div>`;
  const errorHTML = () => `<div class="tc tc-card tc-state is-error" role="status"><span class="tc-badge tc-badge-md is-error">${svg("info")}</span>
      <div><b>${t("state.errorTitle")}</b><br><span class="tc-muted">${t("state.errorBody")}</span>
      <div><button type="button" class="tc-btn tc-btn-secondary tc-retry">${t("action.tryAgain")}</button></div></div></div>`;

  const focusOf = (data) => [nearestOf(data, "tram"), nearestOf(data, "bus")].filter(Boolean);

  // ---------- location map section (H / V) ----------
  // The map is the feature: a section of the listing (site-style title) that is
  // mostly map. Public transport is a secondary feature on it:
  //   - stops on the map (the nearest ones as markers, the rest as small dots),
  //   - a small box in a corner with an on/off switch and the nearest tram and bus stop,
  //   - a popup on the map with walking time and lines when a stop is clicked.
  //   H  Yatay: main column, wide map right above "Features"
  //   V  Dikey: sidebar, map under "Every time correct prices"
  function renderMapArea(slot, data, variant, initial = {}) {
    const near = focusOf(data);
    const others = Math.max(0, data.stops.length - near.length);
    // Public transport starts switched off: the section opens as a clean location map.
    let transitOn = initial.transit === true;
    let linesOn = false, lineFocus = null;
    // Every line serving the stops on the map: tram first, then natural order (35, 46, 46A, 511…).
    const allLines = [...new Map(data.stops.flatMap((s) => s.lines).map((l) => [l.ref, l])).values()]
      .sort((a, b) => (a.mode === "tram" ? 0 : 1) - (b.mode === "tram" ? 0 : 1) || a.ref.localeCompare(b.ref, "en", { numeric: true }));

    const nearRow = (s) => `<li class="tc-mx-row" data-stop="${s.id}"><button type="button" class="tc-mx-btn">
        ${badge(s.mode, "xs")}
        <span class="tc-mx-name">${esc(nice(s.displayName))}</span>
        <span class="tc-mx-lines">${chips(s, 3)}</span>
        <span class="tc-mx-dist">${data.approximate
          ? (s.inArea ? t("dist.inArea") : t("dist.about", { distance: fmtDist(round50(s.areaDist), true) }))
          : s.walk ? `${svg("walk")}${t("dist.minutes", { minutes: mins(s.walk.duration) })}` : fmtDist(s.straight)}</span>
      </button></li>`;

    slot.innerHTML = `<section class="tc tc-mx tc-mx-${variant} ${data.approximate ? "is-approx" : ""}" aria-label="${tp("loc.title")}">
      <div class="top-title"><span>${t("loc.title")}</span></div>
      <div class="tc-mx-stage">
        <div class="tc-map tc-mx-map"></div>
        <div class="tc-mx-box ${transitOn ? "is-on" : ""}">
          <div class="tc-mx-head">
            ${svg("transit", "tc-mx-icon")}<span>${t("layer.transport")}</span>
            <button type="button" class="tc-switch" role="switch" aria-checked="${transitOn}" aria-label="${tp("layer.transport")}"><i></i></button>
          </div>
          <div class="tc-mx-body">
            <ul class="tc-mx-list">${near.map(nearRow).join("")}</ul>
            ${others ? `<p class="tc-mx-more">${t("transit.moreStops", { n: others })}</p>` : ""}
            ${allLines.length ? `<div class="tc-mx-lineswrap">
              <button type="button" class="tc-mx-linesbtn" aria-pressed="false">${svg("route")}<span>${t("transit.showLines")}</span><b>${allLines.length}</b></button>
              <div class="tc-mx-lineset" hidden>
                <p class="tc-mx-hint">${t("transit.pickLine")}</p>
                <div class="tc-mx-chips">${allLines.map((l) => `<button type="button" class="tc-chip is-${esc(l.mode)} tc-linechip" data-ref="${esc(l.ref)}" aria-pressed="false" title="${esc(`${l.ref}: ${l.directions.map((d) => (d.from && d.to ? `${nice(d.from)} → ${nice(d.to)}` : niceDir(d.name))).join("  ·  ")}`)}">${esc(l.ref)}</button>`).join("")}</div>
              </div>
            </div>` : ""}
          </div>
        </div>
      </div>
      ${disclaimer()}
    </section>`;

    const root = slot.querySelector(".tc-mx");
    const box = root.querySelector(".tc-mx-box");
    // Part of the map the transport box covers (bottom-left): keep popups and pans clear of it.
    const insets = () => {
      const m = root.querySelector(".tc-mx-map").getBoundingClientRect(), b = box.getBoundingClientRect();
      return [[0, 0], [0, Math.max(0, m.bottom - b.top)]]; // 0 when the open box sits below the map
    };
    const ctl = createMap(root.querySelector(".tc-mx-map"), data, {
      onSelect: (id) => openStop(id), labels: false, compactControls: variant === "V", cooperative: true,
      emphasis: near.map((s) => s.id), preset: variant === "V" ? "mapTall" : "mapWide", insets,
    });
    const map = ctl.map;
    let popup = null;

    function popupHTML(s) {
      const walk = data.approximate
        ? (s.inArea ? t("detail.inside") : t("detail.fromArea", { distance: fmtDist(round50(s.areaDist), true) }))
        : s.walk ? `${svg("walk")}${t("dist.minutes", { minutes: mins(s.walk.duration) })} · ${fmtDist(s.walk.distance)}` : `${fmtDist(s.straight)} ${t("dist.straight")}`;
      const dirs = s.lines.length
        ? `<ul class="tc-dirs">${s.lines.map((l) => `<li>${chip(l)}<div>${l.directions.map((d) => `<span>${d.from && d.to ? `${esc(nice(d.from))} → ${esc(nice(d.to))}` : esc(niceDir(d.name))}</span>`).join("")}</div></li>`).join("")}</ul>`
        : `<p class="tc-note">${t("detail.noLines")}</p>`;
      return `<div class="tc tc-pop">
        <div class="tc-pop-head">${badge(s.mode, "sm")}<div><span class="tc-row-mode">${t(s.mode === "tram" ? "mode.tram" : "mode.bus")}${s.stopCode ? ` · ${t("detail.stopNo")} ${esc(s.stopCode)}` : ""}</span><b>${esc(nice(s.displayName))}</b></div></div>
        <div class="tc-pop-walk">${walk}</div>
        ${s.lines.length ? `<div class="tc-label">${t("detail.lines")}</div>` : ""}
        <div class="tc-pop-dirs">${dirs}</div>
      </div>`;
    }
    function openStop(id) {
      const s = data.stops.find((x) => x.id === id);
      if (!s) return;
      if (!transitOn) setTransit(true);
      ctl.select(id, { pan: false });
      const ins = insets();
      popup = L.popup({ className: "tm-pop", maxWidth: 300, minWidth: 240, offset: [0, -12], autoPanPaddingTopLeft: [ins[0][0] + 16, 16], autoPanPaddingBottomRight: [16, ins[1][1] + 16] })
        .setLatLng([s.lat, s.lon]).setContent(popupHTML(s)).openOn(map);
      // Re-run Leaflet's auto-pan once the popup has its final size (fonts, chips).
      requestAnimationFrame(() => { if (popup && popup.isOpen() && popup._adjustPan) { popup.update(); popup._adjustPan(); } });
      root.querySelectorAll(".tc-mx-row").forEach((r) => r.classList.toggle("is-sel", r.dataset.stop === id));
    }
    map.on("popupclose", () => {
      root.querySelectorAll(".tc-mx-row").forEach((r) => r.classList.remove("is-sel"));
      resetSelection();
    });
    // Default: the walking path to the nearest stop (exact location only), nothing else highlighted.
    function resetSelection() {
      const first = data.stops[0];
      if (transitOn && first && !data.approximate) ctl.select(first.id, { pan: false }); else ctl.select(null, { pan: false });
    }
    function setLines(on, focus = null) {
      linesOn = on; lineFocus = on ? focus : null;
      const btn = root.querySelector(".tc-mx-linesbtn");
      if (!btn) return;
      btn.setAttribute("aria-pressed", String(on));
      btn.querySelector("span").innerHTML = t(on ? "transit.hideLines" : "transit.showLines");
      root.querySelector(".tc-mx-lineset").hidden = !on;
      root.querySelectorAll(".tc-linechip").forEach((c) => {
        const sel = c.dataset.ref === lineFocus;
        c.setAttribute("aria-pressed", String(sel));
        c.classList.toggle("is-dim", !!lineFocus && !sel);
      });
      ctl.showLines(on, lineFocus);
    }
    // The box is anchored to the bottom of the map with its header at the bottom, so it opens
    // upwards: the header stays where it was clicked and the content grows above it.
    // Size changes are animated (FLIP: measure, change, play from the old size).
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resizeBox(change) {
      const overlayBefore = getComputedStyle(box).position === "absolute";
      const from = box.getBoundingClientRect();
      change();
      if (reduceMotion || !overlayBefore || getComputedStyle(box).position !== "absolute") return;
      const to = box.getBoundingClientRect();
      if (Math.abs(to.width - from.width) < 1 && Math.abs(to.height - from.height) < 1) return;
      box.getAnimations().forEach((a) => a.cancel());
      box.animate([{ width: `${from.width}px`, height: `${from.height}px` }, { width: `${to.width}px`, height: `${to.height}px` }],
        { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    function setTransit(on) {
      transitOn = on;
      resizeBox(() => {
        if (!on) setLines(false);
        box.classList.toggle("is-on", on);
      });
      box.querySelector(".tc-switch").setAttribute("aria-checked", String(on));
      ctl.setVisible("transport", on);
      if (!on) map.closePopup();
      resetSelection();
    }
    root.addEventListener("click", (e) => {
      if (e.target.closest(".leaflet-control-attribution a")) return;
      if (e.target.closest(".tc-switch, .tc-mx-head")) return setTransit(!transitOn);
      if (e.target.closest(".tc-mx-linesbtn")) return resizeBox(() => setLines(!linesOn));
      const lc = e.target.closest(".tc-linechip");
      if (lc) return setLines(true, lineFocus === lc.dataset.ref ? null : lc.dataset.ref);
      const r = e.target.closest(".tc-mx-row");
      if (r) openStop(r.dataset.stop);
    });

    // The property (or the approximate-area circle) opens exactly in the middle of the map.
    ctl.setVisible("transport", transitOn);
    const settle = () => { ctl.invalidate(); ctl.frame(near); resetSelection(); };
    settle();
    requestAnimationFrame(settle);
    if (initial.stopId) requestAnimationFrame(() => openStop(initial.stopId));
    return { destroy: () => ctl.destroy(), select: (id) => openStop(id), transit: (on) => setTransit(on), lines: (on, ref) => setLines(on, ref) };
  }

  const renderH = (slot, data, initial) => renderMapArea(slot, data, "H", initial);
  const renderV = (slot, data, initial) => renderMapArea(slot, data, "V", initial);

  // ======================================================================
  // Prototype controller: switchers, data badge, review notes
  // ======================================================================
  const RENDER = { H: renderH, V: renderV };
  let current = "H", locationMode = "exact", controller = null, DATA = null, ERROR = null;

  function setVariant(v, { scroll = true } = {}) {
    if (!RENDER[v]) v = "H";
    current = v;
    document.querySelectorAll(".proto-switch [data-variant]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.variant === v)));
    if (controller) { try { controller.destroy(); } catch (e) { /* ignore */ } controller = null; }
    document.querySelectorAll(".transit-slot").forEach((s) => { s.innerHTML = ""; s.classList.remove("is-active"); });
    const slot = document.getElementById(`slot-${v}`);
    slot.classList.add("is-active");
    if (DATA) controller = RENDER[v](slot, DATA);
    else slot.innerHTML = ERROR ? errorHTML() : loadingHTML();
    writeHash();
    if (scroll) slot.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function writeHash() {
    if (history.replaceState) history.replaceState(null, "", `${location.search}#${current}${locationMode === "approximate" ? "-approx" : ""}`);
  }
  function readHash() {
    const h = location.hash.slice(1);
    // #H / #V (older links: #A3 = H, #A1 = V)
    const m = h.match(/^(H|V|A3|A1)/i);
    const v = m ? { A3: "H", A1: "V" }[m[1].toUpperCase()] || m[1].toUpperCase() : "H";
    return { v, approx: /approx/i.test(h) };
  }

  function dataBadge() {
    const el = document.getElementById("proto-data");
    if (ERROR) { el.className = "proto-data is-err"; el.textContent = "● Data unavailable"; return; }
    if (!DATA) { el.className = "proto-data"; el.textContent = "● Loading…"; return; }
    const s = DATA.status;
    el.className = `proto-data ${s.source === "live" ? "is-live" : "is-cache"}`;
    el.textContent = s.source === "live" ? `● Live OSM data · ${fmtTime(s.retrievedAt)}` : `● Cached data · ${fmtTime(s.retrievedAt, false)}`;
  }

  async function load() {
    DATA = null; ERROR = null; dataBadge();
    setVariant(current, { scroll: false });
    try {
      DATA = await TD.load({ locationMode });
      window.__transit = DATA;
    } catch (e) {
      console.error(e);
      ERROR = e;
    }
    dataBadge();
    setVariant(current, { scroll: false });
  }

  function setLocation(mode) {
    locationMode = mode;
    document.querySelectorAll(".proto-switch [data-loc]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.loc === mode)));
    load();
  }

  function boot() {
    document.querySelectorAll(".proto-switch [data-variant]").forEach((b) => b.addEventListener("click", () => setVariant(b.dataset.variant)));
    document.querySelectorAll(".proto-switch [data-loc]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.loc !== locationMode) setLocation(b.dataset.loc); }));
    document.getElementById("proto-jump").addEventListener("click", () => {
      const s = document.getElementById(`slot-${current}`); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    // Gallery location button: no full-screen map any more; it takes you to the map area on the page.
    const gm = document.getElementById("g-map");
    if (gm) gm.addEventListener("click", () => {
      const s = document.getElementById(`slot-${current}`); if (!s) return;
      s.scrollIntoView({ behavior: "smooth", block: "center" });
      s.classList.remove("is-active"); void s.offsetWidth; s.classList.add("is-active");
    });
    document.addEventListener("click", (e) => { if (e.target.closest(".tc-retry")) load(); });
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector(".tc-modal")) return;
      const v = { "1": "H", "2": "V" }[e.key];
      if (v) setVariant(v);
    });
    const h = readHash();
    current = RENDER[h.v] ? h.v : "H";
    if (h.approx) {
      locationMode = "approximate";
      document.querySelectorAll(".proto-switch [data-loc]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.loc === "approximate")));
    }
    load().then(() => { if (location.hash) document.getElementById(`slot-${current}`).scrollIntoView({ block: "start" }); });
  }

  // Building blocks for the translator sheet (docs/transit-card-a-texts.html).
  window.TransitUI = { renderH, renderV, loadingHTML, errorHTML, load: (opts) => TD.load(opts) };
  if (!document.getElementById("proto-data")) return; // loaded as a library, not the prototype page

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
