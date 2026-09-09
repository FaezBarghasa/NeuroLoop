import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import presets from "../src/data/presets.json";
import { resolveA432Carrier } from "../src/data/tuning";
import { Preset } from "../src/data/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const presetsFilePath = path.join(__dirname, "../src/data/presets.json");

const typedPresets = presets as Preset[];
let retunedCount = 0;

const updatedPresets = typedPresets.map((preset) => {
  const idealCarrier = resolveA432Carrier(preset);
  if (preset.carrier !== idealCarrier) {
    retunedCount++;
    console.log(`Retuned [${preset.id}] from ${preset.carrier}Hz -> ${idealCarrier}Hz`);
    return {
      ...preset,
      carrier: idealCarrier,
    };
  }
  return preset;
});

fs.writeFileSync(presetsFilePath, JSON.stringify(updatedPresets, null, 2) + "\n", "utf8");
console.log(`\nSuccessfully retuned ${retunedCount} presets to the A432 harmonic ladder.`);
