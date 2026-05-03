#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = 'resources/pois_radius_20km';
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));

for (const rel of manifest.files) {
  const p = path.join(root, rel);
  await fs.access(p);
  if (!rel.endsWith('.geojson')) continue;
  const j = JSON.parse(await fs.readFile(p, 'utf8'));
  if (j.type !== 'FeatureCollection') throw new Error(`Not a FeatureCollection: ${rel}`);
  for (const f of j.features || []) {
    const g = f.geometry;
    if (g?.type === 'Point') {
      const c = g.coordinates;
      if (!Array.isArray(c) || c.length < 2 || typeof c[0] !== 'number') {
        throw new Error(`Invalid Point in ${rel}`);
      }
    }
    if (g?.type === 'Polygon' && (!Array.isArray(g.coordinates) || g.coordinates.length === 0)) {
      throw new Error(`Invalid Polygon in ${rel}`);
    }
    if (rel.startsWith('overpass/') && f.properties && !f.properties.retrieved_at) {
      throw new Error(`Missing retrieved_at on feature in ${rel}`);
    }
  }
}

console.log('POI bundle validation passed. Files:', manifest.files.length);
