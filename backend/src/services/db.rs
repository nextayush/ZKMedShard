use mongodb::{options::ClientOptions, Client, Database};
use std::env;

pub async fn get_db() -> Database {
    let uri = env::var("MONGO_URI").expect("MONGO_URI must be set in .env");
    let client_options = ClientOptions::parse(&uri).await.unwrap();
    let client = Client::with_options(client_options).unwrap();
    client.database("zkmedshard")
}
