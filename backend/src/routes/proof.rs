use actix_web::{get, post, web, HttpResponse, Responder};
use crate::models::MedicalClaim;
use crate::utils::sha256_hex;
use crate::services::{zk_snark, blockchain};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ProofVerificationRequest {
    pub claim_id: String,
    pub zk_proof: String,
}

/// Submit a new medical claim with proof.
/// Stores claim hash off-chain (prototype) and returns it.
#[post("/claim/submit")]
pub async fn submit_claim(claim: web::Json<MedicalClaim>) -> impl Responder {
    println!("[Backend] Received claim: {:?}", claim.claim_id);

    // Store only hash of claim data for privacy
    let claim_hash = sha256_hex(claim.claim_data.as_bytes());

    HttpResponse::Ok().json(serde_json::json!({
        "status": "claim_submitted",
        "claim_id": claim.claim_id,
        "hash": claim_hash
    }))
}

/// Verify a medical claim proof and record result on-chain.
#[post("/claim/verify")]
pub async fn verify_claim(req: web::Json<ProofVerificationRequest>) -> impl Responder {
    println!("[Backend] Verifying proof for claim: {}", req.claim_id);

    // Step 1: Prototype proof verification
    let valid = zk_snark::verify_proof(&req.zk_proof).unwrap_or(false);

    // Step 2: Record result on blockchain
    let mut tx_hash = None;
    if valid {
        match blockchain::record_claim_on_chain(&req.claim_id, true).await {
            Ok(hash) => tx_hash = Some(hash),
            Err(e) => {
                eprintln!("[Error] Blockchain write failed: {}", e);
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "status": "error",
                    "message": "Blockchain recording failed"
                }));
            }
        }
    }

    // Step 3: Return verification result
    if valid {
        HttpResponse::Ok().json(serde_json::json!({
            "status": "verified",
            "claim_id": req.claim_id,
            "blockchain_tx": tx_hash
        }))
    } else {
        HttpResponse::BadRequest().json(serde_json::json!({
            "status": "invalid_proof",
            "claim_id": req.claim_id
        }))
    }
}

/// Get the on-chain verification status of a claim.
#[get("/claim/status/{claim_id}")]
pub async fn get_claim_status(path: web::Path<String>) -> impl Responder {
    let claim_id = path.into_inner();
    println!("[Backend] Fetching claim status from blockchain: {}", claim_id);

    match blockchain::get_claim_status(&claim_id).await {
        Ok(status) => HttpResponse::Ok().json(serde_json::json!({
            "claim_id": claim_id,
            "verified": status
        })),
        Err(e) => {
            eprintln!("[Error] Blockchain query failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": "Failed to fetch claim status"
            }))
        }
    }
}
