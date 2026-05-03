# POI data sources: 20 km radius — Sunol corridor study area

## Purpose
Catalog public and mission-adjacent **point-of-interest** sources for a **20 km** radius around a fixed center in the East Bay (Sunol / Pleasanton / Fremont corridor). Supports planning-context map layers in Cesium or Palantir bundle workflows. **Not** targeting or weaponization data.

## Status
- Validation status: `provisional`
- Last reviewed: `2026-05-03`
- Owner: project

## Study area definition

| Parameter | Value |
| --- | --- |
| Center latitude | `37.504646` |
| Center longitude | `-121.832739` |
| Radius | **20,000 m** (20 km) |

### Circular vs bounding box
- **Overpass:** use `around:20000,37.504646,-121.832739` for true disk AOI on the sphere (recommended for OSM POI queries).
- **ArcGIS envelope:** axis-aligned box approximating the circle (degrees are approximate):

  - \(\Delta\phi \approx 20000/111320 \approx 0.1797°\) latitude  
  - \(\Delta\lambda \approx 20000/(111320\cos 37.5°) \approx 0.2258°\) longitude  

  Example envelope (verify before production queries):

  - west ≈ `-122.0585`, south ≈ `37.3249`, east ≈ `-121.6070`, north ≈ `37.6844`

### Geography note
Footprint spans **Alameda** and **Contra Costa** counties: mixed suburban development, regional parks (e.g. Sunol Regional Wilderness), highways, and open space.

## Generated artifacts (repo)

After `node scripts/fetch-pois-radius.mjs`:

| Path | Description |
| --- | --- |
| `resources/pois_radius_20km/manifest.json` | File list, feature counts, timestamps |
| `resources/pois_radius_20km/study_area/study_area_20km.geojson` | Approximate **polygon** ring for the 20 km disk (map overlay) |
| `resources/pois_radius_20km/overpass/*.geojson` | OSM POI layers by tag family (see script) |

Validate with `node scripts/validate-poi-bundle.mjs`.

## Source catalog

License / usage columns are **summary only**; confirm current terms before redistribution or commercial use.

### A. Open access (no API key) — recommended baseline

| ID | Source | Role | License / policy | Update cadence | Fit for Cesium |
| --- | --- | --- | --- | --- | --- |
| A1 | [OpenStreetMap](https://www.openstreetmap.org/) via [Overpass API](https://overpass-api.de/) | Primary POI backbone: `amenity`, `tourism`, `historic`, `shop`, `leisure`, `office`, `craft`, `man_made`, `emergency`, `healthcare`, `sport`, peaks, etc. | [ODbL](https://www.openstreetmap.org/copyright); attribute © OSM contributors | Community live + regional delay | `GeoJsonDataSource` points |
| A2 | [Nominatim](https://nominatim.org/release-docs/develop/api/Overview/) | Reverse geocode, place lookup, **not** bulk POI harvest | [Usage policy](https://operations.osmfoundation.org/policies/nominatim/) — strict rate limits | OSM-backed | Spot checks only |
| A3 | [USGS GNIS](https://www.usgs.gov/tools/geographic-names-information-system-gnis) | Named peaks, populated places, locales | USGS — generally public domain for federal compilation; verify product sheet | Periodic releases | Labels / context |
| A4 | [The National Map](https://www.usgs.gov/the-national-map-data-delivery/gis-data-download) | Structures, elevation, hydro layers | USGS data delivery terms | Rolling | Context overlays |
| A5 | [NPS Open Data](https://public-nps.opendata.arcgis.com/) | Park units, some facilities | Public domain US Gov | Varies | Polygon boundaries + labels |
| A6 | [California State Parks GIS](https://www.parks.ca.gov/?page_id=29582) | Park boundaries / planning layers | CA open data terms | Varies | Polygon context |
| A7 | [USFS Recreation Information Database (RIDB)](https://www.fs.usda.gov/visit/recreation) / Hub exports | Campgrounds, trailheads | Federal open data | Periodic | Outdoor POIs |

### B. Government ArcGIS / regional open data

| ID | Source | Role | Notes |
| --- | --- | --- | --- |
| B1 | [California Geoportal](https://gis.data.ca.gov/) | Discover state-hosted layers (facilities, hazards) | Query stable FeatureServer URLs per layer |
| B2 | Alameda County / city Hubs (Fremont, Oakland, etc.) | Trails, facilities, public buildings | URLs change; clip to study bbox |
| B3 | Cal OES / Cal Fire open layers | Sometimes facilities or zones; often incident/event | Prefer static facility layers only for POI |

### C. Infrastructure-style features (often mission-relevant)

| ID | Source | Role | Notes |
| --- | --- | --- | --- |
| C1 | [HIFLD Open](https://hifld-geoplatform.opendata.arcgis.com/) (ArcGIS services2 host for national layers) | Schools, hospitals, EMS — query by map extent | National datasets; clip to bbox; verify attribution |
| C2 | FEMA National Flood Hazard Layer | Flood **polygons**, not POI points | Use as constraint / no-go context |

### D. Commercial / API key (document only unless approved)

| ID | Source | Role |
| --- | --- | --- |
| D1 | Google Places API | Dense commercial POI categories |
| D2 | Foursquare / Yelp | Similar; redistribution usually restricted |

**Repo recommendation:** implement **A1** in [scripts/fetch-pois-radius.mjs](../../scripts/fetch-pois-radius.mjs). Treat **A2–A7, B, C** as manual or follow-on integrations. Do **not** commit keys for **D**.

## Technical notes

### Fetch implementation ([scripts/fetch-pois-radius.mjs](../../scripts/fetch-pois-radius.mjs))
- Uses **`curl` subprocess** first (large JSON bodies; avoids common Node `fetch` TLS/IPv6 issues), then **fetch** as a fallback.
- Tries multiple **Overpass API** base URLs in order: `overpass-api.de`, then `overpass.kumi.systems` (public mirrors; availability varies).
- If responses are **HTML/XML** (rate limit, overload) or the run is **offline**, layer files will be **empty** `FeatureCollection`s. Re-run on a network that can reach a mirror, or wait and retry.
- Validate outputs with: `node scripts/validate-poi-bundle.mjs`.

### Node `fetch` and Overpass
Send a realistic **`User-Agent`** if using fetch only. The POI script prefers **curl** for robustness.

### Nominatim
Do **not** use Nominatim for bulk downloads of thousands of POIs; use Overpass for OSM-backed bulk pulls.

### Mission framing
Use POI layers as **planning context** only. Mark generated features `provisional: true` where appropriate. Avoid UI language that implies targeting of civilian infrastructure.

## Follow-up

1. Optional: add HIFLD school/hospital queries clipped to the same bbox for a second manifest section.
2. Optional: county trail GeoJSON from a verified stable Hub endpoint.
3. Register any new **fetched** source in [source_registry.json](./source_registry.json).
