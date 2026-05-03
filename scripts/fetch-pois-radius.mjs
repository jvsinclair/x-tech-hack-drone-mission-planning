#!/usr/bin/env node
/**
 * Fetches OSM POI data for a fixed 20 km radius (Overpass).
 * See docs/research/poi_sources_20km_sunol_corridor.md
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const CENTER_LAT = 37.504646;
const CENTER_LON = -121.832739;
const RADIUS_M = 20_000;
const OUT = 'resources/pois_radius_20km';
/** Multiple public instances — rate limits and connectivity vary by region. */
const overpassUrls = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const overpassHeaders = {
  'User-Agent': 'x-tech-hackathon-poi-fetch/1.0 (Node)',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept': 'application/json,*/*;q=0.9',
};

const retrieved_at = new Date().toISOString();
const sourceName = 'OpenStreetMap Overpass';
const sourceUrl = overpassUrls[0];

const ensure = (p) => fs.mkdir(p, { recursive: true });
const featureCollection = (features) => ({ type: 'FeatureCollection', features });
const withMeta = (fc) => {
  for (const f of fc.features) {
    f.properties = {
      ...(f.properties || {}),
      source_name: sourceName,
      source_url: sourceUrl,
      retrieved_at,
      provisional: true,
    };
  }
  return fc;
};

const CURL_MAX_MB = 512;
const execCurlMaxBuffer = CURL_MAX_MB * 1024 * 1024;

const parseOverpassJson = (stdout, endpoint) => {
  const t = stdout.trim();
  if (!t.startsWith('{')) {
    throw new Error(`Non-JSON from ${endpoint} (${t.slice(0, 80)}…)`);
  }
  return JSON.parse(t);
};

/** Prefer curl; try each Overpass mirror; then fetch fallback. */
const overpass = async (query) => {
  const body = new URLSearchParams({ data: query }).toString();
  let lastErr = '';
  for (const endpoint of overpassUrls) {
    try {
      const { stdout } = await execFileAsync(
        'curl',
        [
          '-sS',
          '--max-time',
          '600',
          '-X',
          'POST',
          '-H',
          'User-Agent: x-tech-hackathon-poi-fetch/1.0 (curl)',
          '-H',
          'Content-Type: application/x-www-form-urlencoded',
          '-d',
          body,
          endpoint,
        ],
        { maxBuffer: execCurlMaxBuffer },
      );
      return parseOverpassJson(stdout, endpoint);
    } catch (e) {
      lastErr = `${endpoint}: ${e?.message || e}`;
    }
  }
  try {
    const r = await fetch(overpassUrls[0], {
      method: 'POST',
      body: new URLSearchParams({ data: query }),
      headers: overpassHeaders,
      signal: AbortSignal.timeout(600_000),
    });
    if (!r.ok) throw new Error(`Overpass HTTP ${r.status}`);
    const txt = await r.text();
    return parseOverpassJson(txt, 'fetch');
  } catch (e2) {
    throw new Error(`${lastErr} | fetch: ${e2?.message || e2}`);
  }
};

/** Build Point features from Overpass elements (nodes + ways with center). */
const elementsToPoiFeatures = (data) => {
  const features = [];
  for (const e of data.elements || []) {
    if (e.type === 'node' && e.lon != null && e.lat != null) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
        properties: { ...e.tags, osm_type: 'node', osm_id: e.id },
      });
    } else if (e.type === 'way' && e.center) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [e.center.lon, e.center.lat] },
        properties: { ...e.tags, osm_type: 'way', osm_id: e.id },
      });
    }
  }
  return features;
};

const A = (lat, lon, r) => `(around:${r},${lat},${lon})`;

// Query parts: (nodes and ways with tag), out center tags
const q = (inner) =>
  `[out:json][timeout:300];
(${inner});
out center tags;`;

const layers = [
  {
    file: 'pois_amenity.geojson',
    build: (a) =>
      q(
        `node["amenity"]${a};way["amenity"]${a}`,
      ),
  },
  {
    file: 'pois_tourism_historic.geojson',
    build: (a) =>
      q(
        `node["tourism"]${a};way["tourism"]${a};node["historic"]${a};way["historic"]${a}`,
      ),
  },
  {
    file: 'pois_shop_leisure.geojson',
    build: (a) => q(`node["shop"]${a};way["shop"]${a};node["leisure"]${a};way["leisure"]${a}`),
  },
  {
    file: 'pois_office_craft_man_made.geojson',
    build: (a) =>
      q(`node["office"]${a};way["office"]${a};node["craft"]${a};way["craft"]${a};node["man_made"]${a};way["man_made"]${a}`),
  },
  {
    file: 'pois_emergency_healthcare.geojson',
    build: (a) =>
      q(
        `node["emergency"]${a};way["emergency"]${a};node["healthcare"]${a};way["healthcare"]${a}`,
      ),
  },
  {
    file: 'pois_sport.geojson',
    build: (a) => q(`node["sport"]${a};way["sport"]${a}`),
  },
  {
    file: 'pois_natural_peaks_pass_viewpoint.geojson',
    build: (a) =>
      q(
        `node["natural"="peak"]${a};node["mountain_pass"]${a};node["highway"="viewpoint"]${a}`,
      ),
  },
  {
    file: 'pois_transport.geojson',
    build: (a) =>
      q(
        `node["railway"="station"]${a};node["public_transport"]${a};way["public_transport"]${a}`,
      ),
  },
];

/** Approximate geodesic circle as polygon (Web Mercator–friendly small AOI). */
function circleRing(latDeg, lonDeg, radiusM, segments = 72) {
  const R = 6371000;
  const lat1 = (latDeg * Math.PI) / 180;
  const lon1 = (lonDeg * Math.PI) / 180;
  const ring = [];
  for (let i = 0; i <= segments; i++) {
    const brng = (2 * Math.PI * i) / segments;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(radiusM / R) +
        Math.cos(lat1) * Math.sin(radiusM / R) * Math.cos(brng),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(radiusM / R) * Math.cos(lat1),
        Math.cos(radiusM / R) - Math.sin(lat1) * Math.sin(lat2),
      );
    ring.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return ring;
}

await ensure(path.join(OUT, 'overpass'));
await ensure(path.join(OUT, 'study_area'));

const around = A(CENTER_LAT, CENTER_LON, RADIUS_M);
const counts = {};
const files = ['README.md', 'manifest.json', 'study_area/study_area_20km.geojson'];

const studyPoly = featureCollection([
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [circleRing(CENTER_LAT, CENTER_LON, RADIUS_M)],
    },
    properties: {
      name: 'POI study area 20 km radius',
      center_lat: CENTER_LAT,
      center_lon: CENTER_LON,
      radius_m: RADIUS_M,
      source_name: 'Synthetic geodesic buffer',
      source_url: 'local',
      retrieved_at,
      provisional: true,
    },
  },
]);
await fs.writeFile(
  path.join(OUT, 'study_area/study_area_20km.geojson'),
  JSON.stringify(studyPoly, null, 2) + '\n',
);

for (const { file, build } of layers) {
  const inner = build(around);
  let fc = featureCollection([]);
  try {
    const data = await overpass(inner);
    fc = withMeta(featureCollection(elementsToPoiFeatures(data)));
  } catch (err) {
    console.warn(`[fetch-pois] ${file}:`, err?.message || err);
    fc = withMeta(featureCollection([]));
  }
  counts[`overpass/${file}`] = fc.features.length;
  await fs.writeFile(path.join(OUT, 'overpass', file), JSON.stringify(fc, null, 2) + '\n');
  files.push(`overpass/${file}`);
}

const manifest = {
  bundle: 'pois_radius_20km',
  created_at: retrieved_at,
  study_area: {
    center_lat: CENTER_LAT,
    center_lon: CENTER_LON,
    radius_m: RADIUS_M,
    bbox_approx_deg: {
      note: 'Axis-aligned box approximating 20 km disk (for ArcGIS envelope queries)',
      west: CENTER_LON - 0.226,
      south: CENTER_LAT - 0.18,
      east: CENTER_LON + 0.226,
      north: CENTER_LAT + 0.18,
    },
  },
  files,
  counts,
  sources_fetched: [sourceName],
  sources_documented_not_fetched: [
    'OpenStreetMap Nominatim (policy: no bulk harvest)',
    'USGS GNIS',
    'USGS National Map layers',
    'NPS / CA State Parks open data',
    'USFS RIDB',
    'California Geoportal / county hubs',
    'HIFLD national layers',
    'FEMA NFHL',
  ],
  documentation: 'docs/research/poi_sources_20km_sunol_corridor.md',
  safety_note:
    'Planning context only. Features marked provisional. Not for targeting or weaponization workflows.',
};

await fs.writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

await fs.writeFile(
  path.join(OUT, 'README.md'),
  `# POI bundle (20 km radius)\n\nCenter: ${CENTER_LAT}, ${CENTER_LON}. Radius: ${RADIUS_M} m.\n\nGenerated: ${retrieved_at}.\n\nSee manifest.json and docs/research/poi_sources_20km_sunol_corridor.md.\n`,
);

console.log('Wrote', OUT, '| total features', Object.values(counts).reduce((a, b) => a + b, 0));
