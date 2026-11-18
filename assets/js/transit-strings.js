/*
 * Translatable texts of the transport card (variation A: sidebar card + expanded map view).
 *
 * One entry = one CMS entry. `cms` is the proposed title in
 * CMS › Settings › Fixed Contents (same naming pattern as "Purchase Costs -> Row: VAT (IVA)").
 * `en` is the English source text. {placeholders} are filled in by the code and must be kept
 * as they are in every language (their position may move).
 *
 * cat (used to colour-code the guide):
 *   heading  – titles, kickers, section labels
 *   sentence – full sentences with placeholders
 *   label    – short labels (stats, modes, legend, detail fields)
 *   action   – buttons and links
 *   unit     – units and distance formats
 *   notice   – disclaimer, empty and error states
 *   tooltip  – shown when the mouse is over a map element
 *
 * Screen-reader-only labels (aria-label) are not translated: the site has none elsewhere,
 * so they stay in English in the code and are not part of this list.
 */
window.TRANSIT_STRINGS = [
  // ---- card header ----
  { key: "kicker", cat: "heading", cms: "Transit Card -> Kicker", en: "Getting around",
    where: "Card and expanded view, small red title above the headline. Also the screen-reader name of the card.", max: 24 },
  { key: "headline.walk.tram", cat: "sentence", cms: "Transit Card -> Headline: tram, walking time", en: "{stop} tram stop is a {minutes}-minute walk away",
    where: "Card and expanded view headline when the nearest stop is a tram stop (exact location).",
    vars: { stop: "Stop name, e.g. Topçular (not translated)", minutes: "Number, e.g. 1" }, max: 70 },
  { key: "headline.walk.bus", cat: "sentence", cms: "Transit Card -> Headline: bus, walking time", en: "{stop} bus stop is a {minutes}-minute walk away",
    where: "Same as above when the nearest stop is a bus stop.", vars: { stop: "Stop name", minutes: "Number" }, max: 70 },
  { key: "headline.dist.tram", cat: "sentence", cms: "Transit Card -> Headline: tram, distance", en: "{stop} tram stop is {distance} away",
    where: "Fallback headline when no walking route is available.", vars: { stop: "Stop name", distance: "Formatted distance, e.g. 40 m" }, max: 70 },
  { key: "headline.dist.bus", cat: "sentence", cms: "Transit Card -> Headline: bus, distance", en: "{stop} bus stop is {distance} away",
    where: "Fallback headline when no walking route is available.", vars: { stop: "Stop name", distance: "Formatted distance" }, max: 70 },
  { key: "headline.area.tram", cat: "sentence", cms: "Transit Card -> Headline: area with tram", en: "Tram {lines} and bus lines serve this area",
    where: "Headline for listings with an approximate location when a tram stop is inside the area.", vars: { lines: "Tram line numbers, e.g. T1A · T1B (not translated)" }, max: 70 },
  { key: "headline.area.bus", cat: "sentence", cms: "Transit Card -> Headline: area, bus only", en: "Bus lines serve this area",
    where: "Approximate location, only bus stops inside the area.", max: 70 },
  { key: "headline.area.near", cat: "sentence", cms: "Transit Card -> Headline: nearest stop outside the area", en: "The nearest stop is about {distance} from this area",
    where: "Approximate location, no stop inside the area.", vars: { distance: "Formatted distance" }, max: 70 },
  { key: "headline.none", cat: "notice", cms: "Transit Card -> Headline: no stops", en: "No public transport stops found nearby",
    where: "Headline when no stops are found.", max: 70 },

  // ---- stats ----
  { key: "scope.radius", cat: "heading", cms: "Transit Card -> Stats title: radius", en: "Within {km} km",
    where: "Small section title above the three numbers (exact location).", vars: { km: "Number, e.g. 1" }, max: 24 },
  { key: "scope.area", cat: "heading", cms: "Transit Card -> Stats title: area", en: "In this area",
    where: "Small section title above the three numbers (approximate location).", max: 24 },
  { key: "stat.tram", cat: "label", cms: "Transit Card -> Stats: tram stops", en: "Tram stops",
    where: "Caption under the first number. Also the group title in the expanded view's list. Written as a caption, not as '3 tram stops', so it never has to agree with the number.", max: 16 },
  { key: "stat.bus", cat: "label", cms: "Transit Card -> Stats: bus stops", en: "Bus stops",
    where: "Caption under the second number and group title in the expanded view.", max: 16 },
  { key: "stat.lines", cat: "label", cms: "Transit Card -> Stats: lines", en: "Lines",
    where: "Caption under the third number (number of tram and bus lines).", max: 16 },

  // ---- stop list ----
  { key: "section.nearest", cat: "heading", cms: "Transit Card -> Section: nearest stops", en: "Nearest stops",
    where: "Small title above the two stops in the card (exact location).", max: 30 },
  { key: "section.inArea", cat: "heading", cms: "Transit Card -> Section: stops in this area", en: "Stops in this area",
    where: "Same position, approximate location.", max: 30 },
  { key: "mode.tram", cat: "label", cms: "Transit Card -> Mode: tram", en: "Tram",
    where: "Small grey word above the stop name in the card, and in the map legend.", max: 14 },
  { key: "mode.bus", cat: "label", cms: "Transit Card -> Mode: bus", en: "Bus",
    where: "Small grey word above the stop name in the card, and in the map legend.", max: 14 },

  // ---- distances & units ----
  { key: "dist.minutes", cat: "unit", cms: "Transit Card -> Unit: minutes", en: "{minutes} min",
    where: "Walking time on the right of every stop row.", vars: { minutes: "Number" }, max: 10 },
  { key: "dist.metres", cat: "unit", cms: "Transit Card -> Unit: metres", en: "{n} m", where: "Walking distance under the time; distances in details.", vars: { n: "Number" }, max: 8 },
  { key: "dist.km", cat: "unit", cms: "Transit Card -> Unit: kilometres", en: "{n} km", where: "Distances of 1 km and more.", vars: { n: "Number with one decimal" }, max: 8 },
  { key: "dist.straight", cat: "unit", cms: "Transit Card -> Unit: straight-line", en: "straight-line",
    where: "Shown under a distance when no walking route exists (as the crow flies).", max: 16 },
  { key: "dist.inArea", cat: "unit", cms: "Transit Card -> Distance: in area", en: "In area",
    where: "Small pill on the right of a stop inside the approximate area.", max: 12 },
  { key: "dist.about", cat: "unit", cms: "Transit Card -> Distance: about", en: "~{distance}",
    where: "Approximate distance outside the area, e.g. ~250 m. Keep the ~ or use your language's 'approx.' form.", vars: { distance: "Formatted distance" }, max: 12 },
  { key: "dist.fromArea", cat: "unit", cms: "Transit Card -> Distance: from area", en: "from area",
    where: "Small grey text under ~250 m.", max: 14 },
  { key: "lines.none", cat: "notice", cms: "Transit Card -> Lines: not available", en: "Line info not available",
    where: "Shown instead of line numbers when a stop has none.", max: 30 },

  // ---- actions ----
  { key: "action.expandMap", cat: "action", cms: "Transit Card -> Button: expand map", en: "Expand map",
    where: "White pill on the top right of the small map.", max: 18 },
  { key: "action.explore", cat: "action", cms: "Transit Card -> Button: explore", en: "Explore all stops & lines",
    where: "Main button of the card; opens the expanded view.", max: 32 },

  // ---- notice ----
  { key: "notice.disclaimer", cat: "notice", cms: "Transit Card -> Disclaimer", en: "Transit information is updated regularly but is for guidance only and may change.",
    where: "Small grey note at the bottom of the card and the expanded view.", max: 140 },
  { key: "notice.attribution", cat: "notice", cms: "Transit Card -> Map attribution", en: "Map data © {osm} contributors.",
    where: "Follows the disclaimer. Required by the OpenStreetMap licence.", vars: { osm: "The name OpenStreetMap as a link (never translated)" }, max: 60 },

  // ---- expanded view: stop details ----
  { key: "detail.walk", cat: "label", cms: "Transit Card -> Detail: walk", en: "Walk",
    where: "Expanded view, selected stop: label of the walking time box. Also the map legend entry for the dotted walking route.", max: 14 },
  { key: "detail.straight", cat: "label", cms: "Transit Card -> Detail: straight-line", en: "Straight-line",
    where: "Expanded view, selected stop: label of the straight-line distance box.", max: 16 },
  { key: "detail.distance", cat: "label", cms: "Transit Card -> Detail: distance", en: "Distance",
    where: "Expanded view, approximate location: label of the distance box.", max: 14 },
  { key: "detail.inside", cat: "unit", cms: "Transit Card -> Detail: inside the area", en: "Inside the area",
    where: "Value of the distance box when the stop is inside the area.", max: 20 },
  { key: "detail.fromArea", cat: "unit", cms: "Transit Card -> Detail: from area", en: "~{distance} from area",
    where: "Value of the distance box when the stop is outside the area.", vars: { distance: "Formatted distance" }, max: 24 },
  { key: "detail.stopNo", cat: "label", cms: "Transit Card -> Detail: stop number", en: "Stop no.",
    where: "Label of the box with the official stop number (bus stops).", max: 12 },
  { key: "detail.lines", cat: "heading", cms: "Transit Card -> Detail: lines and directions", en: "Lines & directions",
    where: "Small title above the list of lines and their directions.", max: 26 },
  { key: "detail.noLines", cat: "notice", cms: "Transit Card -> Detail: no line information", en: "Line information for this stop isn't available yet.",
    where: "Shown in the details when a stop has no lines.", max: 70 },
  { key: "detail.daily", cat: "unit", cms: "Transit Card -> Detail: daily", en: "Daily",
    where: "Prefix of operating hours, e.g. 'Daily 06:35–23:35' (shown only when the data has hours).", max: 12 },

  // ---- expanded view: map legend ----
  { key: "legend.property", cat: "label", cms: "Transit Card -> Legend: property", en: "Property",
    where: "Map legend, red pin (exact location).", max: 16 },
  { key: "legend.area", cat: "label", cms: "Transit Card -> Legend: approximate location", en: "Approximate location",
    where: "Map legend, red circle (approximate location).", max: 24 },
  { key: "legend.lineRoute", cat: "label", cms: "Transit Card -> Legend: line route", en: "Line route",
    where: "Map legend, coloured line of the selected stop's routes.", max: 16 },

  // ---- map tooltips (shown on mouse-over) ----
  { key: "tip.backProperty", cat: "tooltip", cms: "Transit Card -> Map tooltip: back to the property", en: "Back to the property",
    where: "Expanded view: tooltip of the target button on the map (exact location).", max: 28 },
  { key: "tip.backArea", cat: "tooltip", cms: "Transit Card -> Map tooltip: back to the area", en: "Back to the area",
    where: "Expanded view: tooltip of the target button on the map (approximate location).", max: 28 },
  { key: "tip.tramStop", cat: "tooltip", cms: "Transit Card -> Map tooltip: tram stop", en: "Tram stop",
    where: "Expanded view: second line of the tooltip when the mouse is over a tram stop on the map.", max: 16 },
  { key: "tip.busStop", cat: "tooltip", cms: "Transit Card -> Map tooltip: bus stop", en: "Bus stop",
    where: "Expanded view: second line of the tooltip when the mouse is over a bus stop on the map.", max: 16 },

  // ---- loading / error ----
  { key: "state.loading", cat: "notice", cms: "Transit Card -> State: loading", en: "Loading nearby public transport…",
    where: "Shown briefly while the card loads.", max: 50 },
  { key: "state.errorTitle", cat: "notice", cms: "Transit Card -> State: error title", en: "Public transport information is unavailable right now.",
    where: "Shown instead of the card if the data can't be loaded.", max: 70 },
  { key: "state.errorBody", cat: "notice", cms: "Transit Card -> State: error text", en: "Please try again later.", where: "Under the error title.", max: 50 },
  { key: "action.tryAgain", cat: "action", cms: "Transit Card -> Button: try again", en: "Try again", where: "Button under the error message.", max: 18 },
];
