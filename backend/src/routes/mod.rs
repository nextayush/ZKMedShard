// backend/src/routes/mod.rs

//! API route module for ZK-MedShard backend.
//!
//! All HTTP endpoints are registered here.

pub mod proof;
pub mod health;

use actix_web::web;

/// Registers all routes into the Actix-web app.
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg
        // Health check route
        .service(health::health_check)
        // Claim submission route
        .service(proof::submit_claim)
        // Claim verification route (records result on-chain)
        .service(proof::verify_claim)
        // On-chain claim status route
        .service(proof::get_claim_status);
}
