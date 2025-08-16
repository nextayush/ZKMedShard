// backend/src/models/medical_claim.rs

use serde::{Serialize, Deserialize};

/// Represents a verifiable medical claim.
/// This is *not* the entire medical record — only the claim being proved.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicalClaim {
    /// Unique identifier for the claim
    pub claim_id: String,

    /// Type of claim (e.g., "vaccination_status", "allergy", "diagnosis")
    pub claim_type: String,

    /// The actual claim data (encrypted if stored off-chain)
    pub claim_data: String,

    /// ZK proof generated to verify this claim without revealing data
    pub zk_proof: String,

    /// Blockchain transaction hash where proof verification was recorded
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tx_hash: Option<String>,

    /// Timestamp of when the claim was created
    pub created_at: String,
}
