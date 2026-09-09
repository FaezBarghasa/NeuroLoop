import tuningData from "./tuning.json";
import { Preset, PresetCategory } from "./types";

export interface TuningConfig {
  tuning_standard: string;
  base_frequency: number;
  carrier_ladder: number[];
  category_mapping: Record<PresetCategory | string, number>;
  tag_mapping: Record<string, number>;
}

export const A432_CONFIG: TuningConfig = tuningData as TuningConfig;

/**
 * Snaps any given frequency to the closest frequency on the A432 harmonic ladder.
 */
export function snapToA432Ladder(freq: number): number {
  const ladder = A432_CONFIG.carrier_ladder;
  let closest = ladder[0];
  let minDiff = Math.abs(freq - closest);

  for (const step of ladder) {
    const diff = Math.abs(freq - step);
    if (diff < minDiff) {
      minDiff = diff;
      closest = step;
    }
  }
  return closest;
}

/**
 * Resolves the ideal A432 carrier frequency for a preset based on its category and tags.
 */
export function resolveA432Carrier(preset: Pick<Preset, "cat" | "tags" | "carrier">): number {
  // 1. Tag specific overrides (gamma -> 432, delta -> 108, theta -> 144, etc.)
  if (preset.tags.includes("gamma")) return 432.0;
  if (preset.tags.includes("delta") || preset.tags.includes("deep")) return 108.0;
  if (preset.tags.includes("theta")) return 144.0;
  if (preset.tags.includes("beta")) return 324.0;
  if (preset.tags.includes("alpha") || preset.tags.includes("smr")) return 216.0;

  // 2. Category mapping
  if (A432_CONFIG.category_mapping[preset.cat]) {
    return A432_CONFIG.category_mapping[preset.cat];
  }

  // 3. Fallback: snap existing carrier to ladder
  return snapToA432Ladder(preset.carrier);
}
