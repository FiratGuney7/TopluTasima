"""
Build the translator sheet for transit card A as ONE self-contained HTML file that can be emailed:

  dist/Transit-Card-A-Texts.html

All CSS, JavaScript (Leaflet, card code, texts) and the cached transit data are inside the file.
It opens by double-click; an internet connection is only used for the street-map background and
the Open Sans font (without it the maps show markers on grey and a system font is used).

Source page: docs/transit-card-a-texts.html (uses the live card code and cached data).
Run:  python scripts/build_translator_sheet.py
"""
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "transit-card-a-texts.html")
OUT = os.path.join(ROOT, "dist", "Transit-Card-A-Texts.html")
LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/"


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "build-script"}), timeout=60).read().decode("utf-8")


def local(rel):
    return open(os.path.join(ROOT, rel), encoding="utf-8").read()


def inline_script(code):
    return "<script>\n" + code.replace("</script", "<\\/script") + "\n</script>"


s = open(SRC, encoding="utf-8").read()
s = s.replace('<link rel="stylesheet" href="../assets/vendor/leaflet-1.9.4/leaflet.min.css">', "<style>" + local("assets/vendor/leaflet-1.9.4/leaflet.min.css") + "</style>")
s = s.replace('<link rel="stylesheet" href="../assets/css/transit.css">', "<style>" + local("assets/css/transit.css") + "</style>")
s = s.replace('<script src="../assets/vendor/leaflet-1.9.4/leaflet.min.js"></script>', inline_script(local("assets/vendor/leaflet-1.9.4/leaflet.min.js")))
for rel in ["data/snapshot.js", "assets/js/transit-strings.js", "assets/js/transit-data.js", "assets/js/transit-ui.js"]:
    s = s.replace(f'<script src="../{rel}"></script>', inline_script(local(rel)))

outside = re.sub(r"<script>.*?</script>|<style>.*?</style>", "", s, flags=re.S)
assert not re.search(r'(src|href)="\.\./', outside), "a relative file reference was left in the page"

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(s)
print("HTML:", os.path.relpath(OUT, ROOT), f"{os.path.getsize(OUT) // 1024} KB")
