#!/usr/bin/env bash
# Drop-zero-effort screenshot helper for App Store Connect.
#
# Usage:
#   ./capture.sh iphone <NN>-<screen-name>     # captures into iphone-6.9/
#   ./capture.sh ipad   <NN>-<screen-name>     # captures into ipad-13/
#
# Examples:
#   ./capture.sh iphone 01-library
#   ./capture.sh iphone 02-lesson-reading
#   ./capture.sh ipad   01-library-ipad
#
# Prereqs:
#   - The matching simulator is BOOTED (`xcrun simctl boot ...`).
#   - The Libre app is INSTALLED + LAUNCHED inside it.
#   - You've navigated to the screen you want to capture.
#
# Output:
#   appstore-submission/screenshots/iphone-6.9/<NN>-<name>.png  (1320×2868)
#   appstore-submission/screenshots/ipad-13/<NN>-<name>.png     (2064×2752)
#
# These are the canonical sizes App Store Connect demands. The
# simulator emits PNGs at native resolution; no resizing needed.

set -euo pipefail

usage() {
  echo "Usage: $0 {iphone|ipad} <NN>-<screen-name>" >&2
  echo "  e.g. $0 iphone 01-library" >&2
  exit 1
}

[ "$#" -eq 2 ] || usage

PLATFORM="$1"
NAME="$2"
HERE="$(cd "$(dirname "$0")" && pwd)"

case "$PLATFORM" in
  iphone)
    UDID="F2AA1DE6-9170-4548-B274-762221F26819"   # iPhone 17 Pro Max (1320×2868)
    DEST="$HERE/iphone-6.9"
    ;;
  ipad)
    UDID="6A9135A7-64B9-48CF-A454-31C03C7CB124"   # iPad Pro 13" (M5)  (2064×2752)
    DEST="$HERE/ipad-13"
    ;;
  *)
    usage
    ;;
esac

# Make sure the simulator is up. `boot` is idempotent — already-booted
# returns an error we swallow.
xcrun simctl boot "$UDID" 2>/dev/null || true

mkdir -p "$DEST"
OUT="$DEST/$NAME.png"

xcrun simctl io "$UDID" screenshot "$OUT" >/dev/null
WH=$(sips -g pixelWidth -g pixelHeight "$OUT" 2>/dev/null | awk '/pixel/ { print $2 }' | paste -sd'x' -)
echo "✓ $OUT ($WH)"
