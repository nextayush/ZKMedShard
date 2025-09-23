// Build zk-proofs/inputs/input.json with a *correct* claimHash for the circuit.
// Usage (examples):
//   node ./scripts/make-input.js \
//     --claimId 0x8b...f3 \
//     --cost 1000 --maxCovered 1500 \
//     --procCode 42 --allowedProcCode 42 \
//     --salt 987654321
//
// Notes:
// - claimId: bytes32 hex (0x... 64 hex chars) OR decimal string (treated as uint256).
// - All other args are decimal strings/ints within ranges: cost,maxCovered<2^64; codes<2^16; salt<2^128.

import fs from "fs";
import path from "path";
import { poseidon } from "circomlibjs";

// ---------- CLI parse ----------
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) {
      const key = cur.slice(2);
      const val = arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "1";
      acc.push([key, val]);
    }
    return acc;
  }, [])
);

function toBigIntDec(x) {
  if (typeof x === "bigint") return x;
  if (typeof x === "number") return BigInt(x);
  const s = String(x);
  if (s.startsWith("0x") || s.startsWith("0X")) return BigInt(s);
  return BigInt(s);
}

function splitBytes32To128Limbs(x256) {
  const mask128 = (1n << 128n) - 1n;
  const lo = x256 & mask128;
  const hi = x256 >> 128n;
  return { lo, hi };
}

function parseClaimId(s) {
  let x;
  if (!s) throw new Error("--claimId is required");
  if (s.startsWith("0x") || s.startsWith("0X")) {
    x = BigInt(s);
  } else {
    x = BigInt(s);
  }
  if (x < 0n || x >= (1n << 256n)) throw new Error("claimId out of uint256 range");
  return x;
}

// ---------- read args ----------
const claimId = parseClaimId(args.claimId || args.claimid);
const cost = toBigIntDec(args.cost ?? "1000");
const maxCovered = toBigIntDec(args.maxCovered ?? args.maxcovered ?? "1500");
const procCode = toBigIntDec(args.procCode ?? args.proccode ?? "42");
const allowedProcCode = toBigIntDec(args.allowedProcCode ?? args.allowedproccode ?? "42");
const salt = toBigIntDec(args.salt ?? "987654321");

const { lo, hi } = splitBytes32To128Limbs(claimId);

// Poseidon arity=7, order matches circuit:
// [cost, maxCovered, procCode, allowedProcCode, salt, claimId_lo, claimId_hi]
const claimHash = poseidon([cost, maxCovered, procCode, allowedProcCode, salt, lo, hi]);

// Prepare JSON matching circuit signals (all as decimal strings is fine)
const input = {
  claimId_lo: lo.toString(),
  claimId_hi: hi.toString(),
  claimHash: claimHash.toString(),      // IMPORTANT: must match circuit’s Poseidon result
  cost: cost.toString(),
  maxCovered: maxCovered.toString(),
  procCode: procCode.toString(),
  allowedProcCode: allowedProcCode.toString(),
  salt: salt.toString()
};

const inputsDir = path.join(process.cwd(), "inputs");
fs.mkdirSync(inputsDir, { recursive: true });
const outPath = path.join(inputsDir, "input.json");
fs.writeFileSync(outPath, JSON.stringify(input, null, 2));
console.log("✅ Wrote", outPath);
console.log(input);
