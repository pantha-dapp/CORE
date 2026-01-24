#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(cd "$DIR/.." && pwd)"
cd "$ROOT_DIR"

rm -f bun.lock
rm -f bun.lockb
rm -rf node_modules
rm -rf packages/web/node_modules
rm -rf packages/server/node_modules
rm -rf packages/contracts/node_modules
rm -rf packages/lib/shared/node_modules
rm -rf packages/lib/react-sdk/node_modules

cd "$ROOT_DIR/packages/web"
bun i --force
cd "$ROOT_DIR/packages/server"
bun i --force
cd "$ROOT_DIR/packages/contracts"
bun i --force
cd "$ROOT_DIR/packages/lib/shared"
bun i --force
cd "$ROOT_DIR/packages/lib/react-sdk"
bun i --force
cd "$ROOT_DIR"
bun i --force
# https://www.facebook.com/marketplace/item/838425812031562/?ref=browse_tab&referral_code=marketplace_general&referral_story_type=general_listing
