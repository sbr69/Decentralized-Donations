#!/bin/bash
cd "$(dirname "$0")"
source <(tr -d '\r' < .env)
~/.foundry/bin/forge script script/Deploy.s.sol \
  --rpc-url mantle_sepolia \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  -vvv
