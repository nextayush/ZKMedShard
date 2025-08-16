// backend/src/services/mod.rs

//! Core service modules for ZK-MedShard backend.

pub mod blockchain;
pub mod storage;
pub mod zk_snark;

// Re-export for convenience
pub use blockchain::*;
pub use storage::*;
pub use zk_snark::*;
