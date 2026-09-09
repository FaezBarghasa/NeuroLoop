import presets from "../src/data/presets.json";
import stateMap from "../src/data/state-map.json";
import tuning from "../src/data/tuning.json";

console.log(`NeuroLoop Seed Summary:`);
console.log(`- Presets: ${(presets as unknown[]).length}`);
console.log(`- State mappings: ${(stateMap as unknown[]).length}`);
console.log(`- Tuning standard: ${tuning.tuning_standard} (${tuning.base_frequency}Hz base)`);
console.log(`- Carrier Ladder: ${tuning.carrier_ladder.join("Hz, ")}Hz`);
console.log(`Ready for runtime initialization.`);
