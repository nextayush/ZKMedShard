// backend/src/main.rs

//! Entry point for ZK-MedShard backend prototype.

mod config;
mod utils;
mod models;
mod routes;
mod services;

use actix_web::{App, HttpServer};
use config::Config;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load configuration
    let config = Config::from_env();

    // Initialize logger
    env_logger::init();
    println!(
        "[Startup] ZK-MedShard backend starting on {}:{}",
        config.host, config.port
    );

    // Start Actix-web server
    HttpServer::new(move || {
        App::new()
            .configure(routes::config) // Register routes
    })
    .bind((config.host.clone(), config.port))?
    .run()
    .await
}
