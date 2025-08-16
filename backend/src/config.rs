// backend/src/config.rs

//! Configuration loader for ZK-MedShard backend.
//!
//! Reads environment variables and falls back to default constants.

use std::env;
use crate::utils::constants::*;

#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub substrate_url: String,
    pub database_url: String,
    pub private_key: String,
    pub public_key: String,
    pub zk_proving_key_path: String,
    pub zk_verification_key_path: String,
}

impl Config {
    /// Loads configuration from environment variables or uses defaults.
    pub fn from_env() -> Self {
        dotenv::dotenv().ok(); // Load from `.env` if available

        Self {
            host: env::var("HOST").unwrap_or_else(|_| DEFAULT_HOST.to_string()),
            port: env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(DEFAULT_PORT),
            substrate_url: env::var("SUBSTRATE_NODE_URL").unwrap_or_else(|_| SUBSTRATE_NODE_URL.to_string()),
            database_url: env::var(ENV_DATABASE_URL).unwrap_or_else(|_| "postgres://localhost/medshard".to_string()),
            private_key: env::var(ENV_PRIVATE_KEY).unwrap_or_else(|_| "dev_private_key".to_string()),
            public_key: env::var(ENV_PUBLIC_KEY).unwrap_or_else(|_| "dev_public_key".to_string()),
            zk_proving_key_path: env::var("ZK_PROVING_KEY_PATH").unwrap_or_else(|_| ZK_PROVING_KEY_PATH.to_string()),
            zk_verification_key_path: env::var("ZK_VERIFICATION_KEY_PATH").unwrap_or_else(|_| ZK_VERIFICATION_KEY_PATH.to_string()),
        }
    }
}
