import { PATHS } from "./paths.js";
import { assertExists, run } from "./utils.js";

async function main() {
  assertExists(PATHS.vkeyJson, "Missing verification key. Run: npm run setup");
  assertExists(PATHS.publicJson, "Missing public.json. Run: npm run prove");
  assertExists(PATHS.proofJson, "Missing proof.json. Run: npm run prove");

  await run("npx", [
    "snarkjs",
    "groth16",
    "verify",
    `"${PATHS.vkeyJson}"`,
    `"${PATHS.publicJson}"`,
    `"${PATHS.proofJson}"`
  ]);

  console.log("\n✅ Local verification succeeded.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
