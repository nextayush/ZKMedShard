import path from "path";
import fs from "fs";

const root = process.cwd();

export const PATHS = {
  root,
  circuitsDir: path.join(root, "circuits"),
  inputsDir: path.join(root, "inputs"),
  artifactsDir: path.join(root, "artifacts"),
  ptauDir: path.join(root, "ptau"),

  // circuit base name (no extension)
  circuitName: "claim_verification",

  get r1cs() {
    return path.join(this.artifactsDir, `${this.circuitName}.r1cs`);
  },
  get wasmDir() {
    return path.join(this.artifactsDir, `${this.circuitName}_js`);
  },
  get wasm() {
    return path.join(this.wasmDir, `${this.circuitName}.wasm`);
  },
  get sym() {
    return path.join(this.artifactsDir, `${this.circuitName}.sym`);
  },
  get zkey0() {
    return path.join(this.artifactsDir, `${this.circuitName}_0000.zkey`);
  },
  get zkeyFinal() {
    return path.join(this.artifactsDir, `${this.circuitName}_final.zkey`);
  },
  get vkeyJson() {
    return path.join(this.artifactsDir, `verification_key.json`);
  },
  get verifierSol() {
    return path.join(this.artifactsDir, `Verifier.sol`);
  },
  get witnessWtns() {
    return path.join(this.artifactsDir, `witness.wtns`);
  },
  get proofJson() {
    return path.join(this.artifactsDir, `proof.json`);
  },
  get publicJson() {
    return path.join(this.artifactsDir, `public.json`);
  },
  get circuitFile() {
    return path.join(this.circuitsDir, `${this.circuitName}.circom`);
  },
  get inputJson() {
    return path.join(this.inputsDir, `input.json`);
  },
  get ptau18() {
    return path.join(this.ptauDir, `powersOfTau28_hez_final_18.ptau`);
  }
};

// convenience: write a default input if missing
export function writeDefaultInputIfMissing() {
  if (!fs.existsSync(PATHS.inputJson)) {
    const example = {
      claimId_lo: "123",
      claimId_hi: "0",
      claimHash: "0",
      cost: "1000",
      maxCovered: "1500",
      procCode: "42",
      allowedProcCode: "42",
      salt: "987654321"
    };
    fs.mkdirSync(PATHS.inputsDir, { recursive: true });
    fs.writeFileSync(PATHS.inputJson, JSON.stringify(example, null, 2));
  }
}
