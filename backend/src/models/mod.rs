// backend/src/models/mod.rs

//! Data models for ZK-MedShard backend.
//!
//! These represent entities stored off-chain, sent to the frontend,
//! or exchanged with the blockchain layer.

pub mod medical_claim;
pub mod user;

// Optionally re-export for shorter imports
pub use medical_claim::*;
pub use user::*;
