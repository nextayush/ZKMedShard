// backend/src/utils/crypto.rs

//! Crypto utilities for encryption, decryption, and hashing in ZK-MedShard.

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce // Or `Aes128Gcm`
};
use rand::RngCore;
use sha2::{Sha256, Digest};
use base64::{encode as b64_encode, decode as b64_decode};

/// Generates a random 256-bit key for AES-GCM encryption.
pub fn generate_symmetric_key() -> Vec<u8> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

/// Encrypt data using AES-256-GCM.
/// Returns base64-encoded ciphertext and nonce.
pub fn encrypt_data(key: &[u8], plaintext: &[u8]) -> Result<(String, String), String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("Cipher init failed: {}", e))?;

    let nonce_bytes = {
        let mut nonce = [0u8; 12];
        OsRng.fill_bytes(&mut nonce);
        nonce
    };
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, plaintext)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    Ok((b64_encode(&ciphertext), b64_encode(&nonce_bytes)))
}

/// Decrypt data using AES-256-GCM.
pub fn decrypt_data(key: &[u8], ciphertext_b64: &str, nonce_b64: &str) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("Cipher init failed: {}", e))?;

    let nonce_bytes = b64_decode(nonce_b64).map_err(|e| format!("Base64 decode failed: {}", e))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = b64_decode(ciphertext_b64).map_err(|e| format!("Base64 decode failed: {}", e))?;

    cipher.decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| format!("Decryption failed: {}", e))
}

/// Computes SHA-256 hash of the input data and returns as hex string.
pub fn sha256_hex(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    hex::encode(result)
}
