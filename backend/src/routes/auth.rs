use std::str::FromStr;

use axum::{
    extract::Extension,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use chrono::{Duration, Utc};
use mongodb::{
    bson::{doc, to_document}, 
    Database
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use tracing::{error, info, warn}; 
use jsonwebtoken::{encode, EncodingKey, Header};

use ethers::core::{types::{ Signature, H256}, utils::hash_message};

use crate::middleware::jwt::Claims;

/// Nonce document stored in MongoDB
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NonceDoc {
    pub address: String,
    pub nonce: String,
    pub created_at: chrono::DateTime<Utc>,
}

/// Request to get a nonce
#[derive(Debug, Deserialize)]
pub struct NonceRequest {
    pub address: String,
}

/// Response with nonce
#[derive(Debug, Serialize)]
pub struct NonceResponse {
    pub nonce: String,
}

/// Login request (address + signature)
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub address: String,
    pub signature: String,
}

/// Login response with JWT token
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
}

/// Build the auth router
pub fn router() -> Router {
    Router::new()
        .route("/nonce", post(get_nonce))
        .route("/login", post(login))
        .route("/verify", post(login)) 
}

/// POST /auth/nonce
/// Creates (or upserts) a nonce for the given address and returns it.
async fn get_nonce(
    Extension(db): Extension<Database>,
    Json(req): Json<NonceRequest>,
) -> Result<Json<NonceResponse>, (StatusCode, String)> {
    let nonces = db.collection::<NonceDoc>("nonces");

    // Generate a 6-digit random nonce (string)
    let nonce: u64 = rand::thread_rng().gen_range(100_000..999_999);
    let nonce_str = nonce.to_string();

    let doc = NonceDoc {
        address: req.address.clone(),
        nonce: nonce_str.clone(),
        created_at: Utc::now(),
    };

    // Upsert the nonce document (filter by address)
    let filter = doc! { "address": &req.address };
    let update = doc! { "$set": to_document(&doc).map_err(|e| {
        error!("to_document error: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Serialization error".to_string())
    })? };

    // --- FIX: Use builder pattern for upsert (MongoDB v2+ syntax) ---
    match nonces.update_one(filter, update).upsert(true).await {
        Ok(_) => Ok(Json(NonceResponse { nonce: nonce_str })),
        Err(err) => {
            error!("Failed to upsert nonce: {:?}", err);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "DB error".into()))
        }
    }
}

/// POST /auth/login
/// Verifies a signature over the nonce and issues a JWT on success.
async fn login(
    Extension(db): Extension<Database>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, String)> {
    let nonces = db.collection::<NonceDoc>("nonces");

    // Find the nonce for this address
    let filter = doc! { "address": &req.address };
    // --- FIX: Removed `None` argument ---
    let nonce_doc_opt = match nonces.find_one(filter.clone()).await {
        Ok(opt) => opt,
        Err(err) => {
            error!("DB find_one error: {:?}", err);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "DB error".into()));
        }
    };

    let nonce_doc = match nonce_doc_opt {
        Some(nd) => nd,
        None => {
            // Log specific error to terminal
            warn!("⚠️ Login failed: Nonce not found for address {}", req.address);
            return Err((StatusCode::UNAUTHORIZED, "Nonce not found. Please request a new nonce.".into()));
        }
    };

    // Check expiry (5 minutes)
    if nonce_doc.created_at < Utc::now() - Duration::minutes(5) {
        // --- FIX: Removed `None` argument ---
        let _ = nonces.delete_one(doc! { "address": &req.address }).await;
        warn!("⚠️ Login failed: Nonce expired for address {}", req.address);
        return Err((StatusCode::UNAUTHORIZED, "Nonce expired".into()));
    }

    // Verify signature
    let message_to_verify = format!("Sign this message to login to ZKMedShard: {}", nonce_doc.nonce);

    info!("Verifying signature for address: {}", req.address);

    let recovered_addr = match verify_signature_recover(&message_to_verify, &req.signature) {
        Ok(addr) => addr,
        Err(e) => {
            error!("Signature verification failed: {:?}", e);
            return Err((StatusCode::UNAUTHORIZED, "Invalid signature format".into()));
        }
    };

    // Normalize and compare addresses (case-insensitive)
    if !eq_addr_case_insensitive(&recovered_addr, &req.address) {
        error!("❌ SIGNATURE MISMATCH!");
        error!("   Client claimed to be: {}", req.address);
        error!("   Recovered signer was: {}", recovered_addr);
        error!("   Message verified: '{}'", message_to_verify);
        return Err((StatusCode::UNAUTHORIZED, "Signature does not match address".into()));
    }

    // Delete nonce after successful use
    // --- FIX: Removed `None` argument ---
    if let Err(err) = nonces.delete_one(doc! { "address": &req.address }).await {
        error!("Failed to delete nonce: {:?}", err);
    }

    // Create JWT
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(12))
        .unwrap()
        .timestamp() as usize;

    let claims = Claims {
        sub: req.address.clone(),
        exp: expiration,
    };

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret".into());
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|e| {
        error!("JWT encode error: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "JWT error".into())
    })?;

    Ok(Json(LoginResponse { token }))
}

/// Recover address from a plaintext message and a hex signature.
fn verify_signature_recover(msg: &str, sig_hex: &str) -> Result<String, String> {
    let msg_hash: H256 = hash_message(msg);
    let sig = Signature::from_str(sig_hex).map_err(|e| format!("sig parse error: {:?}", e))?;
    let recovered = sig.recover(msg_hash).map_err(|e| format!("recover error: {:?}", e))?;
    Ok(format!("{:?}", recovered))
}

/// Compare two addresses case-insensitively (accepts 0x prefix or not).
fn eq_addr_case_insensitive(a_hex: &str, b_hex: &str) -> bool {
    let a = a_hex.trim_start_matches("0x").to_ascii_lowercase();
    let b = b_hex.trim_start_matches("0x").to_ascii_lowercase();
    a == b
}