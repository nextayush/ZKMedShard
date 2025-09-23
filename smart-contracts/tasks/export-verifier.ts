import { task } from "hardhat/config";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { spawn } from "child_process";

/**
 * hardhat verifier:export
 *   --zkey ../zk-proofs/artifacts/claim_verification_final.zkey
 *   --out  contracts/Verifier.sol
 *
 * Example:
 *   npx hardhat verifier:export \
 *     --zkey ../zk-proofs/artifacts/claim_verification_final.zkey \
 *     --out contracts/Verifier.sol
 */
task("verifier:export", "Export Verifier.sol from a .zkey")
  .addParam("zkey", "Path to the final zkey (e.g. ../zk-proofs/artifacts/claim_verification_final.zkey)")
  .addParam("out", "Output path for Verifier.sol (e.g. contracts/Verifier.sol)")
  .setAction(async ({ zkey, out }, hre) => {
    const cwd = process.cwd();

    const zkeyAbs = path.isAbsolute(zkey) ? zkey : path.join(cwd, zkey);
    const outAbs  = path.isAbsolute(out)  ? out  : path.join(cwd, out);

    if (!existsSync(zkeyAbs)) {
      throw new Error(`zkey not found at:\n  ${zkeyAbs}\nRun "npm run setup" in zk-proofs first.`);
    }

    const outDir = path.dirname(outAbs);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    console.log(`[verifier:export] Exporting Solidity verifier…`);
    console.log(`  zkey: ${zkeyAbs}`);
    console.log(`  out : ${outAbs}`);

    await runCmd("npx", ["snarkjs", "zkey", "export", "solidityverifier", zkeyAbs, outAbs], cwd);

    console.log(`[verifier:export] Wrote: ${outAbs}`);
  });

function runCmd(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, cwd });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`))));
  });
}
