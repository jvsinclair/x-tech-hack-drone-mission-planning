#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
const root='resources/palantir_sunol_aoi_upload';
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
for(const rel of manifest.files){
  const p=path.join(root,rel);
  await fs.access(p);
  if(rel.endsWith('.geojson')) JSON.parse(await fs.readFile(p,'utf8'));
  if(rel.endsWith('.csv')){
    const t=await fs.readFile(p,'utf8');
    if(!t.split('\n')[0].includes(',')) throw new Error('CSV header missing: '+rel);
  }
}
console.log('Bundle validation passed. Files:',manifest.files.length);
