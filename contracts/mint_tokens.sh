#!/bin/bash
cd "$(dirname "$0")"
eval "$(tr -d '\r' < .env | grep -v '^#' | grep '=')"

WALLET=0xa201EEE38742FE108556089F1F330dcC3944071A
AMOUNT=1000000000  # 1000 tokens (6 decimals)

echo "Minting USDC..."
~/.foundry/bin/cast send "$USDC_ADDRESS" \
  'mint(address,uint256)' "$WALLET" "$AMOUNT" \
  --rpc-url mantle_sepolia \
  --private-key "$PRIVATE_KEY"

echo "Minting USDT..."
~/.foundry/bin/cast send "$USDT_ADDRESS" \
  'mint(address,uint256)' "$WALLET" "$AMOUNT" \
  --rpc-url mantle_sepolia \
  --private-key "$PRIVATE_KEY"

echo "Done."
