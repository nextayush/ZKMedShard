import { PATHS } from "./paths.js";
import { assertExists, run } from "./utils.js";

async function main() {
  assertExists(PATHS.zkeyFinal, "Missing final zkey. Run: npm run setup");

  await run("npx", [
    "snarkjs",
    "zkey",
    "export",
    "solidityverifier",
    `"${PATHS.zkeyFinal}"`,
    `"${PATHS.verifierSol}"`
  ]);

  console.log("\n✅ Exported Solidity verifier:");
  console.log(" ", PATHS.verifierSol);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
