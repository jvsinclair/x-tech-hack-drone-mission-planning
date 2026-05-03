/**
 * Runtime SVG generation for MIL-STD-2525D numeric SIDCs via [milsymbol](https://github.com/spatialillusions/milsymbol) (MIT).
 * Curated static SVGs also live under `assets/icons/` (see `npm run generate:icons`).
 *
 * Spec: `docs/goals/0007-sidc-2525d-squad-land-units-svg-picker.md`
 */
import type * as MilsymbolTypes from "milsymbol";

type MilsymbolRuntime = typeof MilsymbolTypes;

let cached: MilsymbolRuntime | null = null;

/** Loads 2525D icon definitions once (safe to call multiple times). */
export async function ensureSidc2525dRenderer(): Promise<void> {
  if (cached) return;
  const mod = (await import("milsymbol")) as unknown as { default?: MilsymbolRuntime } & MilsymbolRuntime;
  const runtime = mod.default ?? mod;
  runtime.setStandard("2525");
  cached = runtime;
}

function getMs(): MilsymbolRuntime {
  if (!cached) {
    throw new Error("Call ensureSidc2525dRenderer() before synchronous SVG helpers.");
  }
  return cached;
}

/** Returns raw SVG markup for a 30-character 2525D SIDC. */
export async function sidc2525dToSvg(sidc2525d: string, size = 80): Promise<string> {
  await ensureSidc2525dRenderer();
  const ms = getMs();
  const sym = new ms.Symbol(sidc2525d, { size, standard: "2525" });
  return sym.asSVG();
}

/** Same as `sidc2525dToSvg` after `ensureSidc2525dRenderer()` has resolved. */
export function sidc2525dToSvgSync(sidc2525d: string, size = 80): string {
  const ms = getMs();
  return new ms.Symbol(sidc2525d, { size, standard: "2525" }).asSVG();
}

/** Encode SVG for use as a Cesium billboard image URI. */
export function svgToDataUrl(svgXml: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;
}
