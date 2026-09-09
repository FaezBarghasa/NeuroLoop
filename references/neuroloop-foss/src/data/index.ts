import apps from "./apps.json";
import presets from "./presets.json";
import stateMap from "./state-map.json";
import type {
  AppCatalogItem,
  Preset,
  StateMapItem,
} from "./types";

export const appCatalog = apps as AppCatalogItem[];
export const presetCatalog = presets as Preset[];
export const statePresetMap = stateMap as StateMapItem[];

export function getPresetById(id: string): Preset | undefined {
  return presetCatalog.find(p => p.id === id);
}

export function getPresetsByCategory(cat: Preset["cat"]): Preset[] {
  return presetCatalog.filter(p => p.cat === cat);
}

export function getBestPresetForState(state: string): Preset | undefined {
  const candidates = statePresetMap
    .filter(s => s.state === state)
    .sort((a, b) => b.priority - a.priority);

  const best = candidates[0];
  if (!best) return undefined;

  return getPresetById(best.preset);
}
