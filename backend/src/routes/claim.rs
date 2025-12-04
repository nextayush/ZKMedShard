use axum::{
    extract::Extension,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use futures_util::stream::StreamExt; // use next().await
use mongodb::bson::doc;
use mongodb::Database;
use serde::{Deserialize, Serialize};
use tracing::error;

use crate::middleware::jwt::AuthUser;
use crate::models::claim::Claim; // Ensure this path matches your project structure

#[derive(Debug, Deserialize)]
pub struct ProveAndSubmitRequest {
    pub claim_id: String,
    pub claim_hash: String,
    pub proof: serde_json::Value,
    pub public_signals: serde_json::Value,
}

// NEW: Request struct for verification
#[derive(Debug, Deserialize)]
pub struct VerifyHashRequest {
    pub claim_hash: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

pub fn router() -> Router {
    Router::new()
        .route("/prove-and-submit", post(prove_and_submit))
        .route("/list", get(list_claims))
        .route("/verify-hash", post(verify_claim_by_hash)) // NEW ROUTE
}

async fn prove_and_submit(
    Extension(db): Extension<Database>,
    AuthUser(user): AuthUser,
    Json(body): Json<ProveAndSubmitRequest>,
) -> Json<ApiResponse<()>> {
    let claims = db.collection::<Claim>("claims");

    let new_claim = Claim {
        id: None,
        claim_id: body.claim_id.clone(),
        claim_hash: body.claim_hash.clone(),
        submitter: user.sub.clone(),
        verified: true,
        submitted_at: Utc::now(),
    };

    // Using insert_one without options (assuming mongodb driver v2+)
    match claims.insert_one(new_claim).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            message: "Claim submitted successfully".into(),
            data: None,
        }),
        Err(err) => {
            error!("DB insert error: {:?}", err);
            Json(ApiResponse {
                success: false,
                message: "Failed to store claim".into(),
                data: None,
            })
        }
    }
}

/// List claims submitted by the authenticated user
async fn list_claims(
    Extension(db): Extension<Database>,
    AuthUser(user): AuthUser,
) -> Json<ApiResponse<Vec<Claim>>> {
    let claims_col = db.collection::<Claim>("claims");

    let filter = doc! { "submitter": &user.sub };

    // Using find without options (assuming mongodb driver v2+)
    let mut cursor = match claims_col.find(filter).await {
        Ok(c) => c,
        Err(err) => {
            error!("DB find error: {:?}", err);
            return Json(ApiResponse {
                success: false,
                message: "DB error".into(),
                data: None,
            });
        }
    };

    let mut items: Vec<Claim> = Vec::new();
    while let Some(doc) = cursor.next().await {
        match doc {
            Ok(d) => items.push(d),
            Err(err) => {
                error!("cursor error: {:?}", err);
                return Json(ApiResponse {
                    success: false,
                    message: "DB cursor error".into(),
                    data: None,
                });
            }
        }
    }

    Json(ApiResponse {
        success: true,
        message: "ok".into(),
        data: Some(items),
    })
}

// NEW: Doctor's Verification Logic
// We require AuthUser so only logged-in users (doctors) can verify, 
// but we do NOT filter the DB query by user.sub. We search globally.
async fn verify_claim_by_hash(
    Extension(db): Extension<Database>,
    AuthUser(_user): AuthUser, // Ensure user is logged in
    Json(body): Json<VerifyHashRequest>,
) -> Json<ApiResponse<bool>> {
    let claims_col = db.collection::<Claim>("claims");

    // Search strictly by the provided hash
    let filter = doc! { "claim_hash": &body.claim_hash };

    // Using find_one without options (assuming mongodb driver v2+)
    match claims_col.find_one(filter).await {
        Ok(Some(_claim)) => Json(ApiResponse {
            success: true,
            message: "Claim found and valid".into(),
            data: Some(true), // TRUE: Hash exists
        }),
        Ok(None) => Json(ApiResponse {
            success: true, // Request succeeded, but result is false
            message: "Claim hash not found".into(),
            data: Some(false), // FALSE: Hash does not exist
        }),
        Err(err) => {
            error!("DB find error: {:?}", err);
            Json(ApiResponse {
                success: false,
                message: "Database error".into(),
                data: None,
            })
        }
    }
}