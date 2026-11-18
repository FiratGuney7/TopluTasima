/*
 * Transit data layer for the prototype.
 *
 * Default (presentation) mode: CACHED. Reads real, unmodified responses that
 * scripts/fetch_snapshot.py saved into data/snapshot.js, so the page renders
 * instantly and never depends on slow public APIs during a demo.
 *
 *   ?data=live   query Overpass / OSRM live instead (falls back to the cache)
 *   ?data=fail   simulate the "data unavailable" state
 *
 * Location modes
 *   exact        listing shows its real coordinates (e.g. exclusive projects):
 *                distances from the point, walking routes.
 *   approximate  listing shows only an area: distances are measured from the
 *                area (circle), never from a hidden real point; no walking times.
 *
 * Sources: OpenStreetMap via Overpass API; walking routes via OSRM foot profile
 * (FOSSGIS, routing.openstreetmap.de). Nothing is invented: a stop without an
 * OSM route relation gets no line numbers.
 */
(function () {
  "use strict";

  const SNAP = window.TRANSIT_SNAPSHOT || null;

  // ---------- geometry ----------
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371008.8;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // ---------- fetch helpers (live mode only) ----------
  async function fetchJSON(url, opts = {}, timeoutMs = 45000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url, location.href).host}`);
      return await res.json();
    } catch (e) {
      if (e.name === "AbortError") throw new Error(`${new URL(url, location.href).host} did not respond within ${timeoutMs / 1000} s`);
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  function buildQuery(template, cfg, origin, radius) {
    return template
      .replaceAll("{{LAT}}", String(origin.lat))
      .replaceAll("{{LON}}", String(origin.lon))
      .replaceAll("{{R}}", String(radius))
      .replaceAll("{{BBOX}}", cfg.routeClipBBox.join(","));
  }

  // All configured Overpass instances in parallel; first valid answer wins.
  async function overpassLive(cfg, query) {
    const attempts = cfg.overpassEndpoints.map(async (ep) => {
      const json = await fetchJSON(ep, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
      }, 25000);
      if (!Array.isArray(json.elements)) throw new Error(`Unexpected response from ${new URL(ep).host}`);
      if (json.remark && /error|timed out/i.test(json.remark)) throw new Error(`${new URL(ep).host}: ${json.remark}`);
      return { json, endpoint: ep };
    });
    try {
      return await Promise.any(attempts);
    } catch (agg) {
      throw new Error((agg.errors || [agg]).map((e) => String(e.message || e)).join("; "));
    }
  }

  // ---------- processing (identical for live and cached data) ----------
  function classifyMode(tags, routeModes) {
    if (routeModes.has("tram") || tags.railway === "tram_stop" || tags.tram === "yes") return "tram";
    if (routeModes.has("bus") || tags.highway === "bus_stop" || tags.bus === "yes") return "bus";
    return "other";
  }

  function process(overpassJson, origin) {
    const els = overpassJson.elements || [];
    const routes = els.filter((e) => e.type === "relation" && e.tags && e.tags.type === "route");
    const masters = els.filter((e) => e.type === "relation" && e.tags && e.tags.type === "route_master");

    const memberOf = new Map();
    for (const r of routes) {
      for (const m of r.members || []) {
        if (m.type === "relation") continue;
        const k = `${m.type}/${m.ref}`;
        if (!memberOf.has(k)) memberOf.set(k, []);
        memberOf.get(k).push(r);
      }
    }

    const points = [];
    for (const e of els) {
      if (e.type === "relation" || !e.tags) continue;
      const lat = e.type === "node" ? e.lat : e.center && e.center.lat;
      const lon = e.type === "node" ? e.lon : e.center && e.center.lon;
      if (lat == null || lon == null) continue;
      const key = `${e.type}/${e.id}`;
      const rels = memberOf.get(key) || [];
      points.push({
        key, osmType: e.type, id: e.id, lat, lon, tags: e.tags,
        mode: classifyMode(e.tags, new Set(rels.map((r) => r.tags.route))),
        role: e.tags.public_transport || (e.tags.highway === "bus_stop" ? "platform" : e.tags.railway || "stop"),
        name: (e.tags.name || "").trim(),
        straight: haversine(origin.lat, origin.lon, lat, lon),
        rels,
      });
    }

    // Group into stops: same mode + name within 150 m; unnamed points join the
    // nearest named stop of the same mode within 50 m.
    const groups = [];
    const named = points.filter((p) => p.name).sort((a, b) => a.straight - b.straight);
    for (const p of named) {
      const g = groups.find((g) => g.mode === p.mode && g.name === p.name && haversine(g.anchor.lat, g.anchor.lon, p.lat, p.lon) <= 150);
      if (g) g.members.push(p);
      else groups.push({ mode: p.mode, name: p.name, anchor: p, members: [p], inferredMembers: [] });
    }
    for (const p of points.filter((p) => !p.name)) {
      let best = null, bestD = Infinity;
      for (const g of groups) {
        if (g.mode !== p.mode || !g.name) continue;
        for (const m of g.members) {
          const d = haversine(m.lat, m.lon, p.lat, p.lon);
          if (d < bestD) { bestD = d; best = g; }
        }
      }
      if (best && bestD <= 50) { best.members.push(p); best.inferredMembers.push(p.key); }
      else groups.push({ mode: p.mode, name: "", anchor: p, members: [p], inferredMembers: [] });
    }

    const stops = groups.map((g, i) => {
      const nearest = g.members.reduce((a, b) => (b.straight < a.straight ? b : a));
      const relMap = new Map();
      for (const m of g.members) for (const r of m.rels) relMap.set(r.id, r);
      const lines = new Map();
      for (const r of relMap.values()) {
        const ref = r.tags.ref || r.tags.name || `relation ${r.id}`;
        const master = masters.find((ms) => (ms.members || []).some((mm) => mm.type === "relation" && mm.ref === r.id));
        if (!lines.has(ref)) {
          lines.set(ref, {
            ref, mode: r.tags.route === "tram" ? "tram" : "bus", source: "osm",
            colour: r.tags.colour || (master && master.tags.colour) || null,
            operator: r.tags.operator || (master && master.tags.operator) || null,
            directions: [], geomKeys: [],
          });
        }
        lines.get(ref).directions.push({ relId: r.id, from: r.tags.from || null, to: r.tags.to || null, name: r.tags.name, hours: r.tags.opening_hours || null });
        lines.get(ref).geomKeys.push(`o:${r.id}`);
      }
      const refs = g.members.map((m) => m.tags.ref).filter(Boolean);
      const s = {
        id: `s${i}`,
        mode: g.mode,
        name: g.name,
        displayName: g.name || (g.mode === "bus" ? "Bus stop" : g.mode === "tram" ? "Tram stop" : "Stop"),
        stopCode: refs.length ? [...new Set(refs)].join(", ") : null,
        lat: nearest.lat, lon: nearest.lon,
        straight: nearest.straight,
        nearestMemberKey: nearest.key,
        members: g.members.map((m) => ({ key: m.key, osmType: m.osmType, id: m.id, lat: m.lat, lon: m.lon, role: m.role, straight: m.straight })),
        inferredMembers: g.inferredMembers,
        lines: [...lines.values()].sort((a, b) => a.ref.localeCompare(b.ref, "en", { numeric: true })),
        sources: ["osm"],
        walk: null,
      };
      return s;
    });

    const routeGeometry = {};
    for (const r of routes) {
      const segs = [];
      for (const m of r.members || []) {
        if (m.type === "way" && Array.isArray(m.geometry)) {
          const seg = m.geometry.filter(Boolean).map((p) => [p.lat, p.lon]);
          if (seg.length > 1) segs.push(seg);
        }
      }
      routeGeometry[`o:${r.id}`] = { ref: r.tags.ref, mode: r.tags.route, segments: segs };
    }

    return {
      stops, routeGeometry,
      counts: { rawPoints: points.length, routeRelations: routes.length },
      osmBaseTimestamp: overpassJson.osm3s && overpassJson.osm3s.timestamp_osm_base,
    };
  }

  // ---------- harmonisation: KentKart (GTFS) first, OpenStreetMap as fallback ----------
  const normName = (n) => String(n || "").toLocaleUpperCase("tr").replace(/[^A-ZÇĞİÖŞÜ0-9]/g, "");
  const baseName = (n) => normName(n).replace(/\d+$/, "");
  const isRailType = (t) => t === 0 || t === 1 || t === 2 || t === 5 || t === 12;

  function harmonize(osm, gtfs, origin, searchRadius) {
    const stats = { matched: 0, kentkartOnly: 0, osmOnly: 0, linesKentkart: 0, linesOsm: 0, stopsNoLines: 0 };
    const routeGeometry = { ...osm.routeGeometry };

    // 1. GTFS stops in range, grouped like the OSM ones (tram platforms "TOPÇULAR1/2" -> one stop)
    const gStops = gtfs.stops.map((s) => {
      const types = s.serves.map(([rid]) => gtfs.routes[rid] && gtfs.routes[rid].type);
      return { ...s, mode: types.some(isRailType) ? "tram" : "bus", straight: haversine(origin.lat, origin.lon, s.lat, s.lon) };
    }).filter((s) => s.straight <= searchRadius).sort((a, b) => a.straight - b.straight);
    const gGroups = [];
    for (const s of gStops) {
      const key = s.mode === "tram" ? baseName(s.name) : normName(s.name);
      const g = gGroups.find((g) => g.mode === s.mode && g.key === key && haversine(g.members[0].lat, g.members[0].lon, s.lat, s.lon) <= 150);
      if (g) g.members.push(s); else gGroups.push({ mode: s.mode, key, name: s.mode === "tram" ? s.name.replace(/\d+$/, "").trim() : s.name, members: [s] });
    }

    // 2. Match each GTFS stop group to an OSM stop: same stop code, or same name nearby, or same mode within 25 m
    const used = new Set();
    function matchOsm(g) {
      const ids = new Set(g.members.map((m) => m.id));
      let best = null, bestScore = Infinity;
      for (const o of osm.stops) {
        if (used.has(o.id) || o.mode !== g.mode) continue;
        const d = Math.min(...g.members.flatMap((m) => o.members.map((om) => haversine(m.lat, m.lon, om.lat, om.lon))));
        const codeHit = o.stopCode && o.stopCode.split(/,\s*/).some((c) => ids.has(c));
        const nameHit = o.name && baseName(o.name) === baseName(g.name);
        const score = codeHit && d <= 150 ? d - 1000 : nameHit && d <= 120 ? d : d <= 25 ? d + 100 : Infinity;
        if (score < bestScore) { bestScore = score; best = o; }
      }
      if (best) used.add(best.id);
      return best;
    }

    const merged = [];
    for (const g of gGroups) {
      const o = matchOsm(g);
      // Lines from KentKart: one entry per route, with the directions that serve THIS stop
      const lineMap = new Map();
      for (const m of g.members) {
        for (const [rid, dir] of m.serves) {
          const r = gtfs.routes[rid];
          if (!r) continue;
          if (!lineMap.has(r.ref)) lineMap.set(r.ref, { ref: r.ref, mode: isRailType(r.type) ? "tram" : "bus", source: "kentkart", colour: null, operator: null, routeName: r.name, directions: [], geomKeys: [], _seen: new Set() });
          const L = lineMap.get(r.ref), k = `${rid}|${dir}`;
          if (L._seen.has(k)) continue;
          L._seen.add(k);
          L.directions.push({ name: r.dirs[dir] || r.name, from: null, to: null, hours: null });
          const gk = `g:${rid}:${dir}`;
          if (!routeGeometry[gk] && gtfs.shapes[rid] && gtfs.shapes[rid][dir]) routeGeometry[gk] = { ref: r.ref, mode: L.mode, segments: gtfs.shapes[rid][dir] };
          if (routeGeometry[gk]) L.geomKeys.push(gk);
        }
      }
      let lines = [...lineMap.values()].map(({ _seen, ...l }) => l).sort((a, b) => a.ref.localeCompare(b.ref, "en", { numeric: true }));
      if (!lines.length && o) lines = o.lines; // fallback: OSM route relations
      const gMembers = g.members.map((m) => ({ key: `gtfs/${m.id}`, source: "kentkart", lat: m.lat, lon: m.lon, role: "stop", straight: m.straight }));
      const members = gMembers.concat(o ? o.members.map((m) => ({ ...m, source: "osm" })) : []);
      const nearest = members.reduce((a, b) => (b.straight < a.straight ? b : a));
      merged.push({
        mode: g.mode,
        name: (o && o.name) || g.name,
        displayName: (o && o.name) || g.name,
        stopCode: g.mode === "bus" ? g.members.map((m) => m.id).join(", ") : null,
        lat: nearest.lat, lon: nearest.lon, straight: nearest.straight, nearestMemberKey: nearest.key,
        members, inferredMembers: o ? o.inferredMembers : [],
        lines,
        sources: o ? ["kentkart", "osm"] : ["kentkart"],
        lineSource: lines.length ? lines[0].source : null,
        walk: null,
      });
      stats[o ? "matched" : "kentkartOnly"]++;
    }
    // 3. OSM stops KentKart doesn't know (kept, with their OSM lines)
    for (const o of osm.stops) {
      if (used.has(o.id) || o.straight > searchRadius) continue;
      merged.push({ ...o, members: o.members.map((m) => ({ ...m, source: "osm" })), sources: ["osm"], lineSource: o.lines.length ? "osm" : null });
      stats.osmOnly++;
    }
    merged.forEach((s, i) => {
      s.id = `s${i}`;
      if (s.lineSource === "kentkart") stats.linesKentkart++; else if (s.lineSource === "osm") stats.linesOsm++; else stats.stopsNoLines++;
    });
    return { stops: merged, routeGeometry, stats };
  }

  // ---------- walking (exact listings only) ----------
  function parseOsrmRoute(json) {
    if (!json || json.code !== "Ok" || !json.routes || !json.routes[0]) return null;
    const r = json.routes[0];
    // OSRM measures only between the points snapped onto the path network; add the
    // walk from the property / stop to those snapped points so short trips aren't understated.
    const snap = (json.waypoints || []).reduce((t, w) => t + (w.distance || 0), 0);
    return {
      distance: r.distance + snap,
      duration: r.duration + snap / 1.4,
      geometry: r.geometry && r.geometry.coordinates ? r.geometry.coordinates.map(([lon, lat]) => [lat, lon]) : null,
    };
  }
  const nearestMember = (s) => s.members.find((x) => x.key === s.nearestMemberKey);

  async function walkingLive(cfg, origin, stops) {
    const coords = [[origin.lon, origin.lat], ...stops.map((s) => { const m = nearestMember(s); return [m.lon, m.lat]; })];
    const url = cfg.osrmFoot.replace("/route/", "/table/") + "/" + coords.map((c) => c.join(",")).join(";") + "?sources=0&annotations=distance,duration";
    const json = await fetchJSON(url, {}, 8000);
    if (json.code !== "Ok" || !json.distances) throw new Error("Walking router returned " + json.code);
    stops.forEach((s, i) => {
      const d = json.distances[0][i + 1], t = json.durations && json.durations[0][i + 1];
      if (d != null) s.walk = { distance: d, duration: t, geometry: null, source: "live" };
    });
  }
  function walkingFromSnapshot(snapWalking, stops) {
    for (const s of stops) {
      if (s.walk) continue;
      // Route to the nearest stop element; if that one has no cached route, the next nearest.
      const keys = [s.nearestMemberKey, ...[...s.members].sort((a, b) => a.straight - b.straight).map((m) => m.key)];
      for (const k of keys) {
        const w = parseOsrmRoute(snapWalking[k]);
        if (w) { w.source = "cache"; s.walk = w; break; }
      }
    }
  }
  const pathCache = new Map();
  function walkingPath(cfg, origin, stop) {
    if (!stop.walk) return null;
    if (stop.walk.geometry) return stop.walk.geometry;
    if (stop.walk.source !== "live") return null;
    if (!pathCache.has(stop.id)) {
      const m = nearestMember(stop);
      pathCache.set(stop.id, fetchJSON(`${cfg.osrmFoot}/${origin.lon},${origin.lat};${m.lon},${m.lat}?overview=full&geometries=geojson`, {}, 8000)
        .then((j) => { const r = parseOsrmRoute(j); if (r && r.geometry) stop.walk.geometry = r.geometry; return stop.walk.geometry; })
        .catch(() => { pathCache.delete(stop.id); return null; }));
    }
    return pathCache.get(stop.id);
  }

  // ---------- public API ----------
  async function load({ locationMode = "exact" } = {}) {
    const pref = new URLSearchParams(location.search).get("data") || "cache";
    if (pref === "fail") throw new Error("Simulated failure (?data=fail)");
    if (!SNAP && pref !== "live") throw new Error("Cached transport data (data/snapshot.js) is missing.");

    const cfg = SNAP ? SNAP.config : await fetchJSON("data/config.json");
    const approx = locationMode === "approximate";
    const origin = approx
      ? { lat: cfg.approximate.lat, lon: cfg.approximate.lon, areaRadius: cfg.approximate.areaRadiusMeters }
      : { lat: cfg.property.lat, lon: cfg.property.lon };
    const template = SNAP ? SNAP.queryTemplate : await (await fetch("data/overpass_query.overpassql")).text();
    const query = buildQuery(template, cfg, origin, approx ? cfg.approximate.searchRadiusMeters : cfg.radiusMeters);
    const status = { source: "cache", retrievedAt: null, endpoint: null, liveError: null, walking: null };

    let overpassJson = null;
    if (pref === "live") {
      try {
        const live = await overpassLive(cfg, query);
        overpassJson = live.json;
        Object.assign(status, { source: "live", endpoint: live.endpoint, retrievedAt: new Date().toISOString() });
      } catch (e) {
        status.liveError = String(e.message || e);
      }
    }
    if (!overpassJson) {
      if (!SNAP) throw new Error("Live request failed and no cached data is available: " + status.liveError);
      overpassJson = (approx ? SNAP.approximate : SNAP.exact).overpass;
      Object.assign(status, {
        source: "cache",
        retrievedAt: approx ? SNAP.meta.approxRetrievedAt : SNAP.meta.retrievedAt,
        endpoint: approx ? SNAP.meta.approxOverpassEndpoint : SNAP.meta.overpassEndpoint,
      });
    }

    const result = process(overpassJson, origin);
    const searchRadius = approx ? cfg.approximate.searchRadiusMeters : cfg.radiusMeters;
    if (SNAP && SNAP.gtfs) {
      const h = harmonize(result, SNAP.gtfs, origin, searchRadius);
      Object.assign(result, { stops: h.stops, routeGeometry: h.routeGeometry, harmonization: h.stats, gtfsSource: SNAP.gtfs.source });
    }
    if (approx) {
      // Approximate listing: distance from the AREA, i.e. to the circle edge.
      for (const s of result.stops) { s.areaDist = Math.max(0, s.straight - origin.areaRadius); s.inArea = s.straight <= origin.areaRadius; }
    }

    if (!approx) {
      if (pref === "live" && status.source === "live") {
        try { await walkingLive(cfg, origin, result.stops); status.walking = "live"; } catch (e) { /* use cache */ }
      }
      if (SNAP && result.stops.some((s) => !s.walk)) {
        walkingFromSnapshot(SNAP.exact.walking, result.stops);
        status.walking = status.walking || "cache";
        status.walkingRetrievedAt = SNAP.meta.walkingRetrievedAt;
      }
    }

    // Sort: exact → walking distance when every stop has one, else straight-line.
    // Approximate → distance from the area.
    const allWalk = !approx && result.stops.every((s) => s.walk);
    const key = approx ? (s) => s.areaDist * 1e4 + s.straight : allWalk ? (s) => s.walk.distance : (s) => s.straight;
    result.stops.sort((a, b) => key(a) - key(b));
    result.stops.forEach((s, i) => (s.rank = i + 1));

    if (!approx) {
      const tram = result.stops.filter((s) => s.mode === "tram").sort((a, b) => a.straight - b.straight)[0];
      const claim = { text: "50 m to Tram stop", metres: 50 };
      result.validation = {
        claim, stop: tram || null, straight: tram ? tram.straight : null, walk: tram && tram.walk ? tram.walk.distance : null,
        verdict: !tram ? "not-found" : Math.abs(tram.straight - claim.metres) <= 30 ? "consistent" : "discrepancy",
      };
    }

    Object.assign(result, {
      config: cfg, origin, approximate: approx, status, query,
      meta: SNAP ? SNAP.meta : null,
      walkingPath: (stop) => walkingPath(cfg, origin, stop),
    });
    return result;
  }

  window.TransitData = { load, haversine };
})();
