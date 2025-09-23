// zk-proofs/scripts/prove.js
// Generates witness + Groth16 proof without using generate_witness.js (CJS).
// Uses: npx snarkjs wtns calculate <wasm> <input> <witness>

import fs from "fs";
import { PATHS, writeDefaultInputIfMissing } from "./paths.js";
import { ensureDir, assertExists, run } from "./utils.js";

async function main() {
  writeDefaultInputIfMissing();
  ensureDir(PATHS.artifactsDir);

  assertExists(PATHS.wasm, "Missing WASM. Run: npm run compile");
  assertExists(PATHS.zkeyFinal, "Missing final zkey. Run: npm run setup");
  assertExists(PATHS.inputJson, "Missing inputs/input.json");

  // 1) Build witness via snarkjs CLI (works with ESM projects)
  await run("npx", [
    "snarkjs",
    "wtns",
    "calculate",
    `"${PATHS.wasm}"`,
    `"${PATHS.inputJson}"`,
    `"${PATHS.witnessWtns}"`
  ]);

  // 2) Produce proof + public signals
  await run("npx", [
    "snarkjs",
    "groth16",
    "prove",
    `"${PATHS.zkeyFinal}"`,
    `"${PATHS.witnessWtns}"`,
    `"${PATHS.proofJson}"`,
    `"${PATHS.publicJson}"`
  ]);

  // Pretty print public signals
  const publicSignals = JSON.parse(fs.readFileSync(PATHS.publicJson));
  console.log("\npublicSignals (order): [claimId_lo, claimId_hi, claimHash, isValid]");
  console.log(publicSignals);
  console.log("\n✅ Proof generated:");
  console.log(" proof:", PATHS.proofJson);
  console.log(" public:", PATHS.publicJson);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
