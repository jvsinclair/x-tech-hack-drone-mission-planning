/**
 * Generates MIL-STD-2525D land-unit icons as SVG files under assets/icons/.
 * Uses milsymbol (MIT) — outputs SVG via Symbol#asSVG().
 *
 * Run after `npm install`:
 *   node scripts/generate-sidc-unit-svgs.mjs
 *
 * SIDC structure follows milsymbol / 2525D numeric format (30 chars). Affiliation is
 * encoded in digits 3–4 (03 friendly, 04 neutral, 06 hostile, 07 unknown per probes).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let ms;
try {
  const mod = await import("milsymbol");
  ms = mod.default ?? mod;
} catch {
  const fallback = pathToFileURL(join(root, ".tmp-milsymbol/package/index.esm.js")).href;
  const fallbackMod = await import(fallback);
  ms = fallbackMod.ms ?? fallbackMod.default ?? fallbackMod;
  if (fallbackMod.std2525d && typeof ms.addIcons === "function") {
    ms.reset();
    ms.addIcons(fallbackMod.std2525d);
  }
}

const outDir = join(root, "assets", "icons");

ms.setStandard("2525");

/** @type {{ id: string; sidc2525d: string; label: string; tags: string[] }[]} */
const catalog = [
  {
    id: "land-infantry-friendly",
    sidc2525d: "100310000012110000000000000000",
    label: "Land unit — infantry (Friendly)",
    tags: ["land", "squad", "infantry", "friendly"],
  },
  {
    id: "land-infantry-hostile",
    sidc2525d: "100610000012110000000000000000",
    label: "Land unit — infantry (Hostile)",
    tags: ["land", "squad", "infantry", "hostile"],
  },
  {
    id: "land-infantry-neutral",
    sidc2525d: "100410000012110000000000000000",
    label: "Land unit — infantry (Neutral)",
    tags: ["land", "squad", "infantry", "neutral"],
  },
  {
    id: "land-infantry-unknown",
    sidc2525d: "100710000012110000000000000000",
    label: "Land unit — infantry (Unknown)",
    tags: ["land", "squad", "infantry", "unknown"],
  },
  {
    id: "land-motorized-recon-friendly",
    sidc2525d: "100310000012130300000000000000",
    label: "Land unit — reconnaissance / motorized (Friendly)",
    tags: ["land", "squad", "motorized", "reconnaissance", "friendly"],
  },
  {
    id: "land-motorized-recon-hostile",
    sidc2525d: "100610000012130300000000000000",
    label: "Land unit — reconnaissance / motorized (Hostile)",
    tags: ["land", "squad", "motorized", "reconnaissance", "hostile"],
  },
];

mkdirSync(outDir, { recursive: true });

const size = 80;
for (const entry of catalog) {
  const symbol = new ms.Symbol(entry.sidc2525d, { size, standard: "2525" });
  if (!symbol.isValid()) {
    console.warn(`Warning: milsymbol reports invalid SIDC for ${entry.id}: ${entry.sidc2525d}`);
  }
  const svg = symbol.asSVG();
  const filename = `${entry.id}.svg`;
  writeFileSync(join(outDir, filename), svg, "utf8");
  entry.filename = filename;
}

writeFileSync(
  join(outDir, "squad-land-catalog.json"),
  JSON.stringify(
    {
      schema: "squad-land-icons",
      sidcVersion: "2525D",
      generator: "milsymbol",
      notes:
        "Infantry uses entity code 121100; motorized distinction uses 121303 (reconnaissance + motorized) — numeric 121104 did not validate in milsymbol for this builder.",
      entries: catalog.map(({ id, sidc2525d, label, tags, filename }) => ({
        id,
        sidc2525d,
        label,
        tags,
        filename,
      })),
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Wrote ${catalog.length} SVG files + squad-land-catalog.json → ${outDir}`);
