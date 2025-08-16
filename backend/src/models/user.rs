// backend/src/models/user.rs

use serde::{Serialize, Deserialize};

/// Represents a user in the system (patient or healthcare provider).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique identifier (UUID or blockchain address)
    pub user_id: String,

    /// Role in the system ("patient" or "provider")
    pub role: String,

    /// Public key for encrypting communication or data
    pub public_key: String,

    /// Optional name for display purposes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,

    /// Optional healthcare institution or organization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization: Option<String>,
}
