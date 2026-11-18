"""
Fetch and cache the REAL transport data the prototype shows.

The presentation build never waits for public APIs: the page reads the cached
data from data/snapshot.js (generated here), which also works when index.html
is opened straight from disk. Nothing is edited: the bundle contains the raw
JSON bodies returned by the services plus their retrieval time.

Sources
  - OpenStreetMap via Overpass API (overpass-api.de, fallback: VK Maps mirror)
  - Walking routes: OSRM "foot" profile hosted by FOSSGIS (routing.openstreetmap.de)

Usage
  python scripts/fetch_snapshot.py             # refresh stops/lines, keep cached walking routes
  python scripts/fetch_snapshot.py --walking   # also refresh walking routes (30 requests, slow)
  python scripts/fetch_snapshot.py --bundle    # only rebuild data/snapshot.js from saved files
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(DATA, "snapshot")
UA = {"User-Agent": "TransitPrototype/0.1 (internal design prototype)"}


def load(name):
    return json.load(open(os.path.join(OUT, name), encoding="utf-8"))


def save(name, obj):
    json.dump(obj, open(os.path.join(OUT, name), "w", encoding="utf-8"), ensure_ascii=False)


def get(url, data=None, timeout=120):
    req = urllib.request.Request(url, data=data, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def query_for(template, cfg, lat, lon, radius):
    return (template.replace("{{LAT}}", str(lat)).replace("{{LON}}", str(lon))
            .replace("{{R}}", str(radius))
            .replace("{{BBOX}}", ",".join(str(v) for v in cfg["routeClipBBox"])))


def overpass(cfg, query):
    body = urllib.parse.urlencode({"data": query}).encode()
    for ep in cfg["overpassEndpoints"]:
        try:
            raw = json.loads(get(ep, body, timeout=180))
            if not isinstance(raw.get("elements"), list):
                raise ValueError("no elements")
            return ep, raw
        except Exception as e:  # noqa: BLE001
            print("  ", ep, "failed:", e)
    raise SystemExit("All Overpass endpoints failed")


def walking(cfg, data):
    lat, lon = cfg["property"]["lat"], cfg["property"]["lon"]
    out = {}
    for e in data["elements"]:
        if e["type"] == "node" and "tags" in e:
            key, plat, plon = f"node/{e['id']}", e["lat"], e["lon"]
        elif e["type"] == "way" and "center" in e:
            key, plat, plon = f"way/{e['id']}", e["center"]["lat"], e["center"]["lon"]
        else:
            continue
        url = f"{cfg['osrmFoot']}/{lon},{lat};{plon},{plat}?overview=full&geometries=geojson"
        try:
            out[key] = json.loads(get(url, timeout=60))
        except Exception as e:  # noqa: BLE001
            out[key] = {"code": "FetchError", "message": str(e)}
        time.sleep(1.0)  # polite to the public demo server
    return out


GTFS_ZIP = os.path.join(DATA, "sources", "kentkart_antalya_gtfs.zip")
GTFS_INFO = {
    "name": "KentKart Antalya (third-party GTFS generated from KentKart)",
    "url": "https://github.com/Egezenn/kk-gtfs",
    "mirror": "https://files.mobilitydatabase.org/mdb-3406/latest.zip",
    "licence": "Compilation CC0; underlying data belongs to KentKart / Antalya municipality. Not an official feed.",
}


def hav(lat1, lon1, lat2, lon2):
    import math
    r = math.radians
    a = math.sin(r(lat2 - lat1) / 2) ** 2 + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(r(lon2 - lon1) / 2) ** 2
    return 2 * 6371008.8 * math.asin(math.sqrt(a))


def build_gtfs(cfg):
    """Cut the stops/lines/shapes around the demo locations out of the GTFS feed.
    Values are copied as-is; only rows outside the area are dropped. Routes of the
    feed's "TEST" agency are excluded because they can't be verified."""
    import csv
    import io
    import zipfile
    from collections import Counter, defaultdict
    z = zipfile.ZipFile(GTFS_ZIP)

    def rows(n):
        return csv.DictReader(io.TextIOWrapper(z.open(n), encoding="utf-8-sig"))

    agencies = {a["agency_id"]: a["agency_name"] for a in rows("agency.txt")}
    excluded_agencies = {aid for aid, name in agencies.items() if name.strip().upper() == "TEST"}
    routes = {r["route_id"]: r for r in rows("routes.txt")}
    excluded_routes = sorted({r["route_short_name"] for r in routes.values() if r["agency_id"] in excluded_agencies})
    a = cfg["approximate"]
    origins = [(cfg["property"]["lat"], cfg["property"]["lon"], cfg["radiusMeters"]),
               (a["lat"], a["lon"], a["searchRadiusMeters"])]
    stops = {}
    for s in rows("stops.txt"):
        la, lo = float(s["stop_lat"]), float(s["stop_lon"])
        if any(hav(oa, oo, la, lo) <= rad + 100 for oa, oo, rad in origins):
            stops[s["stop_id"]] = {"id": s["stop_id"], "name": s["stop_name"].strip(), "lat": la, "lon": lo, "serves": set()}
    trips = {}
    headsigns = defaultdict(Counter)
    shapes_for = defaultdict(Counter)
    for t in rows("trips.txt"):
        r = routes.get(t["route_id"])
        if not r or r["agency_id"] in excluded_agencies:
            continue
        key = (t["route_id"], t.get("direction_id") or "0")
        trips[t["trip_id"]] = key
        if t.get("trip_headsign"):
            headsigns[key][t["trip_headsign"].strip()] += 1
        if t.get("shape_id"):
            shapes_for[key][t["shape_id"]] += 1
    for st in rows("stop_times.txt"):
        s = stops.get(st["stop_id"])
        if s is not None and st["trip_id"] in trips:
            s["serves"].add(trips[st["trip_id"]])
    used = sorted({k for s in stops.values() for k in s["serves"]})
    want_shapes = {shapes_for[k].most_common(1)[0][0]: k for k in used if shapes_for[k]}
    pts = defaultdict(list)
    for p in rows("shapes.txt"):
        if p["shape_id"] in want_shapes:
            pts[p["shape_id"]].append((int(p["shape_pt_sequence"]), float(p["shape_pt_lat"]), float(p["shape_pt_lon"])))
    s0, w0, n0, e0 = cfg["routeClipBBox"]
    shapes = defaultdict(dict)
    for sid, plist in pts.items():
        rid, d = want_shapes[sid]
        segs, cur = [], []
        for _, la, lo in sorted(plist):
            if s0 <= la <= n0 and w0 <= lo <= e0:
                cur.append([round(la, 6), round(lo, 6)])
            elif cur:
                segs.append(cur)
                cur = []
        if cur:
            segs.append(cur)
        shapes[rid][d] = [g for g in segs if len(g) > 1]
    out_routes = {}
    for rid, d in used:
        r = routes[rid]
        e = out_routes.setdefault(rid, {"id": rid, "ref": r["route_short_name"], "name": r["route_long_name"], "type": int(r["route_type"]), "dirs": {}})
        e["dirs"][d] = headsigns[(rid, d)].most_common(1)[0][0] if headsigns[(rid, d)] else None
    out_stops = [dict(s, serves=sorted([list(k) for k in s["serves"]])) for s in stops.values() if s["serves"]]
    unused = sorted(s["name"] for s in stops.values() if not s["serves"])
    zdate = max(i.date_time for i in z.infolist())
    cal = list(rows("calendar.txt"))
    return {
        "source": dict(GTFS_INFO, feedFileDate="%04d-%02d-%02d" % zdate[:3],
                       validFrom=min(c["start_date"] for c in cal), validTo=max(c["end_date"] for c in cal),
                       excludedAgencies=[agencies[x] for x in excluded_agencies], excludedRoutes=excluded_routes,
                       stopsWithoutService=unused),
        "stops": out_stops, "routes": out_routes, "shapes": shapes,
    }


def gtfs_walking(cfg, gtfs, walking_json):
    """Walking routes from the exact property to GTFS stops (added, never overwritten)."""
    lat, lon = cfg["property"]["lat"], cfg["property"]["lon"]
    added = 0
    for s in gtfs["stops"]:
        key = f"gtfs/{s['id']}"
        if key in walking_json and walking_json[key].get("code") == "Ok":
            continue
        if hav(lat, lon, s["lat"], s["lon"]) > cfg["radiusMeters"] + 50:
            continue
        url = f"{cfg['osrmFoot']}/{lon},{lat};{s['lon']},{s['lat']}?overview=full&geometries=geojson"
        try:
            walking_json[key] = json.loads(get(url, timeout=30))
            added += 1
        except Exception as e:  # noqa: BLE001
            walking_json[key] = {"code": "FetchError", "message": str(e)}
            print("   walking failed:", s["name"], e)
        time.sleep(1.2)
    return added


def bundle():
    cfg = json.load(open(os.path.join(DATA, "config.json"), encoding="utf-8"))
    template = open(os.path.join(DATA, "overpass_query.overpassql"), encoding="utf-8").read()
    payload = {
        "config": cfg,
        "queryTemplate": template,
        "meta": load("meta.json"),
        "exact": {"overpass": load("overpass.json"), "walking": load("walking.json")},
        "approximate": {"overpass": load("overpass_approx.json")},
        "gtfs": load("gtfs_subset.json"),
    }
    js = ("// Generated by scripts/fetch_snapshot.py. Raw, unmodified service responses.\n"
          "window.TRANSIT_SNAPSHOT = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    open(os.path.join(DATA, "snapshot.js"), "w", encoding="utf-8").write(js)
    print("wrote data/snapshot.js", len(js) // 1024, "KB")


def main():
    if "--bundle" in sys.argv:
        return bundle()
    os.makedirs(OUT, exist_ok=True)
    cfg = json.load(open(os.path.join(DATA, "config.json"), encoding="utf-8"))
    template = open(os.path.join(DATA, "overpass_query.overpassql"), encoding="utf-8").read()
    meta = load("meta.json") if os.path.exists(os.path.join(OUT, "meta.json")) else {}
    if meta.get("retrievedAt"):
        meta.setdefault("walkingRetrievedAt", meta["retrievedAt"])  # walking routes came with the first snapshot
    now = lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731

    print("Overpass (exact location)…")
    ep, data = overpass(cfg, query_for(template, cfg, cfg["property"]["lat"], cfg["property"]["lon"], cfg["radiusMeters"]))
    save("overpass.json", data)
    meta.update(retrievedAt=now(), overpassEndpoint=ep, osmBaseTimestamp=data.get("osm3s", {}).get("timestamp_osm_base"))

    print("Overpass (approximate location)…")
    a = cfg["approximate"]
    ep2, data2 = overpass(cfg, query_for(template, cfg, a["lat"], a["lon"], a["searchRadiusMeters"]))
    save("overpass_approx.json", data2)
    meta.update(approxRetrievedAt=now(), approxOverpassEndpoint=ep2)

    if "--walking" in sys.argv or not os.path.exists(os.path.join(OUT, "walking.json")):
        print("OSRM walking routes…")
        save("walking.json", walking(cfg, data))
        meta.update(walkingRetrievedAt=now(), osrmEndpoint=cfg["osrmFoot"])
    if "--skip-gtfs" not in sys.argv:
        print("KentKart GTFS subset…")
        g = build_gtfs(cfg)
        save("gtfs_subset.json", g)
        print("   stops:", len(g["stops"]), "routes:", len(g["routes"]), "excluded:", g["source"]["excludedRoutes"])
        w = load("walking.json")
        print("   walking routes added for GTFS stops:", gtfs_walking(cfg, g, w))
        save("walking.json", w)
        meta.update(gtfsBuiltAt=now())
    meta["note"] = "Raw, unmodified service responses."
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), indent=2)
    print(json.dumps(meta, indent=2))
    bundle()


if __name__ == "__main__":
    sys.exit(main())
