import squadLandCatalogJson from "../../assets/icons/squad-land-catalog.json";

export type SquadLandCatalogEntry = {
  id: string;
  sidc2525d: string;
  label: string;
  tags: string[];
  filename: string;
};

export type SquadLandCatalogFile = {
  schema: string;
  sidcVersion: string;
  generator: string;
  notes?: string;
  entries: SquadLandCatalogEntry[];
};

export const squadLandCatalog = squadLandCatalogJson as SquadLandCatalogFile;
