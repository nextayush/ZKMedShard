// backend/src/utils/mod.rs

//! Utility module loader for ZK-MedShard backend.
//!
//! This file re-exports utility functions and constants
//! so they can be used anywhere in the backend with:
//! ```rust
//! use crate::utils::{crypto, constants};
//! ```

pub mod crypto;
pub mod constants;

// Optionally re-export for shorter imports:
pub use crypto::*;
pub use constants::*;
