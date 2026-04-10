#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
RELEASE_DIR="$ROOT_DIR/release"
VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
ARCHIVE_NAME="quickfill-form-filler-v${VERSION}.zip"
ARCHIVE_PATH="$RELEASE_DIR/$ARCHIVE_NAME"

if [[ ! -f "$DIST_DIR/manifest.json" ]]; then
  echo "dist/manifest.json is missing. Run npm run build first." >&2
  exit 1
fi

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

(
  cd "$DIST_DIR"
  zip -qr "$ARCHIVE_PATH" .
)

echo "$ARCHIVE_PATH"

