import { expect } from "chai";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

function toU256(x: string): bigint {
  return x.startsWith("0x") || x.startsWith("0X") ? BigInt(x) : BigInt(x);
}

function bytes32FromLimbs(hi: string | bigint, lo: string | bigint): `0x${string}` {
  const H = typeof hi === "string" ? toU256(hi) : hi;
  const L = typeof lo === "string" ? toU256(lo) : lo;
  const v = (H << 128n) | L;
  return ("0x" + v.toString(16).padStart(64, "0")) as `0x${string}`;
}

// Map snarkjs pi_b into Solidity [[b01,b00],[b11,b10]]
function mapSnarkjsBToSolidity(b: string[][]): [[bigint, bigint], [bigint, bigint]] {
  return [
    [toU256(b[0][1]), toU256(b[0][0])],
    [toU256(b[1][1]), toU256(b[1][0])]
  ];
}

describe("MedShard — e2e with real proof", function () {
  const ZK_DIR = path.join(__dirname, "..", "..", "zk-proofs");
  const PUBLIC_PATH = path.join(ZK_DIR, "artifacts", "public.json");
  const PROOF_PATH  = path.join(ZK_DIR, "artifacts", "proof.json");

  it("submits a valid claim, persists state, and prevents replay", async () => {
    // Load public signals and proof
    const publicSignals: string[] = JSON.parse(fs.readFileSync(PUBLIC_PATH, "utf8"));
    expect(publicSignals.length).to.eq(4, "publicSignals must have 4 elements");

    const claimId_lo = publicSignals[0];
    const claimId_hi = publicSignals[1];
    const claimHash  = publicSignals[2];
    const isValid    = publicSignals[3];
    expect(isValid).to.eq("1", "Your test proof should have isValid == 1");

    const proofJson = JSON.parse(fs.readFileSync(PROOF_PATH, "utf8"));

    // Convert into plain arrays, ready for the contract call
    const a: [bigint, bigint] = [toU256(proofJson.pi_a[0]), toU256(proofJson.pi_a[1])];
    const b = mapSnarkjsBToSolidity(proofJson.pi_b);
    const c: [bigint, bigint] = [toU256(proofJson.pi_c[0]), toU256(proofJson.pi_c[1])];
    const psFixed = [
      toU256(publicSignals[0]),
      toU256(publicSignals[1]),
      toU256(publicSignals[2]),
      toU256(publicSignals[3]),
    ];

    const claimId = bytes32FromLimbs(claimId_hi, claimId_lo);

    // Deploy verifier + MedShard
    const [deployer] = await ethers.getSigners();
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddr = await verifier.getAddress();

    const MedShard = await ethers.getContractFactory("MedShard");
    const med = await MedShard.deploy(verifierAddr, deployer.address);
    await med.waitForDeployment();

    // Submit valid claim
    await expect(
      med.submitClaim(claimId, toU256(claimHash), a, b, c, psFixed)
    ).to.emit(med, "ClaimSubmitted");

    // Storage check
    const stored = await med.getClaim(claimId);
    expect(stored.submitter).to.eq(deployer.address);
    expect(stored.claimHash).to.eq(toU256(claimHash));
    expect(stored.verified).to.eq(true);
    expect(stored.submittedAt).to.be.gt(0);

    // Replay should revert
    try {
      await med.submitClaim(claimId, toU256(claimHash), a, b, c, psFixed);
      expect.fail("The replay transaction did not revert as expected.");
    } catch (error: any) {
      expect(error.message).to.contain("AlreadySubmitted");
    }

    // Limb mismatch should revert
    const badClaimId = ((): `0x${string}` => {
      const lo = (toU256(claimId_lo) ^ 1n) & ((1n << 128n) - 1n);
      return bytes32FromLimbs(claimId_hi, lo);
    })();
    try {
      await med.submitClaim(badClaimId, toU256(claimHash), a, b, c, psFixed);
      expect.fail("The limb mismatch transaction did not revert as expected.");
    } catch (error: any) {
      expect(error.message).to.contain("LimbMismatch");
    }

    // Wrong length should cause a client-side error
    try {
      await (med as any).submitClaim(claimId, toU256(claimHash), a, b, c, [1n, 2n]);
      expect.fail("The wrong length transaction did not revert as expected.");
    } catch (error: any) {
      expect(error.message).to.contain("array is wrong length");
    }

    // Pause/unpause
    await med.setPaused(true);
    const newClaimIdForPauseTest = bytes32FromLimbs(claimId_hi, (toU256(claimId_lo) + 2n) & ((1n << 128n) - 1n));
    try {
      await med.submitClaim(newClaimIdForPauseTest, toU256(claimHash), a, b, c, psFixed);
      expect.fail("The paused transaction did not revert as expected.");
    } catch(error: any) {
      expect(error.message).to.contain("Paused");
    }
    await med.setPaused(false);
  });
});

