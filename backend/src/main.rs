mod middleware;
mod models;
mod routes;
mod services;

use std::{env, net::SocketAddr};

use axum::{
    routing::get,
    Router,
    extract::{Extension, OriginalUri}, // Added OriginalUri for 404 logger
    http::StatusCode,
    response::IntoResponse,
};
use tower_http::cors::CorsLayer;
use dotenvy::dotenv;
use tracing_subscriber;

#[tokio::main]
async fn main() {
    // Load .env if present
    dotenv().ok();

    // Initialize tracing/logging
    tracing_subscriber::fmt::init();

    // Read port from env or default to 4000
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(4000);

    // Initialize database
    let db = services::db::get_db().await;

    // Build router
    let cors = CorsLayer::permissive(); 

    // 2. Main app router
    // UPDATED: Removed /api prefix because logs show frontend requests /auth/nonce
    let app = Router::new()
        .route("/", get(root))
        .nest("/auth", routes::auth::router())   // Accessible at /auth/...
        .nest("/claim", routes::claim::router()) // Accessible at /claim/...
        .fallback(handler_404)    // Logs 404 errors to terminal
        .layer(Extension(db))
        .layer(cors);

    // Bind to 0.0.0.0 so it works in Docker/Network, but access via localhost on frontend
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("🚀 ZKMedShard backend running at http://localhost:{}", port);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap_or_else(|err| {
            tracing::error!("server error: {}", err);
        });
}

async fn root() -> impl IntoResponse {
    (StatusCode::OK, "ZKMedShard backend\n")
}

// 3. The 404 Handler - Tells you EXACTLY what path failed
async fn handler_404(uri: OriginalUri) -> impl IntoResponse {
    tracing::error!("❌ 404 NOT FOUND: Request received for path: {}", uri.0);
    (StatusCode::NOT_FOUND, format!("No route for path: {}", uri.0))
}