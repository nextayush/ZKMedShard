// zk-proofs/scripts/setup.js
// Robust Groth16 setup for Windows/macOS/Linux + multiple snarkjs versions.
// It tries in order:
//  1) zkey new
//  2) groth16 setup + zkey beacon
//  3) groth16 setup + zkey contribute (non-interactive)
//
// Inputs:
//  - artifacts/claim_verification.r1cs         (run `npm run compile` first)
//  - ptau/powersOfTau28_hez_final_18.ptau
//
// Outputs:
//  - artifacts/claim_verification_final.zkey
//  - artifacts/verification_key.json

import { PATHS } from "./paths.js";
import { ensureDir, assertExists, run } from "./utils.js";

async function tryZkeyNew() {
  console.log("[setup] Trying: snarkjs zkey new");
  await run("npx", [
    "snarkjs",
    "zkey",
    "new",
    `${PATHS.r1cs}`,
    `${PATHS.ptau18}`,
    `${PATHS.zkeyFinal}`
  ]);
  console.log("[setup] zkey new: OK");
}

async function tryGroth16SetupBeacon() {
  console.log("[setup] Trying: snarkjs groth16 setup + zkey beacon");
  await run("npx", [
    "snarkjs",
    "groth16",
    "setup",
    `${PATHS.r1cs}`,
    `${PATHS.ptau18}`,
    `${PATHS.zkey0}`
  ]);

  // Deterministic beacon value (64 hex chars) + 10 rounds
  const beacon =
    "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

  await run("npx", [
    "snarkjs",
    "zkey",
    "beacon",
    `${PATHS.zkey0}`,
    `${PATHS.zkeyFinal}`,
    beacon,
    "10"
  ]);
  console.log("[setup] groth16 + beacon: OK");
}

async function tryGroth16SetupContribute() {
  console.log("[setup] Trying: snarkjs groth16 setup + zkey contribute");
  await run("npx", [
    "snarkjs",
    "groth16",
    "setup",
    `${PATHS.r1cs}`,
    `${PATHS.ptau18}`,
    `${PATHS.zkey0}`
  ]);

  // Non-interactive contribute (avoid stdin). Avoid fancy quoting on Windows.
  await run("npx", [
    "snarkjs",
    "zkey",
    "contribute",
    `${PATHS.zkey0}`,
    `${PATHS.zkeyFinal}`,
    "--name=p1",
    "-v",
    "-e",
    "seed for p1"
  ]);
  console.log("[setup] groth16 + contribute: OK");
}

async function exportVKey() {
  await run("npx", [
    "snarkjs",
    "zkey",
    "export",
    "verificationkey",
    `${PATHS.zkeyFinal}`,
    `${PATHS.vkeyJson}`
  ]);
  console.log("[setup] Exported verification key:", PATHS.vkeyJson);
}

async function main() {
  ensureDir(PATHS.artifactsDir);
  ensureDir(PATHS.ptauDir);

  assertExists(
    PATHS.r1cs,
    `Missing R1CS:\n  ${PATHS.r1cs}\nRun "npm run compile" first.`
  );
  assertExists(
    PATHS.ptau18,
    `Missing ptau:\n  ${PATHS.ptau18}\nPlace "powersOfTau28_hez_final_18.ptau" in zk-proofs/ptau/`
  );

  // Try the cascade
  let ok = false;
  try {
    await tryZkeyNew();
    ok = true;
  } catch (e1) {
    console.warn("[setup] zkey new failed, falling back:", e1?.message || e1);
    try {
      await tryGroth16SetupBeacon();
      ok = true;
    } catch (e2) {
      console.warn(
        "[setup] beacon fallback failed, trying contribute:",
        e2?.message || e2
      );
      await tryGroth16SetupContribute(); // let this throw if it fails
      ok = true;
    }
  }

  if (!ok) {
    throw new Error("All setup strategies failed");
  }

  await exportVKey();

  console.log("\n✅ Setup complete");
  console.log("  ZKey:", PATHS.zkeyFinal);
  console.log("  VKey:", PATHS.vkeyJson);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
