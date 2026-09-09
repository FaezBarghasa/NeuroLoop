import presets from "../src/data/presets.json";
import stateMap from "../src/data/state-map.json";
import apps from "../src/data/apps.json";
import tuning from "../src/data/tuning.json";
import { Preset, StateMapItem, AppCatalogItem } from "../src/data/types";

let errors = 0;

console.log("Validating NeuroLoop Catalog & Tuning Data...\n");

// 1. Validate Presets
const typedPresets = presets as Preset[];
const presetIds = new Set<string>();

typedPresets.forEach((p, idx) => {
  if (!p.id || typeof p.id !== "string") {
    console.error(`[Error] Preset at index ${idx} missing valid id`);
    errors++;
  }
  if (presetIds.has(p.id)) {
    console.error(`[Error] Duplicate preset id found: ${p.id}`);
    errors++;
  }
  presetIds.add(p.id);

  if (!p.name || typeof p.name !== "string") {
    console.error(`[Error] Preset ${p.id} missing name`);
    errors++;
  }
  if (!tuning.carrier_ladder.includes(p.carrier)) {
    console.warn(`[Warning] Preset ${p.id} carrier ${p.carrier}Hz is not on the A432 ladder (${tuning.carrier_ladder.join(", ")})`);
  }
  if (p.ramp && (p.ramp.from === undefined || p.ramp.to === undefined || p.ramp.min === undefined)) {
    console.error(`[Error] Preset ${p.id} has malformed ramp specification`);
    errors++;
  }
});

console.log(`Validated ${typedPresets.length} presets.`);

// 2. Validate State Map
const typedStateMap = stateMap as StateMapItem[];
typedStateMap.forEach((item) => {
  if (!presetIds.has(item.preset)) {
    console.error(`[Error] State mapping '${item.state}' refers to non-existent preset '${item.preset}'`);
    errors++;
  }
});
console.log(`Validated ${typedStateMap.length} state mappings.`);

// 3. Validate Apps Catalog
const typedApps = apps as AppCatalogItem[];
console.log(`Validated ${typedApps.length} open-source references in app catalog.`);

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log("\nAll data files validated successfully!");
}
