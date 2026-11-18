# Antalya Homes: public transport card prototype

This is a design-validation and data-feasibility prototype for a public transport card on listing **AYT-4507** (Luviya project, Topçular, Muratpaşa). It is not production code.

## Run it

**No server needed:** double-click `index.html`.
- The transit data, the map library (`assets/vendor/leaflet-1.9.4/`) and all images are in the project folder.
- Internet is used only for the street-map background and the Open Sans font.
- The background uses the HOT style of OpenStreetMap (served by OSM France), because the standard OpenStreetMap tile server blocks pages opened from disk ("Access blocked"). If it fails, the map falls back to another OSM server, then to an Esri grey base map.
- Offline, the cards still work; the maps show stops and lines on grey and a system font is used.

A local server is optional, e.g. to serve the folder to others:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

**Hosting:** the folder is a static site; publish it as is on GitHub Pages, Netlify or Vercel (no build step).
- Search engines are kept out: every page has `<meta name="robots" content="noindex, nofollow, noarchive">`, and `_headers` (Netlify) and `vercel.json` (Vercel) also send the `X-Robots-Tag` header.
- `.nojekyll` tells GitHub Pages to serve the files unchanged.

**Top bar (prototype only):**
- **Variation:** A1, A2 or A3 (keys `1` `2` `3`). B and C sit under "Other" as secondary options (keys `4` `5`).
- **Location:** Exact or Approximate.
- **Review notes:** claim check, data sources and method.

**URL options:**
- `#A1`, `#A2`, `#A3`, `#B`, `#C`, `#A2-approx` and so on open a specific state.
- `?data=live` queries the APIs live; `?data=fail` shows the error state.

## Variations (same data, same features)

Card A is the preferred direction and comes in three variations. They use the same texts and open the same expanded view (large map and full stop list); they differ in placement, visual treatment and inner layout.

| | Placement | Look and layout |
|---|---|---|
| **A1 – Sidebar card** | Sidebar, below "Every time correct prices" | White card: map on top, headline, three stat tiles, nearest tram and bus stop, "Explore" button |
| **A2 – Page section** | Main column, after the description, as a listing section with the site's red heading | Flat, no card frame: large map on the left; headline, stats and the two nearest stops as cards on the right |
| **A3 – Highlight band** | Main column, right under the price, before "Top 3 reasons" | Navy band on the first screen: map thumbnail on the left; headline and counts on top, the two nearest stops as white tickets, "Explore" button |

Secondary options (under "Other" in the top bar):

| | Placement | Layout |
|---|---|---|
| **B – Compact** | Main column, after the description | Small map, the nearest stop as the hero, three nearby stops, and "Show all" |
| **C – Full-width** | Below Property Details, before Features | List on the left, map on the right |

## Translation and CMS (card A)

- **String catalogue:** [assets/js/transit-strings.js](assets/js/transit-strings.js) holds every text of card A (50 entries; screen-reader-only labels stay in English, as on the rest of the site).
  - Each entry has a key, the proposed CMS title, the English text, a type, placeholders and a max length.
  - Card A reads every text through `t(key, values)` in `transit-ui.js`.
- **Translator sheet:** [docs/transit-card-a-texts.html](docs/transit-card-a-texts.html) is the source. It shows card A and its expanded view in both location modes, with every text outlined, colour-coded and numbered, plus the list of all texts with their CMS titles.
- **File to send:** `dist/Transit-Card-A-Texts.html`, built with `python scripts/build_translator_sheet.py`.
  - It is one self-contained file: CSS, scripts and data are inside.
  - Internet is used only for the map background and the font.
- **Card source line:** the cards credit only OpenStreetMap, which its licence requires. KentKart is not named on the card.

## Design system (cards)

- **Palette:** Antalya Homes colours only.
  - Tram: blue `#4596E6`.
  - Bus: navy `#192B43`.
  - Property and walking route: red `#DA0021`.
  - Approximate area: the live site's circle style.
- **Icons:** one set, Material Icons paths (Apache-2.0) for tram, bus, walk, home, route, expand, close, recenter, map and info.
  - Each mode uses the same circular badge, so colour and glyph identify it.
- **Map:**
  - OpenStreetMap data in the HOT tile style, desaturated in CSS so transit colours lead.
  - Line routes and the walking route are drawn with a white casing.
  - The selected stop gets a label to its right, so it never covers the property pin.
  - Zoom and "back to property" controls.
  - The legend floats over the map.
- **Framing (every map):** the property or area stays centred, and the zoom is chosen by purpose.
  - Exact: walking scale. The nearest stops, or those within a 10-minute walk, are in view, with the zoom clamped.
  - Approximate: the whole 1 km circle with a margin.
  - Small context dots replace full markers in the sidebar preview.
- **Text:** ALL-CAPS source names and directions are shown in Turkish-aware title case, e.g. "MEYDAN - VARSAK ALTIAYAK" becomes "Meydan → Varsak Altıayak".
- **Mobile:** the expanded view goes full screen, with the map on top and the list below.

## Exact vs approximate location

- **Exact:** for exclusive projects whose real location is published, like this one.
  - Property pin on the map.
  - Walking distance and time to each stop, with straight-line distance in the details.
- **Approximate:** for most listings.
  - **Map:** the same 1,000 m circle the live site draws on approximate-location maps (`google.maps.Circle`, radius 1000, red, 2 px stroke, 0.2 fill). The circle's centre is offset from the real point, and the real point lies somewhere inside the circle.
  - **Distances:** shown as "In area" or "~X m from area", measured to the edge of the circle and rounded to 50 m.
  - **No walking times:** they would imply a precise origin.
  - **Production:** the approximate centre must be generated server-side, and the browser must never receive the real coordinates. Otherwise the true location could be read from the page.

## Data

- **Cached by default.** [data/snapshot.js](data/snapshot.js) holds the raw, unmodified responses: OSM data from 18 Nov 2026 and walking routes from the same day. It is built by [scripts/fetch_snapshot.py](scripts/fetch_snapshot.py). The demo therefore never waits for a public API.
- **Stops and lines:** OpenStreetMap via Overpass API. The query is in [data/overpass_query.overpassql](data/overpass_query.overpassql) and the settings in [data/config.json](data/config.json).
- **Walking routes:** OSRM foot profile hosted by FOSSGIS (routing.openstreetmap.de), routing on OSM data.
- **Lines (KentKart first, OSM fallback):** a third-party GTFS feed generated from KentKart ([kk-gtfs](https://github.com/Egezenn/kk-gtfs), Mobility Database `mdb-3406`).
  - The source zip is in `data/sources/`. The fetch script cuts out only the stops, lines and shapes around the two demo locations.
  - Routes of the feed's "TEST" agency are excluded because they can't be verified (506A, T1C, T1D among others).
- **Merging (`harmonize()` in `assets/js/transit-data.js`):**
  - A KentKart stop and an OSM stop count as the same stop when one of these holds:
    - they have the same stop number (OSM `ref` = GTFS `stop_id`);
    - they have the same name within 120 m;
    - they are the same mode within 25 m.
  - Lines and line routes come from KentKart. If KentKart has none for a stop, OSM route relations are used.
  - Stops that exist in only one source are kept.
  - The display name prefers OSM because its casing is nicer.
- **Missing data:** a stop with lines in neither source shows "Line info not available".
- **Disclaimer:** every card carries one short line saying the information is updated regularly, is for guidance only and may change. It also credits KentKart and OpenStreetMap.

Refresh the cache:

```bash
python scripts/fetch_snapshot.py
```

Add `--walking` to also refresh the walking routes. That makes 30 slow requests.

## Findings

- **Listing claim "50 m to Tram stop": consistent.** Topçular (T1A, T1B) is about 40 m straight-line and about 42 m by walking route.
- **Within 1 km:** 21 stops (3 tram and 18 bus).
- **After merging:** all 21 stops matched in both sources, and every one has lines from KentKart. That is 25 lines in total, against 4 from OSM alone.
  - The unnamed OSM stop turned out to be "ANTALYA TİCARET VE SANAYİ ODASI-2".
  - Approximate mode: 32 stops, 30 matched in both sources, 2 only in KentKart.
- **Walking distances** now include the walk from each point to the path network, because OSRM measures only between snapped points. Topçular: 33 m straight-line, 36 m walk.
- **OSM line coverage on its own is thin.**
  - Only 13 of the 21 stops have lines in OSM, and only four lines appear: T1A, T1B, 600 and 600G.
  - A third-party GTFS feed generated from KentKart (Mobility Database `mdb-3406`) lists the same stops with the same names and codes, plus about 25 lines.
    - Example: ASPENDOS BLV-7 has 35, 46, 46A, 511, 531T, 600, 600G, BA22, GCK60, KC35A, SA65 and TCP45.
    - It also covers T1C/T1D and the 8 stops that have no lines in OSM.
  - That feed is not official, and its licence for commercial use is unclear.
