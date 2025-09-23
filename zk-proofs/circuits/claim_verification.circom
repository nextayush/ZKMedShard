// ------------------------------------------------------------
// ZKMedShard — ClaimVerification (Circom 2.2.2)
// Public signals (by output order): [claimId_lo, claimId_hi, claimHash, isValid]
// ------------------------------------------------------------
pragma circom 2.2.2;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

// ---------- LessEq(NBITS): a <= b via a < (b + 1), ripple-carry, no overflow
template LessEq(NBITS) {
    signal input a;
    signal input b;
    signal output out;  // boolean

    component aBits = Num2Bits(NBITS); aBits.in <== a;
    component bBits = Num2Bits(NBITS); bBits.in <== b;

    signal carry[NBITS + 1];
    signal bPlus1Bits[NBITS];
    carry[0] <== 1;

    for (var j = 0; j < NBITS; j++) {
        bPlus1Bits[j] <== bBits.out[j] + carry[j] - 2*bBits.out[j]*carry[j]; // XOR
        carry[j + 1]   <== bBits.out[j] * carry[j];                           // AND
        bPlus1Bits[j] * (bPlus1Bits[j] - 1) === 0;                            // booleanize
    }

    carry[NBITS] === 0; // forbid overflow

    signal partial[NBITS + 1];
    partial[0] <== 0;

    var pow2 = 1;
    for (var k = 0; k < NBITS; k++) {
        partial[k + 1] <== partial[k] + bPlus1Bits[k] * pow2;
        pow2 = pow2 * 2;
    }

    component lt = LessThan(NBITS);
    lt.in[0] <== a;
    lt.in[1] <== partial[NBITS];

    out <== lt.out;
    out * (out - 1) === 0;
}

// ---------- ClaimVerification
template ClaimVerification(NBITS_COST, NBITS_CODE, NBITS_SALT, NBITS_ID_LIMB) {
    // Inputs
    signal input  claimId_lo_in;     // uint128 (input)
    signal input  claimId_hi_in;     // uint128 (input)
    signal input  cost;              // uint64
    signal input  maxCovered;        // uint64
    signal input  procCode;          // uint16
    signal input  allowedProcCode;   // uint16
    signal input  salt;              // uint128

    // Outputs (these become public signals in this exact order)
    signal output claimId_lo;        // will mirror claimId_lo_in
    signal output claimId_hi;        // will mirror claimId_hi_in
    signal output claimHash;         // Poseidon commitment
    signal output isValid;           // 0/1

    // Bind outputs to inputs for public exposure of claimId limbs
    claimId_lo <== claimId_lo_in;
    claimId_hi <== claimId_hi_in;

    // Range checks
    component rcCost = Num2Bits(NBITS_COST);     rcCost.in  <== cost;
    component rcMax  = Num2Bits(NBITS_COST);     rcMax.in   <== maxCovered;
    component rcProc = Num2Bits(NBITS_CODE);     rcProc.in  <== procCode;
    component rcAllow= Num2Bits(NBITS_CODE);     rcAllow.in <== allowedProcCode;
    component rcSalt = Num2Bits(NBITS_SALT);     rcSalt.in  <== salt;
    component rcIdLo = Num2Bits(NBITS_ID_LIMB);  rcIdLo.in  <== claimId_lo_in;
    component rcIdHi = Num2Bits(NBITS_ID_LIMB);  rcIdHi.in  <== claimId_hi_in;

    // Policy 1: procCode == allowedProcCode (IsZero from circomlib)
    component eqCode = IsZero();
    eqCode.in <== procCode - allowedProcCode;
    signal codeOk; codeOk <== eqCode.out; codeOk * (codeOk - 1) === 0;

    // Policy 2: cost <= maxCovered
    component leCost = LessEq(NBITS_COST);
    leCost.a <== cost;
    leCost.b <== maxCovered;
    signal costOk; costOk <== leCost.out; costOk * (costOk - 1) === 0;

    // Commitment binding
    component H = Poseidon(7);
    H.inputs[0] <== cost;
    H.inputs[1] <== maxCovered;
    H.inputs[2] <== procCode;
    H.inputs[3] <== allowedProcCode;
    H.inputs[4] <== salt;
    H.inputs[5] <== claimId_lo_in;
    H.inputs[6] <== claimId_hi_in;
    claimHash <== H.out;

    // Final
    signal allOk; allOk <== codeOk * costOk;
    isValid <== allOk;
    isValid * (isValid - 1) === 0;
}

// Instantiate
component main = ClaimVerification(64, 16, 128, 128);
