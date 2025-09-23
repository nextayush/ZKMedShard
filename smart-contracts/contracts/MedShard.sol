// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata publicSignals
    ) external view returns (bool);
}

contract MedShard {
    // --------------------
    // Events & Errors
    // --------------------
    event ClaimSubmitted(
        bytes32 indexed claimId,
        uint256 claimHash,
        bool verified,
        address indexed submitter,
        uint64 submittedAt
    );

    error AlreadySubmitted(bytes32 claimId);
    error LimbMismatch();
    error BadSignalsLength();
    error PolicyNotSatisfied();
    error Paused();
    error NotOwner();

    // --------------------
    // Storage
    // --------------------
    struct Claim {
        address submitter;
        uint256 claimHash;
        bool verified;
        uint64 submittedAt;
    }

    mapping(bytes32 => Claim) public claims;

    IVerifier public verifier;
    address public owner;
    bool public paused;

    // --------------------
    // Constructor
    // --------------------
    constructor(address _verifier, address _owner) {
        verifier = IVerifier(_verifier);
        owner = _owner;
        paused = false;
    }

    // --------------------
    // Modifiers
    // --------------------
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier notPaused() {
        if (paused) revert Paused();
        _;
    }

    // --------------------
    // Owner controls
    // --------------------
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // --------------------
    // Main logic
    // --------------------
    function submitClaim(
        bytes32 claimId,
        uint256 claimHash,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata publicSignals
    ) external notPaused {
        // replay protection
        if (claims[claimId].submitter != address(0)) {
            revert AlreadySubmitted(claimId);
        }

        // reconstruct claimId from limbs
        uint256 lo = publicSignals[0];
        uint256 hi = publicSignals[1];
        bytes32 reconstructed = bytes32((uint256(hi) << 128) | lo);
        if (reconstructed != claimId) {
            revert LimbMismatch();
        }

        // verify proof on-chain
        bool ok = verifier.verifyProof(a, b, c, publicSignals);
        if (!ok) {
            revert PolicyNotSatisfied();
        }

        // store claim
        claims[claimId] = Claim({
            submitter: msg.sender,
            claimHash: claimHash,
            verified: true,
            submittedAt: uint64(block.timestamp)
        });

        emit ClaimSubmitted(claimId, claimHash, true, msg.sender, uint64(block.timestamp));
    }

    // --------------------
    // View helpers
    // --------------------
    function getClaim(bytes32 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }
}
