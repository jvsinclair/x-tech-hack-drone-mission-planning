# MIL-STD-2525D unit SVG icons (squad land subset)

Static SVGs generated for Goal **0007** from **[milsymbol](https://github.com/spatialillusions/milsymbol)** (`Symbol#asSVG()`). Each file is a **30-character numeric SIDC** (2525D). Regenerate after changing the catalog script:

```bash
npm install
npm run generate:icons
```

Runtime rendering should prefer `src/symbology/sidcSymbols.ts` (`sidc2525dToSvg`) so modifiers and echelon updates stay consistent; these files are useful for previews, tests, and bundlers that import SVG as URLs.

See `squad-land-catalog.json` for `sidc2525d`, labels, and filenames. Full spec: `docs/goals/0007-sidc-2525d-squad-land-units-svg-picker.md`.

Quick visual check: open `preview-grid.html` via a local static server (same-origin `fetch` for the catalog JSON), e.g. `npx serve assets/icons` from the repo root after `npm install`.
