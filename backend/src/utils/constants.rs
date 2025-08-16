// backend/src/utils/constants.rs

//! Central place for all constants used in the backend.

/// API server defaults
pub const DEFAULT_HOST: &str = "127.0.0.1";
pub const DEFAULT_PORT: u16 = 8080;

/// Blockchain connection constants
pub const SUBSTRATE_NODE_URL: &str = "ws://127.0.0.1:9944";

/// Storage constants
pub const STORAGE_BUCKET_NAME: &str = "medshard-prototype-bucket";

/// Cryptographic constants
pub const ZK_PROVING_KEY_PATH: &str = "./zk-circuits/proving_key.pk";
pub const ZK_VERIFICATION_KEY_PATH: &str = "./zk-circuits/verification_key.vk";

/// Environment variable names
pub const ENV_PRIVATE_KEY: &str = "MEDSHARD_PRIVATE_KEY";
pub const ENV_PUBLIC_KEY: &str = "MEDSHARD_PUBLIC_KEY";
pub const ENV_DATABASE_URL: &str = "DATABASE_URL";
