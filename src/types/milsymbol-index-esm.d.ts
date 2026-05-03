/** Bridge typings — package publishes `index.d.ts` for `milsymbol`; we import `index.esm.js` directly for tree-shaken 2525D-only init. */
declare module "milsymbol/index.esm.js" {
  import type { Symbol as MsSymbol } from "milsymbol";

  export const ms: {
    Symbol: new (code: string, ...options: object[]) => MsSymbol;
    reset(): void;
    addIcons(icons: unknown): void;
    setStandard(standard: "2525" | "APP6"): boolean;
  };

  export const std2525d: unknown;
}
