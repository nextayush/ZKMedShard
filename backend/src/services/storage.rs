// backend/src/services/storage.rs

//! Handles off-chain encrypted storage of medical claims.

use crate::utils::{encrypt_data, decrypt_data, generate_symmetric_key};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

static STORAGE: Lazy<Mutex<HashMap<String, (String, String, Vec<u8>)>>> = Lazy::new(|| Mutex::new(HashMap::new()));

/// Stores encrypted claim data in memory (prototype).
/// Returns a storage reference ID.
pub fn store_claim_data(claim_id: &str, claim_data: &str) -> Result<String, String> {
    let key = generate_symmetric_key();
    let (ciphertext, nonce) = encrypt_data(&key, claim_data.as_bytes())?;

    STORAGE.lock().unwrap().insert(claim_id.to_string(), (ciphertext.clone(), nonce.clone(), key.clone()));

    Ok(format!("storage://{}", claim_id))
}

/// Retrieves and decrypts claim data from memory.
pub fn retrieve_claim_data(claim_id: &str) -> Result<String, String> {
    let storage = STORAGE.lock().unwrap();
    if let Some((ciphertext, nonce, key)) = storage.get(claim_id) {
        let plaintext = decrypt_data(key, ciphertext, nonce)?;
        let result = String::from_utf8(plaintext).map_err(|e| format!("UTF-8 error: {}", e))?;
        Ok(result)
    } else {
        Err("Claim ID not found".to_string())
    }
}
