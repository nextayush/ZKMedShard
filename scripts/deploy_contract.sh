#!/bin/bash
set -e

# --- CONFIG ---
CONTRACT_PATH="./smart-contracts/contracts/med_shard"
NODE_URL="ws://127.0.0.1:9944"
ENV_FILE="./backend/.env"
INSTANTIATION_ARGS=""

echo "🚀 Building the med_shard contract..."
cargo contract build --manifest-path "$CONTRACT_PATH/Cargo.toml" --release

# Get the .contract bundle file
CONTRACT_FILE=$(find "$CONTRACT_PATH/target/ink" -maxdepth 1 -name "*.contract" | head -n 1)

if [ ! -f "$CONTRACT_FILE" ]; then
    echo "❌ No .contract file found in $CONTRACT_PATH/target/ink"
    exit 1
fi

echo "📦 Uploading contract code to node: $NODE_URL"
UPLOAD_OUTPUT=$(cargo contract upload \
    --manifest-path "$CONTRACT_PATH/Cargo.toml" \
    --url "$NODE_URL" \
    --suri "//Alice" \
    --execute \
    --skip-confirm)

CODE_HASH=$(echo "$UPLOAD_OUTPUT" | grep "Code hash" | awk '{print $3}')
echo "✅ Contract code uploaded. Code hash: $CODE_HASH"

echo "🏗 Instantiating contract..."
INSTANTIATE_OUTPUT=$(cargo contract instantiate \
    --manifest-path "$CONTRACT_PATH/Cargo.toml" \
    --constructor new \
    --args $INSTANTIATION_ARGS \
    --suri "//Alice" \
    --url "$NODE_URL" \
    --execute \
    --skip-confirm)

CONTRACT_ADDRESS=$(echo "$INSTANTIATE_OUTPUT" | grep "Contract" | grep "address" | awk '{print $3}')
echo "✅ Contract instantiated at address: $CONTRACT_ADDRESS"

# Save to backend/.env
mkdir -p "$(dirname "$ENV_FILE")"
if grep -q "CONTRACT_ADDRESS" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^CONTRACT_ADDRESS=.*|CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" "$ENV_FILE"
else
    echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> "$ENV_FILE"
fi

echo "✅ Contract address saved to $ENV_FILE"
