use subxt::{
    OnlineClient, PolkadotConfig,
    tx::PairSigner,
    ext::sp_core::sr25519,
    utils::AccountId32,
};
use scale::{Encode, Decode};
use serde_json::Value;
use std::{env, error::Error};

/// Load contract address from .env file
fn get_contract_address() -> String {
    dotenvy::dotenv().ok();
    env::var("CONTRACT_ADDRESS").expect("CONTRACT_ADDRESS not set in .env")
}

/// Path to metadata.json from ink! build (optional if needed later)
const CONTRACT_METADATA_PATH: &str = "./smart-contracts/contracts/med_shard/metadata.json";

/// Connect to local Substrate node
async fn get_client() -> Result<OnlineClient<PolkadotConfig>, Box<dyn Error>> {
    let client = OnlineClient::<PolkadotConfig>::new().await?;
    Ok(client)
}

/// Signer using dev account (Alice)
fn get_signer() -> PairSigner<PolkadotConfig, sr25519::Pair> {
    let pair = sr25519::Pair::from_string("//Alice", None).unwrap();
    PairSigner::new(pair)
}

/// Record claim on chain
pub async fn record_claim_on_chain(claim_id: String, verified: bool) -> Result<(), Box<dyn Error>> {
    let client = get_client().await?;
    let signer = get_signer();
    let contract_address = get_contract_address();

    // Encode call data for ink! message: verify_claim(String, bool)
    let call_data = (
        "verify_claim".to_string(),
        claim_id,
        verified,
    ).encode();

    let tx = subxt::dynamic::tx("Contracts", "call", (
        AccountId32::from_string(&contract_address)?,
        0_u128,                 // value
        500_000_000_000_u64,    // gas limit
        call_data,
    ));

    let _ = client.tx().sign_and_submit_then_watch_default(&tx, &signer).await?;
    Ok(())
}

/// Query claim status from chain
pub async fn get_claim_status(claim_id: String) -> Result<bool, Box<dyn Error>> {
    let client = get_client().await?;
    let contract_address = get_contract_address();

    let call_data = (
        "get_claim_status".to_string(),
        claim_id,
    ).encode();

    // Call contract RPC
    let rpc_response: Value = client
        .rpc()
        .request("contracts_call", subxt::rpc::RpcParams::new()
            .push(AccountId32::from_string(&contract_address)?)?
            .push(call_data)?)
        .await?;

    // Decode result from RPC response
    let result_bytes = rpc_response["result"]
        .as_str()
        .ok_or("No result field in RPC response")?;
    let decoded = base64::decode(result_bytes)?;
    let claim_status: bool = bool::decode(&mut &decoded[..])?;

    Ok(claim_status)
}
