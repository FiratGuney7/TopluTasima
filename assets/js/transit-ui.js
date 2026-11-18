/*
 * Transport card UI: card variations rendered from the SAME data object.
 * Shared building blocks (map, stop list, stop detail, header) are used by every
 * variation; they differ only in layout, density and placement.
 *
 *   A1 Sidebar card        – sidebar, below "Every time correct prices" (+ expanded view)
 *   A2 Page section        – main column, after the description (+ expanded view)
 *   A3 Highlight band      – main column, under the price (+ expanded view)
 *   B  Compact card        – secondary: main column, after the description
 *   C  Full-width card     – secondary: below Property Details, before Features
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
  const fmtHours = (h) => h.replace(/^Mo-Su\s*/, `${tp("detail.daily")} `).replace(/-(\d)/g, "–$1");
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
  // Distance shown in rows. Exact: walking route (else labelled straight-line). Approximate: from the area.
  function dist(stop, data, cls = "") {
    if (data.approximate) {
      if (stop.inArea) return `<span class="tc-dist ${cls}"><span class="tc-inarea">${t("dist.inArea")}</span></span>`;
      return `<span class="tc-dist ${cls}"><b>${t("dist.about", { distance: fmtDist(round50(stop.areaDist), true) })}</b><small>${t("dist.fromArea")}</small></span>`;
    }
    if (stop.walk) {
      return `<span class="tc-dist ${cls}" title="${fmtDist(stop.walk.distance, true)} · ${tp("detail.straight")} ${fmtDist(stop.straight, true)}">
        <b>${t("dist.minutes", { minutes: mins(stop.walk.duration) })}</b><small>${svg("walk")}${fmtDist(stop.walk.distance)}</small></span>`;
    }
    return `<span class="tc-dist ${cls}"><b>${fmtDist(stop.straight)}</b><small>${t("dist.straight")}</small></span>`;
  }
  function stopDetail(stop, data) {
    const kv = (k, v) => `<div class="tc-kv"><span>${k}</span><b>${v}</b></div>`;
    const metrics = data.approximate
      ? kv(t("detail.distance"), stop.inArea ? t("detail.inside") : t("detail.fromArea", { distance: fmtDist(round50(stop.areaDist), true) }))
      : (stop.walk ? kv(t("detail.walk"), `${t("dist.minutes", { minutes: mins(stop.walk.duration) })} · ${fmtDist(stop.walk.distance)}`) : "") +
        kv(t("detail.straight"), fmtDist(stop.straight));
    const lines = stop.lines.length
      ? `<ul class="tc-dirs">${stop.lines.map((l) => `<li>${chip(l)}<div>${l.directions.map((d) => `<span>${d.from && d.to ? `${esc(nice(d.from))} → ${esc(nice(d.to))}` : esc(niceDir(d.name))}${d.hours ? ` <em>${esc(fmtHours(d.hours))}</em>` : ""}</span>`).join("")}</div></li>`).join("")}</ul>`
      : `<p class="tc-note">${t("detail.noLines")}</p>`;
    return `<div class="tc-detail">
      <div class="tc-kvs">${metrics}${stop.stopCode ? kv(t("detail.stopNo"), esc(stop.stopCode)) : ""}</div>
      ${stop.lines.length ? `<div class="tc-label">${t("detail.lines")}</div>` : ""}
      ${lines}
    </div>`;
  }
  // One short disclaimer for every card and both location types, plus the required OpenStreetMap attribution.
  const disclaimer = () => `<p class="tc-disclaimer">${svg("info")}<span>${t("notice.disclaimer")} ${t("notice.attribution", { osm: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' })}</span></p>`;

  function keyStats(data) {
    const list = data.approximate ? data.stops.filter((s) => s.inArea) : data.stops;
    return {
      tram: list.filter((s) => s.mode === "tram").length,
      bus: list.filter((s) => s.mode === "bus").length,
      lines: new Set(list.flatMap((s) => s.lines.map((l) => l.ref))).size,
      scope: data.approximate ? "in this area" : `within ${data.config.radiusMeters / 1000} km`,
    };
  }
  // Tinted icon tile: soft mode-coloured background, mode-coloured glyph.
  const tile = (kind, icon) => `<span class="tc-tile is-${kind}">${svg(icon)}</span>`;
  function statStrip(data, cls = "") {
    const st = keyStats(data);
    const cell = (kind, icon, n, label) =>
      `<div class="tc-stat">${tile(kind, icon)}<span class="tc-stat-text"><b class="tc-stat-num">${n}</b><span class="tc-stat-label">${label}</span></span></div>`;
    const inline = cls.includes("is-inline");
    const scopeKey = data.approximate ? "scope.area" : "scope.radius";
    const km = data.config.radiusMeters / 1000;
    // Captions are invariant ("Tram stops" under the number) so they never need plural forms.
    return `${inline ? "" : `<div class="tc-label tc-stats-scope">${t(scopeKey, { km })}</div>`}
      <div class="tc-stats ${cls}" aria-label="${tp(scopeKey, { km })}">
      ${cell("tram", "tram", st.tram, t("stat.tram"))}
      ${cell("bus", "bus", st.bus, t("stat.bus"))}
      ${cell("line", "route", st.lines, t("stat.lines"))}
    </div>`;
  }
  function headline(data) {
    const first = data.stops[0];
    if (!first) return t("headline.none");
    if (data.approximate) {
      // Approximate: say what serves the AREA (no distances to a hidden point, no counts to inflect).
      const tramRefs = [...new Set(data.stops.filter((s) => s.inArea && s.mode === "tram").flatMap((s) => s.lines.map((l) => l.ref)))];
      if (tramRefs.length) return t("headline.area.tram", { lines: esc(tramRefs.join(" · ")) });
      if (data.stops.some((s) => s.inArea && s.mode === "bus")) return t("headline.area.bus");
      return t("headline.area.near", { distance: fmtDist(round50(first.areaDist), true) });
    }
    const m = first.mode === "tram" ? "tram" : "bus";
    const stop = esc(nice(first.displayName));
    if (first.walk) return t(`headline.walk.${m}`, { stop, minutes: mins(first.walk.duration) });
    return t(`headline.dist.${m}`, { stop, distance: fmtDist(first.straight, true) });
  }
  const nearestOf = (data, mode) => data.stops.find((s) => s.mode === mode) || null;
  function legend(data) {
    return `<div class="tc-legend" aria-hidden="true">
      ${data.approximate ? `<span><i class="lg-area"></i>${t("legend.area")}</span>` : `<span><i class="lg-prop">${svg("home")}</i>${t("legend.property")}</span>`}
      <span>${badge("tram", "xs")}${t("mode.tram")}</span>
      <span>${badge("bus", "xs")}${t("mode.bus")}</span>
      ${data.approximate ? "" : `<span><i class="lg-walk"></i>${t("detail.walk")}</span>`}
      <span><i class="lg-line"></i>${t("legend.lineRoute")}</span>
    </div>`;
  }

  // ---------------- map ----------------
  // Framing presets: keep the property (or the area) centred and choose the zoom
  // by intent, not by "fit every stop".
  //   exact        – walking scale: the focus stops comfortably in view, zoom clamped
  //   approximate  – the whole area circle with a margin (its shape says "somewhere in here")
  const FRAME = {
    preview: { exact: [14.75, 16], approx: [13, 15], pad: [100, 96], approxPad: 24 },
    section: { exact: [15, 16.25], approx: [12.5, 15], pad: [120, 120], approxPad: 48 },
    thumb: { exact: [14.75, 16], approx: [12.5, 14.5], pad: [56, 56], approxPad: 10 },
    large: { exact: [14.5, 16.25], approx: [13, 15.5], pad: [140, 140], approxPad: 80 },
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
    const preset = FRAME[opts.preset || "large"];
    const map = L.map(el, {
      zoomControl: false, dragging: interactive, scrollWheelZoom: false, doubleClickZoom: interactive,
      boxZoom: false, keyboard: interactive, touchZoom: interactive, zoomSnap: 0.25, attributionControl: true,
    });
    // Base map, visually softened in CSS (.tc-tiles) so stops and lines carry the colour.
    // window.TRANSIT_NO_TILES: schematic map without tiles.
    if (!window.TRANSIT_NO_TILES) addTiles(map);
    map.attributionControl.setPrefix("");
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
    }

    const markers = new Map();
    const emph = opts.emphasis ? new Set(opts.emphasis) : null;
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
      m.addTo(map);
      markers.set(s.id, m);
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
        z = map.getBoundsZoom(L.latLng(O.lat, O.lon).toBounds(O.areaRadius * 2), false, L.point(preset.approxPad, preset.approxPad));
        z = Math.max(preset.approx[0], Math.min(z, preset.approx[1]));
      } else {
        // mirror each focus stop around the property so the property stays centred
        const pts = [[O.lat, O.lon]];
        for (const s of focus) pts.push([s.lat, s.lon], [2 * O.lat - s.lat, 2 * O.lon - s.lon]);
        z = pts.length > 1 ? map.getBoundsZoom(L.latLngBounds(pts), false, L.point(...preset.pad)) : 16;
        z = Math.max(preset.exact[0], Math.min(z, preset.exact[1]));
      }
      map.setView([O.lat, O.lon], z, { animate: false });
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
        const left = pt.x > map.getSize().x * 0.55;
        label = L.tooltip({ permanent: true, direction: left ? "left" : "right", offset: [left ? -18 : 18, 0], className: `tm-label ${left ? "is-left" : ""}`, interactive: false })
          .setLatLng([s.lat, s.lon]).setContent(`<span class="tm-label-txt">${esc(nice(s.displayName))}</span>`).addTo(map);
      };
      const b = originBounds().extend([s.lat, s.lon]);
      if (pan && !map.getBounds().pad(-0.12).contains(b)) {
        // Bring the stop into view without losing the property / area, then label it.
        map.once("moveend", placeLabel);
        map.flyToBounds(b, { padding: [70, 70], maxZoom: map.getZoom(), duration: 0.5 });
      } else {
        placeLabel();
      }
    }

    // Keep the same centre when the container grows or shrinks (e.g. a panel opening next to it).
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (!destroyed) map.invalidateSize({ pan: true, animate: false }); }) : null;
    if (ro) ro.observe(el);

    return { map, frame, select, invalidate: () => map.invalidateSize(), destroy: () => { destroyed = true; if (ro) ro.disconnect(); map.remove(); } };
  }
  // Focus set for the large maps: everything within ~10 minutes' walk (min 4 stops).
  const largeFocus = (data) => {
    const near = data.stops.filter((s) => s.walk ? s.walk.duration <= 600 : s.straight <= 700);
    return (near.length >= 4 ? near : data.stops.slice(0, 4)).slice(0, 12);
  };

  // ---------------- lists ----------------
  function stopRow(s, data, selectedId, opts = {}) {
    const sel = s.id === selectedId;
    return `<li class="tc-row ${sel ? "is-sel" : ""}" data-stop="${s.id}">
      <button type="button" class="tc-row-btn" aria-expanded="${sel}">
        ${badge(s.mode, opts.badge || "md")}
        <span class="tc-row-main">
          ${opts.modePrefix ? `<span class="tc-row-mode">${t(s.mode === "tram" ? "mode.tram" : "mode.bus")}</span>` : ""}
          <span class="tc-row-name">${esc(nice(s.displayName))}</span>
          <span class="tc-row-lines">${chips(s, opts.maxChips || 6)}</span>
        </span>
        ${dist(s, data)}
      </button>
      ${sel && opts.inlineDetail ? stopDetail(s, data) : ""}
    </li>`;
  }
  function groupedList(data, selectedId, opts = {}) {
    return [["tram", t("stat.tram")], ["bus", t("stat.bus")], ["other", "Other stops"]].map(([mode, label]) => {
      const list = data.stops.filter((s) => s.mode === mode);
      if (!list.length) return "";
      return `<section class="tc-group"><h5 class="tc-group-h">${tile(mode, P[mode] ? mode : "route")}<span class="tc-group-name">${label}</span><span class="tc-group-count">${list.length}</span></h5>
        <ul class="tc-list">${list.map((s) => stopRow(s, data, selectedId, opts)).join("")}</ul></section>`;
    }).join("");
  }

  // Shared "explorer": list + large map with selection, used by C and A's expanded view.
  function mountExplorer(root, data, initialId) {
    let selected = initialId;
    const listEl = root.querySelector(".tc-x-list");
    const ctl = createMap(root.querySelector(".tc-x-map"), data, { onSelect: (id) => setSel(id, true), labels: true, preset: "large" });
    const focus = largeFocus(data);
    const draw = () => { listEl.innerHTML = groupedList(data, selected, { inlineDetail: true }); };
    function setSel(id, fromMap) {
      selected = id; draw(); ctl.select(id);
      const r = listEl.querySelector(`[data-stop="${id}"]`);
      if (r && fromMap) r.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    listEl.addEventListener("click", (e) => { const b = e.target.closest(".tc-row-btn"); if (b) setSel(b.parentElement.dataset.stop, false); });
    ctl.frame(focus);
    requestAnimationFrame(() => { ctl.invalidate(); ctl.frame(focus); ctl.select(selected, { pan: false }); });
    draw();
    return {
      ctl,
      select: (id) => setSel(id, true),
      // Scroll only the list (never the page) so the selected stop sits under the sticky group header.
      scrollToSelected: () => {
        const r = listEl.querySelector(`[data-stop="${selected}"]`);
        if (r) listEl.scrollTop += r.getBoundingClientRect().top - listEl.getBoundingClientRect().top - 44;
      },
    };
  }
  const explorerHTML = (data) => `<div class="tc-x">
      <div class="tc-x-list" tabindex="-1"></div>
      <div class="tc-x-mapwrap"><div class="tc-map tc-x-map"></div>${legend(data)}</div>
    </div>`;

  // ---------------- states ----------------
  const loadingHTML = () => `<div class="tc tc-card tc-state"><div class="tc-spinner"></div><div><b>${t("state.loading")}</b></div></div>`;
  const errorHTML = () => `<div class="tc tc-card tc-state is-error" role="status"><span class="tc-badge tc-badge-md is-error">${svg("info")}</span>
      <div><b>${t("state.errorTitle")}</b><br><span class="tc-muted">${t("state.errorBody")}</span>
      <div><button type="button" class="tc-btn tc-btn-secondary tc-retry">${t("action.tryAgain")}</button></div></div></div>`;

  // Expanded view of card A (also rendered inline by the translation guide).
  const dialogHTML = (data, head, extraCls = "") => `<section class="tc tc-dialog ${extraCls}" role="dialog" aria-modal="true" aria-labelledby="tc-dialog-title">
      <header class="tc-dialog-head">
        <div class="tc-dialog-titles"><div class="tc-kicker">${t("kicker")}</div><h3 class="tc-title" id="tc-dialog-title">${head}</h3></div>
        <div class="tc-dialog-stats">${statStrip(data, "is-inline")}</div>
        <button type="button" class="tc-iconbtn tc-close" aria-label="Close">${svg("close")}</button>
      </header>
      ${explorerHTML(data)}
      <footer class="tc-dialog-foot">${disclaimer()}</footer>
    </section>`;

  // ======================================================================
  // A — Neighbourhood card: three variations of the same card, same texts,
  // same expanded view (map + full list). They differ in placement, visual
  // treatment and inner layout.
  //   A1  Sidebar card     – right column, below "Every time correct prices"
  //   A2  Page section     – main column, a section of the listing like "Features"
  //   A3  Highlight band   – main column, right under the price, before the reasons
  // ======================================================================
  // Expanded view (modal) shared by every A variation.
  function expander(data, head) {
    let modal = null;
    function open(stopId) {
      close();
      const opener = document.activeElement;
      const wrap = document.createElement("div");
      wrap.className = "tc-modal";
      wrap.innerHTML = `<div class="tc-modal-back"></div>${dialogHTML(data, head)}`;
      document.body.appendChild(wrap);
      document.body.classList.add("tc-noscroll");
      const ex = mountExplorer(wrap, data, stopId);
      ex.scrollToSelected();
      wrap.querySelector(".tc-close").addEventListener("click", close);
      wrap.querySelector(".tc-modal-back").addEventListener("click", close);
      const onKey = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", onKey);
      requestAnimationFrame(() => wrap.classList.add("is-open"));
      wrap.querySelector(".tc-close").focus({ preventScroll: true });
      modal = { wrap, ctl: ex.ctl, onKey, opener };
    }
    function close() {
      if (!modal) return;
      modal.ctl.destroy();
      document.removeEventListener("keydown", modal.onKey);
      modal.wrap.remove();
      document.body.classList.remove("tc-noscroll");
      if (modal.opener && modal.opener.focus) modal.opener.focus({ preventScroll: true });
      modal = null;
    }
    return { open, close };
  }
  // Clicks: a stop opens the expanded view on that stop; [data-open] elements open it on the nearest stop.
  function wireOpen(slot, data, ex) {
    const first = data.stops[0];
    slot.addEventListener("click", (e) => {
      if (e.target.closest(".leaflet-control-attribution a")) return;
      const row = e.target.closest("[data-stop]");
      if (row) return ex.open(row.dataset.stop);
      if (e.target.closest("[data-open]")) ex.open(first && first.id);
    });
    slot.querySelectorAll('[data-open][role="button"]').forEach((el) => el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ex.open(first && first.id); }
    }));
  }
  function previewMap(el, data, focus, preset) {
    const m = createMap(el, data, { interactive: false, scale: preset !== "thumb", emphasis: focus.map((s) => s.id), preset });
    const first = data.stops[0];
    m.frame(focus);
    if (first && !data.approximate) m.select(first.id, { pan: false });
    return m;
  }
  const focusOf = (data) => [nearestOf(data, "tram"), nearestOf(data, "bus")].filter(Boolean);
  const modeWord = (s) => t(s.mode === "tram" ? "mode.tram" : "mode.bus");

  // ---------- A1: sidebar card ----------
  function renderA(slot, data) {
    const head = headline(data);
    const focus = focusOf(data);
    slot.innerHTML = `<section class="tc tc-card tc-hood ${data.approximate ? "is-approx" : ""}" aria-label="${tp("kicker")}">
      <div class="tc-hood-preview" role="button" tabindex="0" data-open aria-label="Open the transport map">
        <div class="tc-map tc-hood-map"></div>
        <span class="tc-pill tc-hood-expand">${svg("expand")}${t("action.expandMap")}</span>
      </div>
      <div class="tc-hood-body">
        <div class="tc-kicker">${t("kicker")}</div>
        <h4 class="tc-title">${head}</h4>
        ${statStrip(data)}
        <div class="tc-label">${t(data.approximate ? "section.inArea" : "section.nearest")}</div>
        <ul class="tc-list tc-list-compact">${focus.map((s) => stopRow(s, data, null, { modePrefix: true, maxChips: 5, badge: "sm" })).join("")}</ul>
        <button type="button" class="tc-btn tc-btn-secondary tc-btn-block tc-hood-open" data-open>${svg("map")}${t("action.explore")}</button>
        ${disclaimer()}
      </div>
    </section>`;
    const preview = previewMap(slot.querySelector(".tc-hood-map"), data, focus, "preview");
    const ex = expander(data, head);
    wireOpen(slot, data, ex);
    return { destroy: () => { ex.close(); preview.destroy(); } };
  }

  // ---------- A2: page section (flat, site-style heading; map left, summary right) ----------
  function renderA2(slot, data) {
    const head = headline(data);
    const focus = focusOf(data);
    const st = keyStats(data);
    const km = data.config.radiusMeters / 1000;
    const scopeKey = data.approximate ? "scope.area" : "scope.radius";
    const stat = (kind, icon, n, key) => `<span class="tc-sec-stat">${tile(kind, icon)}<span class="tc-sec-stat-text"><b>${n}</b><span>${t(key)}</span></span></span>`;
    const stopCard = (s) => `<li class="tc-sec-stop is-${s.mode}" data-stop="${s.id}">
        <button type="button" class="tc-sec-stop-btn">
          ${badge(s.mode, "md")}
          <span class="tc-row-main">
            <span class="tc-row-mode">${modeWord(s)}</span>
            <span class="tc-row-name">${esc(nice(s.displayName))}</span>
            <span class="tc-row-lines">${chips(s, 6)}</span>
          </span>
          ${dist(s, data)}
        </button>
      </li>`;
    slot.innerHTML = `<section class="tc tc-sec ${data.approximate ? "is-approx" : ""}" aria-label="${tp("kicker")}">
      <div class="top-title"><span>${t("kicker")}</span></div>
      <div class="tc-sec-grid">
        <div class="tc-sec-mapbox" role="button" tabindex="0" data-open aria-label="Open the transport map">
          <div class="tc-map tc-sec-map"></div>
          <span class="tc-pill tc-sec-expand">${svg("expand")}${t("action.expandMap")}</span>
        </div>
        <div class="tc-sec-side">
          <h3 class="tc-title">${head}</h3>
          <div class="tc-sec-scope">${t(scopeKey, { km })}</div>
          <div class="tc-sec-stats" aria-label="${tp(scopeKey, { km })}">
            ${stat("tram", "tram", st.tram, "stat.tram")}${stat("bus", "bus", st.bus, "stat.bus")}${stat("line", "route", st.lines, "stat.lines")}
          </div>
          <div class="tc-label">${t(data.approximate ? "section.inArea" : "section.nearest")}</div>
          <ul class="tc-sec-stops">${focus.map(stopCard).join("")}</ul>
          <button type="button" class="tc-btn tc-btn-block tc-sec-btn" data-open>${svg("map")}${t("action.explore")}</button>
        </div>
      </div>
      ${disclaimer()}
    </section>`;
    const preview = previewMap(slot.querySelector(".tc-sec-map"), data, focus, "section");
    const ex = expander(data, head);
    wireOpen(slot, data, ex);
    return { destroy: () => { ex.close(); preview.destroy(); } };
  }

  // ---------- A3: highlight band (navy, compact, on the first screen) ----------
  function renderA3(slot, data) {
    const head = headline(data);
    const focus = focusOf(data);
    const st = keyStats(data);
    const km = data.config.radiusMeters / 1000;
    const scopeKey = data.approximate ? "scope.area" : "scope.radius";
    const ticket = (s) => `<li class="tc-band-ticket" data-stop="${s.id}">
        <button type="button" class="tc-band-ticket-btn">
          ${badge(s.mode, "sm")}
          <span class="tc-row-main">
            <span class="tc-row-mode">${modeWord(s)}</span>
            <span class="tc-row-name">${esc(nice(s.displayName))}</span>
            <span class="tc-row-lines">${chips(s, 4)}</span>
          </span>
          ${dist(s, data)}
        </button>
      </li>`;
    const num = (n, key) => `<span class="tc-band-num"><b>${n}</b><span>${t(key)}</span></span>`;
    slot.innerHTML = `<section class="tc tc-band ${data.approximate ? "is-approx" : ""}" aria-label="${tp("kicker")}">
      <div class="tc-band-thumb" role="button" tabindex="0" data-open aria-label="Open the transport map">
        <div class="tc-map tc-band-map"></div>
        <span class="tc-pill tc-band-expand">${svg("expand")}${t("action.expandMap")}</span>
      </div>
      <div class="tc-band-body">
        <div class="tc-band-top">
          <div class="tc-band-titles"><div class="tc-kicker">${t("kicker")}</div><h3 class="tc-title">${head}</h3></div>
          <div class="tc-band-nums" aria-label="${tp(scopeKey, { km })}">
            <span class="tc-band-scope">${t(scopeKey, { km })}</span>
            <span class="tc-band-numrow">${num(st.tram, "stat.tram")}${num(st.bus, "stat.bus")}${num(st.lines, "stat.lines")}</span>
          </div>
        </div>
        <ul class="tc-band-tickets">${focus.map(ticket).join("")}</ul>
        <div class="tc-band-foot">
          ${disclaimer()}
          <button type="button" class="tc-btn tc-band-btn" data-open>${svg("map")}${t("action.explore")}</button>
        </div>
      </div>
    </section>`;
    const preview = previewMap(slot.querySelector(".tc-band-map"), data, focus, "thumb");
    const ex = expander(data, head);
    wireOpen(slot, data, ex);
    return { destroy: () => { ex.close(); preview.destroy(); } };
  }

  // ======================================================================
  // B — Compact horizontal card, nearest stop first
  // ======================================================================
  function renderB(slot, data) {
    let selected = data.stops[0] && data.stops[0].id;
    let expanded = false;
    slot.innerHTML = `<section class="tc tc-card tc-compact" aria-label="Public transport nearby">
      <div class="tc-compact-main">
        <div class="tc-map tc-compact-map"></div>
        <div class="tc-compact-info">
          <div class="tc-kicker">Public transport nearby</div>
          <div class="tc-compact-hero"></div>
          <div class="tc-compact-next"></div>
        </div>
      </div>
      <div class="tc-compact-all" hidden></div>
      <footer class="tc-compact-foot">
        <button type="button" class="tc-link tc-compact-toggle" aria-expanded="false"><span>Show all ${data.stops.length} stops</span>${svg("chevron")}</button>
        ${disclaimer()}
      </footer>
    </section>`;
    const hero = slot.querySelector(".tc-compact-hero"), next = slot.querySelector(".tc-compact-next"), all = slot.querySelector(".tc-compact-all"), tgl = slot.querySelector(".tc-compact-toggle");
    const ctl = createMap(slot.querySelector(".tc-compact-map"), data, {
      onSelect: (id) => setSel(id), preset: "preview", labels: true, compactControls: true, scale: true,
      emphasis: data.stops.slice(0, 4).map((s) => s.id), // small map: 4 nearest as full markers, the rest as dots
    });
    ctl.frame(data.stops.slice(0, 3));
    let detailOpen = false;
    function draw() {
      const s = data.stops.find((x) => x.id === selected);
      // Hero: the selected (by default the nearest) stop in a mode-tinted panel.
      hero.innerHTML = `<div class="tc-hero is-${s.mode}">
          <div class="tc-hero-top">${badge(s.mode, "lg")}
            <div class="tc-hero-text"><span class="tc-row-mode">${s.rank === 1 && !data.approximate ? `Nearest · ${modeLabel(s.mode)}` : modeLabel(s.mode)}</span>
            <h4 class="tc-hero-name">${esc(nice(s.displayName))}</h4></div>
            ${dist(s, data, "is-lg")}
          </div>
          <details class="tc-more" ${detailOpen ? "open" : ""}>
            <summary><span class="tc-row-lines">${chips(s, 7)}</span><span class="tc-link">Directions${svg("chevron")}</span></summary>
            ${stopDetail(s, data)}
          </details>
        </div>`;
      hero.querySelector("details").addEventListener("toggle", (e) => { detailOpen = e.target.open; });
      const others = data.stops.filter((x) => x.id !== selected).slice(0, 3);
      next.innerHTML = `<div class="tc-label">Also nearby</div><ul class="tc-list tc-list-compact">${others.map((o) => stopRow(o, data, null, { maxChips: 4, badge: "sm" })).join("")}</ul>`;
      if (expanded) all.innerHTML = groupedList(data, selected);
    }
    function setSel(id) { selected = id; draw(); ctl.select(id); }
    slot.addEventListener("click", (e) => {
      const b = e.target.closest(".tc-row-btn");
      if (b) { setSel(b.parentElement.dataset.stop); return; }
      if (e.target.closest(".tc-compact-toggle")) {
        expanded = !expanded; all.hidden = !expanded;
        tgl.setAttribute("aria-expanded", expanded);
        tgl.querySelector("span").textContent = expanded ? "Hide stops" : `Show all ${data.stops.length} stops`;
        draw();
      }
    });
    draw(); ctl.select(selected, { pan: false });
    // The map stretches to the info column's height; re-centre once layout has settled.
    const reframe = () => { ctl.invalidate(); ctl.frame(data.stops.slice(0, 3)); };
    requestAnimationFrame(reframe);
    return ctl;
  }

  // ======================================================================
  // C — Full-width card: list on one side, map on the other
  // ======================================================================
  function renderC(slot, data) {
    // Header: title + the nearest stop of each mode at a glance, counts on the right.
    const near = [nearestOf(data, "tram"), nearestOf(data, "bus")].filter(Boolean).map((s) => `
      <button type="button" class="tc-near" data-stop="${s.id}">
        ${badge(s.mode, "xs")}
        <span class="tc-near-mode">${data.approximate ? (s.mode === "tram" ? "Tram" : "Bus") : `Nearest ${s.mode === "tram" ? "tram" : "bus"}`}</span>
        <b>${esc(nice(s.displayName))}</b>
        <span class="tc-near-dist">${data.approximate ? (s.inArea ? "in area" : `~${fmtDist(round50(s.areaDist))} from area`) : s.walk ? `${mins(s.walk.duration)} min walk` : fmtDist(s.straight)}</span>
      </button>`).join("");
    slot.innerHTML = `<section class="tc tc-card tc-full" aria-label="Public transportation">
      <header class="tc-full-head">
        <div class="tc-full-titles"><div class="tc-kicker">Public transportation</div><h3 class="tc-title">${headline(data)}</h3>
          <div class="tc-nears">${near}</div></div>
        <div class="tc-full-stats">${statStrip(data, "is-inline")}</div>
      </header>
      ${explorerHTML(data)}
      <footer class="tc-full-foot">${disclaimer()}</footer>
    </section>`;
    const ex = mountExplorer(slot, data, data.stops[0] && data.stops[0].id);
    slot.querySelectorAll(".tc-near").forEach((b) => b.addEventListener("click", () => ex.select(b.dataset.stop)));
    return ex.ctl;
  }

  // ======================================================================
  // Prototype controller: switchers, data badge, review notes
  // ======================================================================
  const RENDER = { A1: renderA, A2: renderA2, A3: renderA3, B: renderB, C: renderC };
  let current = "A1", locationMode = "exact", controller = null, DATA = null, ERROR = null;

  // The full-width card (C) needs a break between the two-column rows. For the
  // other variations the columns flow continuously, like on the live site.
  function arrangeColumns(fullWidth) {
    const pairs = [["col-l2", "col-l3"], ["col-r2", "col-r3"]].map(([a, b]) => [document.getElementById(a), document.getElementById(b)]);
    for (const [top, bottom] of pairs) {
      if (!top || !bottom) continue;
      if (!bottom.dataset.marked) { [...bottom.children].forEach((c) => (c.dataset.row3 = "1")); bottom.dataset.marked = "1"; }
      if (fullWidth) [...top.children].filter((c) => c.dataset.row3).forEach((c) => bottom.appendChild(c));
      else [...bottom.children].forEach((c) => top.appendChild(c));
      bottom.parentElement.hidden = !fullWidth;
    }
  }

  function setVariant(v, { scroll = true } = {}) {
    if (!RENDER[v]) v = "A1";
    current = v;
    arrangeColumns(v === "C");
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
    const m = h.match(/^(A[123]|B|C|A)/i);
    const v = m ? m[1].toUpperCase() : "A1";
    return { v: v === "A" ? "A1" : v, approx: /approx/i.test(h) };
  }

  function dataBadge() {
    const el = document.getElementById("proto-data");
    if (ERROR) { el.className = "proto-data is-err"; el.textContent = "● Data unavailable"; return; }
    if (!DATA) { el.className = "proto-data"; el.textContent = "● Loading…"; return; }
    const s = DATA.status;
    el.className = `proto-data ${s.source === "live" ? "is-live" : "is-cache"}`;
    el.textContent = s.source === "live" ? `● Live OSM data · ${fmtTime(s.retrievedAt)}` : `● Cached data · ${fmtTime(s.retrievedAt, false)}`;
  }

  function reviewNotes() {
    const box = document.getElementById("proto-notes");
    if (ERROR) { box.innerHTML = `<div class="pn-grid"><section><h5>Data</h5><p>${esc(ERROR.message)}</p></section></div>`; return; }
    if (!DATA) { box.innerHTML = ""; return; }
    const d = DATA, s = d.status;
    const withLines = d.stops.filter((x) => x.lines.length);
    const allLines = [...new Map(d.stops.flatMap((x) => x.lines).map((l) => [l.ref, l])).values()];
    const v = d.validation;
    const claim = d.approximate
      ? `<section><h5>Approximate-location mode</h5>
          <p>The listing exposes only an area (${d.origin.areaRadius} m circle, same as the live site; centre offset from the real point). Distances are measured from the area, walking times are hidden, and the real coordinates are never used in the browser.</p></section>`
      : `<section><h5>Listing claim check</h5>
          <p>Description: <q>${esc(v.claim.text)}</q></p>
          ${v.stop ? `<p>Nearest tram stop: <b>${esc(nice(v.stop.displayName))}</b>, ${fmtDist(v.straight)} straight-line${v.walk != null ? `, ${fmtDist(v.walk)} walking` : ""}.</p>` : ""}
          <p class="pn-verdict pn-${v.verdict === "consistent" ? "ok" : "warn"}">${v.verdict === "consistent" ? "Consistent" : v.verdict === "discrepancy" ? "Discrepancy" : "No tram stop found"}</p></section>`;
    box.innerHTML = `<div class="pn-grid">
      ${claim}
      <section><h5>Data</h5><ul>
        <li>OSM stops via Overpass (${esc(new URL(s.endpoint).host)}), ${s.source === "live" ? "live" : "cached"} ${fmtTime(s.retrievedAt)}${s.liveError ? `<br><span class="pn-muted">Live failed: ${esc(s.liveError)}</span>` : ""}</li>
        ${d.approximate ? "" : `<li>Walking routes: OSRM foot profile (FOSSGIS), ${s.walking === "live" ? "live" : `cached ${fmtTime(s.walkingRetrievedAt)}`}</li>`}
        <li>Base map: OpenStreetMap data, HOT tile style from OSM France (desaturated in CSS); also loads when the page is opened from disk.</li>
      </ul></section>
      <section><h5>Source merge (KentKart first, OSM fallback)</h5>
        ${d.harmonization ? `<ul>
          <li>${d.harmonization.matched} stops in both, ${d.harmonization.kentkartOnly} only in KentKart, ${d.harmonization.osmOnly} only in OSM.</li>
          <li>Lines from KentKart at ${d.harmonization.linesKentkart} stops, from OSM at ${d.harmonization.linesOsm}, none at ${d.harmonization.stopsNoLines}.</li>
          <li>${allLines.length} lines: ${allLines.map(chip).join(" ")}</li>
        </ul>
        <p class="pn-muted">KentKart = third-party GTFS generated from KentKart (Mobility Database mdb-3406), service ${esc(d.gtfsSource.validFrom)}–${esc(d.gtfsSource.validTo)}. Not official; licence to be confirmed. “TEST” agency lines left out: ${esc(d.gtfsSource.excludedRoutes.join(", "))}.</p>`
        : `<p>${withLines.length} of ${d.stops.length} stops have lines in OSM.</p>`}</section>
      <section><h5>Method</h5><ul class="pn-muted">
        <li>${d.approximate ? "Distance from area = distance to the circle edge, rounded to 50 m." : "Walk = OSRM route incl. access to the path network; straight-line = haversine."}</li>
        <li>Maps keep the property / area centred; zoom chosen per purpose.</li></ul>
        <p class="pn-muted">Test: <a href="?data=live${location.hash}">live data</a> · <a href="?data=fail${location.hash}">failure state</a> · <a href="./${location.hash}">cached (default)</a></p>
      </section>
    </div>`;
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
    dataBadge(); reviewNotes();
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
    const nb = document.getElementById("proto-notes-btn"), notes = document.getElementById("proto-notes");
    nb.addEventListener("click", () => { notes.hidden = !notes.hidden; nb.setAttribute("aria-expanded", String(!notes.hidden)); });
    document.addEventListener("click", (e) => { if (e.target.closest(".tc-retry")) load(); });
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector(".tc-modal")) return;
      const v = { "1": "A1", "2": "A2", "3": "A3", "4": "B", "5": "C" }[e.key];
      if (v) setVariant(v);
    });
    const h = readHash();
    current = RENDER[h.v] ? h.v : "A1";
    if (h.approx) {
      locationMode = "approximate";
      document.querySelectorAll(".proto-switch [data-loc]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.loc === "approximate")));
    }
    load().then(() => { if (location.hash) document.getElementById(`slot-${current}`).scrollIntoView({ block: "start" }); });
  }

  // Card A building blocks for the translation guide (docs/transit-card-a-translation-guide.html).
  window.TransitUI = { renderA, dialogHTML, mountExplorer, headline, loadingHTML, errorHTML, load: (opts) => TD.load(opts) };
  if (!document.getElementById("proto-data")) return; // loaded as a library, not the prototype page

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
