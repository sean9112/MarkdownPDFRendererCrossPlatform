#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

npm run build
npm run package:linux

echo
echo "Expected AppImage output:"
echo "  $ROOT_DIR/release/"
