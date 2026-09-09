export type Modality =
  | "binaural"
  | "isochronic"
  | "monaural"
  | "mixed";

export type PresetCategory =
  | "sleep"
  | "focus"
  | "energy"
  | "relax"
  | "meditation"
  | "band";

export interface Ramp {
  from: number;
  to: number;
  min: number;
}

export interface Preset {
  id: string;
  name: string;
  cat: PresetCategory;
  sub: string;
  mod: Modality;
  carrier: number;
  beat: number;
  pulse: number | null;
  ramp: Ramp | null;
  dur: number;
  tags: string[];
  src: string[];
}

export interface AppCatalogItem {
  id: string;
  name: string;
  aliases: string[];
  platform: string[];
  oss: boolean;
  preset_access: string;
  categories: string[];
  notes: string;
}

export interface StateMapItem {
  state: string;
  preset: string;
  priority: number;
}
