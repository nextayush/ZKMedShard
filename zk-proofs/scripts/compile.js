import path from "path";
import { PATHS } from "./paths.js";
import { ensureDir, assertExists, run } from "./utils.js";

async function main() {
  ensureDir(PATHS.artifactsDir);
  assertExists(PATHS.circuitFile, "Circuit file not found. Did you place claim_verification.circom?");

  // Compile with circom 2.x
  // -l node_modules lets you include circomlib/circomlibjs circuits via include
  await run("circom", [
    `"${PATHS.circuitFile}"`,
    "--r1cs",
    "--wasm",
    "--sym",
    "-l",
    "node_modules",
    "-o",
    `"${PATHS.artifactsDir}"`
  ]);

  // Sanity outputs
  console.log("\n✅ Compile done:");
  console.log(" R1CS:", PATHS.r1cs);
  console.log(" WASM:", PATHS.wasm);
  console.log("  SYM:", PATHS.sym);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
