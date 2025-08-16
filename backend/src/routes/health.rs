// backend/src/routes/health.rs

use actix_web::{get, HttpResponse, Responder};

/// Simple health check endpoint to verify backend is running.
#[get("/health")]
pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "ZK-MedShard Backend",
        "uptime": "prototype running"
    }))
}
