#!/bin/bash
cd "$(dirname "$0")"
PK=$(grep PRIVATE_KEY .env | tr -d '\r' | cut -d= -f2)
~/.foundry/bin/forge script script/DeployMocks.s.sol \
  --rpc-url mantle_sepolia \
  --private-key "0x$PK" \
  --broadcast
