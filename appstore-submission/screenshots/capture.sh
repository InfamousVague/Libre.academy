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
    # Resolve the iPhone 6.9" simulator UDID dynamically (so the
    # script keeps working when Xcode renames or refreshes the
    # device set — iPhone 16 Pro Max one cycle, iPhone 17 Pro Max
    # the next, etc.). Override with FB_IPHONE_UDID=... if you've
    # got a specific one.
    UDID="${FB_IPHONE_UDID:-$(xcrun simctl list devices available 2>/dev/null \
      | grep -E "iPhone 1[6-9] Pro Max|iPhone 2[0-9] Pro Max" \
      | head -1 \
      | grep -oE "[0-9A-F-]{36}")}"
    DEST="$HERE/iphone-6.9"
    LABEL="iPhone 6.9\" (1320×2868)"
    ;;
  ipad)
    UDID="${FB_IPAD_UDID:-$(xcrun simctl list devices available 2>/dev/null \
      | grep -E "iPad Pro 13-inch \(M[0-9]+\)" \
      | head -1 \
      | grep -oE "[0-9A-F-]{36}")}"
    DEST="$HERE/ipad-13"
    LABEL="iPad 13\" (2064×2752)"
    ;;
  *)
    usage
    ;;
esac

if [ -z "$UDID" ]; then
  echo "Error: no matching $PLATFORM simulator found." >&2
  echo "Run 'xcrun simctl list devices available' to see what's installed." >&2
  echo "Or set FB_${PLATFORM^^}_UDID=<udid> to override." >&2
  exit 1
fi

# Make sure the simulator is up. `boot` is idempotent — already-booted
# returns an error we swallow.
xcrun simctl boot "$UDID" 2>/dev/null || true

mkdir -p "$DEST"
OUT="$DEST/$NAME.png"

xcrun simctl io "$UDID" screenshot "$OUT" >/dev/null
WH=$(sips -g pixelWidth -g pixelHeight "$OUT" 2>/dev/null | awk '/pixel/ { print $2 }' | paste -sd'x' -)
echo "✓ $OUT ($WH)"
