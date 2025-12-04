// src/middleware/jwt.rs
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, header::AUTHORIZATION, StatusCode},
    response::IntoResponse,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use tracing::error;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // Ethereum wallet address
    pub exp: usize,
}

#[derive(Debug, Clone)]
pub struct AuthUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = axum::response::Response;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Manual Authorization header parsing
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|hv| hv.to_str().ok())
            .ok_or_else(|| {
                (StatusCode::UNAUTHORIZED, "Missing Authorization header").into_response()
            })?;

        // Expect "Bearer <token>"
        let token = auth_header
            .strip_prefix("Bearer ")
            .or_else(|| auth_header.strip_prefix("bearer "))
            .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Invalid Authorization header").into_response())?;

        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret".to_string());
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_ref()),
            &Validation::default(),
        )
        .map_err(|err| {
            error!("JWT decode error: {:?}", err);
            (StatusCode::UNAUTHORIZED, "Invalid or expired token").into_response()
        })?;

        Ok(AuthUser(token_data.claims))
    }
}
