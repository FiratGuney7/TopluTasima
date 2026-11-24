/*
 * Translatable texts of the location map section and its public transport box (variations Yatay and Dikey).
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
  // ---- location map ----
  { key: "loc.title", cat: "heading", cms: "Location Map -> Section title", en: "Location",
    where: "Section title above the map, in the site's red section-title style.", max: 30 },
  { key: "layer.transport", cat: "label", cms: "Location Map -> Public transport (switch)", en: "Public transport",
    where: "Title of the small box on the map, next to the on/off switch that shows or hides the stops.", max: 22 },
  { key: "transit.showLines", cat: "action", cms: "Location Map -> Button: show lines", en: "Show lines",
    where: "Button at the bottom of the public transport box; draws every line on the map. The number next to it is the count of lines.", max: 22 },
  { key: "transit.hideLines", cat: "action", cms: "Location Map -> Button: hide lines", en: "Hide lines",
    where: "Same button while the lines are shown.", max: 22 },
  { key: "transit.pickLine", cat: "sentence", cms: "Location Map -> Hint: pick a line", en: "Select a line to highlight its route.",
    where: "Small grey hint above the line numbers when the lines are shown.", max: 50 },
  { key: "hint.ctrlZoom", cat: "notice", cms: "Location Map -> Hint: zoom (Windows)", en: "Use Ctrl + scroll to zoom the map",
    where: "Shown over the map for a moment when someone scrolls over it without Ctrl (the page keeps scrolling).", max: 44 },
  { key: "hint.cmdZoom", cat: "notice", cms: "Location Map -> Hint: zoom (Mac)", en: "Use ⌘ + scroll to zoom the map",
    where: "Same hint on Mac computers.", max: 44 },
  { key: "hint.twoFingers", cat: "notice", cms: "Location Map -> Hint: move (phones)", en: "Use two fingers to move the map",
    where: "Shown over the map on phones when someone drags it with one finger (the page keeps scrolling).", max: 44 },
  { key: "transit.moreStops", cat: "sentence", cms: "Location Map -> More stops on the map", en: "{n} more stops on the map",
    where: "Small grey line under the two nearest stops in the box on the map.", vars: { n: "Number" }, max: 34 },
  // ---- stop list ----
  { key: "mode.tram", cat: "label", cms: "Location Map -> Mode: tram", en: "Tram",
    where: "Stop popup on the map: small grey word above the stop name.", max: 14 },
  { key: "mode.bus", cat: "label", cms: "Location Map -> Mode: bus", en: "Bus",
    where: "Stop popup on the map: small grey word above the stop name.", max: 14 },
  // ---- distances & units ----
  { key: "dist.minutes", cat: "unit", cms: "Location Map -> Unit: minutes", en: "{minutes} min",
    where: "Walking time on the right of each stop in the public transport box, and in the stop popup.", vars: { minutes: "Number" }, max: 10 },
  { key: "dist.metres", cat: "unit", cms: "Location Map -> Unit: metres", en: "{n} m", where: "Walking distance in the stop popup, e.g. 260 m.", vars: { n: "Number" }, max: 8 },
  { key: "dist.km", cat: "unit", cms: "Location Map -> Unit: kilometres", en: "{n} km", where: "Distances of 1 km and more.", vars: { n: "Number with one decimal" }, max: 8 },
  { key: "dist.straight", cat: "unit", cms: "Location Map -> Unit: straight-line", en: "straight-line",
    where: "Stop popup: after a distance when no walking route exists (as the crow flies).", max: 16 },
  { key: "dist.inArea", cat: "unit", cms: "Location Map -> Distance: in area", en: "In area",
    where: "Public transport box, approximate location: on the right of a stop inside the area.", max: 12 },
  { key: "dist.about", cat: "unit", cms: "Location Map -> Distance: about", en: "~{distance}",
    where: "Public transport box, approximate location: distance of a stop outside the area, e.g. ~250 m. Keep the ~ or use your language's 'approx.' form.", vars: { distance: "Formatted distance" }, max: 12 },
  { key: "lines.none", cat: "notice", cms: "Location Map -> Lines: not available", en: "Line info not available",
    where: "Public transport box: shown instead of line numbers when a stop has none.", max: 30 },
  // ---- notice ----
  { key: "notice.disclaimer", cat: "notice", cms: "Location Map -> Disclaimer", en: "Map information is updated regularly but is for guidance only and may change.",
    where: "Small grey note under the map.", max: 140 },
  { key: "notice.attribution", cat: "notice", cms: "Location Map -> Map attribution", en: "Map data © {osm} contributors.",
    where: "Follows the disclaimer. Required by the OpenStreetMap licence.", vars: { osm: "The name OpenStreetMap as a link (never translated)" }, max: 60 },
  // ---- expanded view: stop details ----
  { key: "detail.inside", cat: "unit", cms: "Location Map -> Detail: inside the area", en: "Inside the area",
    where: "Stop popup, approximate location: the stop is inside the area.", max: 20 },
  { key: "detail.fromArea", cat: "unit", cms: "Location Map -> Detail: from area", en: "~{distance} from area",
    where: "Stop popup, approximate location: distance of a stop outside the area.", vars: { distance: "Formatted distance" }, max: 24 },
  { key: "detail.stopNo", cat: "label", cms: "Location Map -> Detail: stop number", en: "Stop no.",
    where: "Stop popup: before the official stop number, e.g. Bus · Stop no. 10701.", max: 12 },
  { key: "detail.lines", cat: "heading", cms: "Location Map -> Detail: lines and directions", en: "Lines & directions",
    where: "Stop popup: small title above the lines and their directions.", max: 26 },
  { key: "detail.noLines", cat: "notice", cms: "Location Map -> Detail: no line information", en: "Line information for this stop isn't available yet.",
    where: "Stop popup when a stop has no lines.", max: 70 },
  // ---- map tooltips (shown on mouse-over) ----
  { key: "tip.backProperty", cat: "tooltip", cms: "Location Map -> Map tooltip: back to the property", en: "Back to the property",
    where: "Map: tooltip of the target button under the zoom buttons (exact location).", max: 28 },
  { key: "tip.backArea", cat: "tooltip", cms: "Location Map -> Map tooltip: back to the area", en: "Back to the area",
    where: "Map: tooltip of the target button under the zoom buttons (approximate location).", max: 28 },
  { key: "tip.tramStop", cat: "tooltip", cms: "Location Map -> Map tooltip: tram stop", en: "Tram stop",
    where: "Map: second line of the tooltip when the mouse is over a tram stop on the map.", max: 16 },
  { key: "tip.busStop", cat: "tooltip", cms: "Location Map -> Map tooltip: bus stop", en: "Bus stop",
    where: "Map: second line of the tooltip when the mouse is over a bus stop on the map.", max: 16 },
  // ---- loading / error ----
  { key: "state.loading", cat: "notice", cms: "Location Map -> State: loading", en: "Loading nearby public transport…",
    where: "Shown briefly while the map section loads.", max: 50 },
  { key: "state.errorTitle", cat: "notice", cms: "Location Map -> State: error title", en: "Public transport information is unavailable right now.",
    where: "Shown instead of the map section if the data can't be loaded.", max: 70 },
  { key: "state.errorBody", cat: "notice", cms: "Location Map -> State: error text", en: "Please try again later.", where: "Under the error title.", max: 50 },
  { key: "action.tryAgain", cat: "action", cms: "Location Map -> Button: try again", en: "Try again", where: "Button under the error message.", max: 18 },
];
