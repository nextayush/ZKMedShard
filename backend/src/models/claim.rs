use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use mongodb::bson::oid::ObjectId;

/// Representation of a claim document in MongoDB.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claim {
    /// MongoDB document ID
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,

    /// Claim identifier (bytes32, hex string)
    pub claim_id: String,

    /// Hash of the claim (e.g. keccak256)
    pub claim_hash: String,

    /// Ethereum wallet address of the submitter
    pub submitter: String,

    /// Whether the proof was verified on-chain
    pub verified: bool,

    /// When the claim was submitted
    pub submitted_at: DateTime<Utc>,
}
