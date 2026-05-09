#!/usr/bin/env bash
# Deploy the Fishbones API to the VPS.
#
# Layout on the remote host:
#   /opt/fishbones-api/fishbones-api      — the binary
#   /var/lib/fishbones-api/                — sqlite db + state
#   /etc/fishbones-api/api.env             — env file (read by systemd)
#   /etc/fishbones-api/AuthKey_*.p8        — uploaded SIWA private key
#   /etc/fishbones-api/apple-domain-association.txt  — uploaded by hand
#                                            after Apple gives you the
#                                            verification file.
#   /etc/systemd/system/fishbones-api.service
#   /etc/caddy/Caddyfile                   — rewritten on every deploy
#
# This script is *destructive* to the Caddyfile: it writes a fresh one
# with just the Tap + Fishbones blocks. The earlier `relay.mattssoftware.com`
# block from a prior deploy is dropped on purpose — the migration plan
# is to retire that domain in favour of `api.mattssoftware.com`.

set -euo pipefail

cd "$(dirname "$0")"

# Load .env
if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi
set -a; source .env; set +a

if [ -z "${VPS_HOST:-}" ]; then
  echo "Error: VPS_HOST not set in .env"
  exit 1
fi

# Prompt for password if not in .env
if [ -z "${VPS_PASSWORD:-}" ]; then
  read -sp "Root password for $VPS_HOST: " VPS_PASSWORD
  echo
fi

# Check for sshpass
if ! command -v sshpass &>/dev/null; then
  echo "Installing sshpass..."
  brew install sshpass 2>/dev/null || brew install esolitos/ipa/sshpass
fi

export SSHPASS="$VPS_PASSWORD"
SSH="sshpass -e ssh -o StrictHostKeyChecking=accept-new -p $VPS_PORT $VPS_USER@$VPS_HOST"
SCP="sshpass -e scp -o StrictHostKeyChecking=accept-new -P $VPS_PORT"
RSYNC_SSH="sshpass -e ssh -o StrictHostKeyChecking=accept-new -p $VPS_PORT"

echo "── Deploying fishbones-api to $VPS_HOST..."

# Ensure remote dirs exist
$SSH "mkdir -p /opt/fishbones-api /etc/fishbones-api /var/lib/fishbones-api && chmod 700 /etc/fishbones-api"

# Upload source and build on VPS. We rebuild on the VPS rather than
# cross-compiling locally so the resulting binary links against the
# Linux glibc / sqlite tree it'll actually run under.
echo "── Uploading source to VPS..."
rsync -avz --delete \
  -e "$RSYNC_SSH" \
  --exclude target --exclude .git --exclude .env \
  ./ "$VPS_USER@$VPS_HOST:/opt/fishbones-api/src/"

echo "── Installing build dependencies..."
$SSH "apt-get update -qq && apt-get install -y -qq build-essential pkg-config libssl-dev"

echo "── Building on VPS (this may take a few minutes on first run)..."
$SSH "cd /opt/fishbones-api/src && \
  command -v cargo >/dev/null 2>&1 || { curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; } && \
  . \"\$HOME/.cargo/env\" && \
  cargo build --release && \
  systemctl stop fishbones-api 2>/dev/null; \
  cp target/release/fishbones-api /opt/fishbones-api/fishbones-api"

# ── Apple SIWA: upload .p8 ────────────────────────────────────────
#
# The .p8 only ever needs to be uploaded once per VPS. Subsequent
# deploys can re-use whatever's already at /etc/fishbones-api/. The
# local file is often archived (or moved off the laptop entirely
# once it's in 1Password / a secrets vault), so a missing local
# file is a normal state — not an error. We skip the upload and
# fall back to whichever AuthKey_*.p8 the VPS already has,
# detected via a remote `ls`. If the VPS has nothing AND the local
# is missing, that's a real misconfiguration; bail.
APPLE_REMOTE_KEY_PATH=""
if [ -n "${APPLE_PRIVATE_KEY_LOCAL:-}" ] && [ -f "$APPLE_PRIVATE_KEY_LOCAL" ]; then
  KEY_BASENAME="$(basename "$APPLE_PRIVATE_KEY_LOCAL")"
  APPLE_REMOTE_KEY_PATH="/etc/fishbones-api/$KEY_BASENAME"
  echo "── Uploading Apple .p8 → $APPLE_REMOTE_KEY_PATH"
  $SCP "$APPLE_PRIVATE_KEY_LOCAL" "$VPS_USER@$VPS_HOST:$APPLE_REMOTE_KEY_PATH"
  $SSH "chmod 600 $APPLE_REMOTE_KEY_PATH"
else
  # Local file is missing / unset. Look for any AuthKey_*.p8 already
  # uploaded on the VPS. If found, point the env file at it and skip
  # the upload step. If none exists, only fail if the user actually
  # wants Apple SIWA (APPLE_CLIENT_ID set).
  REMOTE_KEY="$($SSH 'ls /etc/fishbones-api/AuthKey_*.p8 2>/dev/null | head -1' || true)"
  if [ -n "$REMOTE_KEY" ]; then
    APPLE_REMOTE_KEY_PATH="$REMOTE_KEY"
    if [ -n "${APPLE_PRIVATE_KEY_LOCAL:-}" ]; then
      echo "── Skipping Apple .p8 upload (local file missing); reusing $REMOTE_KEY"
    else
      echo "── Reusing Apple .p8 already on VPS: $REMOTE_KEY"
    fi
  elif [ -n "${APPLE_CLIENT_ID:-}" ]; then
    echo "Error: APPLE_CLIENT_ID is set but no AuthKey_*.p8 is on the VPS"
    echo "       and APPLE_PRIVATE_KEY_LOCAL=${APPLE_PRIVATE_KEY_LOCAL:-<unset>} doesn't"
    echo "       exist locally. Restore the .p8 file or unset APPLE_CLIENT_ID to deploy"
    echo "       without Apple sign-in."
    exit 1
  fi
fi

# ── Env file (systemd EnvironmentFile=) ───────────────────────────
# Permissions 600 so the Apple Service ID + Google secret aren't
# world-readable.
echo "── Writing /etc/fishbones-api/api.env..."
cat <<EOF | $SSH "cat > /etc/fishbones-api/api.env && chmod 600 /etc/fishbones-api/api.env"
# Generated by deploy.sh — do not edit by hand. Re-run \`./deploy.sh\`
# from your laptop to update.
PUBLIC_URL=${PUBLIC_URL:-}
DATABASE_PATH=/var/lib/fishbones-api/api.sqlite
HOST=127.0.0.1
PORT=${API_PORT:-9443}
WEB_BASE_URL=${WEB_BASE_URL:-https://libre.academy}

APPLE_CLIENT_ID=${APPLE_CLIENT_ID:-}
APPLE_TEAM_ID=${APPLE_TEAM_ID:-}
APPLE_KEY_ID=${APPLE_KEY_ID:-}
APPLE_PRIVATE_KEY_FILE=${APPLE_REMOTE_KEY_PATH}
APPLE_DOMAIN_ASSOCIATION_FILE=/etc/fishbones-api/apple-domain-association.txt

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}

# ── Mail backend ─────────────────────────────────────────────
# Two backends, tried in order: SMTP first, then Resend, then a
# tracing::warn fallback that prints the URL so it's recoverable
# from journalctl. Configure the one(s) you want; leave the rest
# blank to disable.
#
# SMTP (self-hosted Postfix on this VPS — see api/setup-mail.sh):
#   SMTP_HOST=localhost
#   SMTP_PORT=25
#   SMTP_STARTTLS=false
#   SMTP_FROM=noreply@libre.academy
#   SMTP_FROM_NAME=Fishbones
# SMTP (external relay like Mailgun / SES):
#   SMTP_HOST=smtp.mailgun.org SMTP_PORT=587 SMTP_STARTTLS=true
#   SMTP_USER=postmaster@... SMTP_PASS=...
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-}
SMTP_USER=${SMTP_USER:-}
SMTP_PASS=${SMTP_PASS:-}
SMTP_FROM=${SMTP_FROM:-}
SMTP_FROM_NAME=${SMTP_FROM_NAME:-}
SMTP_STARTTLS=${SMTP_STARTTLS:-true}

# Resend HTTP API — fallback / alternative to SMTP. Free tier
# covers 100 emails/day. See https://resend.com.
RESEND_API_KEY=${RESEND_API_KEY:-}
RESEND_FROM=${RESEND_FROM:-}
RESEND_FROM_NAME=${RESEND_FROM_NAME:-}
EOF

# ── systemd unit ──────────────────────────────────────────────────
echo "── Installing systemd service..."
cat <<EOF | $SSH "cat > /etc/systemd/system/fishbones-api.service"
[Unit]
Description=Fishbones API
After=network.target

[Service]
Type=simple
ExecStart=/opt/fishbones-api/fishbones-api
WorkingDirectory=/opt/fishbones-api
EnvironmentFile=/etc/fishbones-api/api.env
Restart=always
RestartSec=5
Environment=RUST_LOG=fishbones_api=info

[Install]
WantedBy=multi-user.target
EOF

# ── Caddy ─────────────────────────────────────────────────────────
# Make sure Caddy is installed (a previous Tap deploy already did this
# but we re-check so a fresh VPS still works).
echo "── Setting up Caddy (reverse proxy + auto TLS)..."
$SSH "command -v caddy >/dev/null 2>&1 || {
  apt-get update -qq && apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq && apt-get install -y -qq caddy
}"

# Write a fresh Caddyfile with just the Tap relay + the new Fishbones
# API. The earlier `relay.mattssoftware.com` block is intentionally
# dropped — that domain is being retired in favour of api.mattssoftware.com.
#
# IMPORTANT: this Caddyfile must include EVERY host the VPS serves,
# not just the API. Caddy is a single-process router; any host omitted
# here goes dark on the next reload. The earlier version of this
# script wrote only the Tap + API blocks and clobbered the
# libre.academy + mattssoftware.com sites every time we deployed
# the relay — TLS handshake failures, "server unexpectedly dropped
# the connection" in browsers, etc. Adding all four hosts up front so
# every deploy keeps the whole VPS reachable.
#
# Static-site hosts use `try_files` for SPA fallback so client-side
# routes (`/reset-password`, `/oauth/done`, `/courses/:id`, …) hit
# index.html and let the React Router resolve them — without that,
# Caddy returns 404 and the SPA never gets a chance to mount.
cat <<EOF | $SSH "cat > /etc/caddy/Caddyfile"
# Generated by api/deploy.sh — do not edit by hand. Re-run
# ./deploy.sh from your laptop to update.

# Global server options: disable HTTP/2 across every site on this
# VPS so the API host's WebSocket endpoint works on every client.
# Background: WebSockets are an HTTP/1.1 protocol (RFC 6455). When
# Caddy advertises h2 in ALPN, the iOS WKWebView happily negotiates
# h2 for wss://api.mattssoftware.com/fishbones/sync/ws, sends a GET
# with Upgrade headers, and Caddy strips those headers before
# forwarding (RFC 7540 forbids Upgrade in HTTP/2). The backend
# (axum) only knows how to do RFC 6455 upgrades, sees a plain GET,
# and 400s. Disabling h2 forces clients onto h1.1 (where WS works
# natively) or h3 (where Caddy's QUIC stack handles WS internally).
# The static-content sites lose a small amount of asset-multiplex
# perf, but they all advertise Alt-Svc: h3 so capable clients
# upgrade past h1.1 anyway.
{
    servers {
        protocols h1 h3
    }
}

# Marketing site for the dev's other apps.
mattssoftware.com, www.mattssoftware.com {
    root * /var/www/mattssoftware
    file_server
}

# Fishbones marketing + /learn embed. SPA fallback so client-side
# routes serve index.html and the React Router handles them.
libre.academy, www.libre.academy {
    root * /var/www/fishbones-academy
    try_files {path} {path}/ /index.html
    file_server
    encode zstd gzip

    # CORS for /audio/*. The Fishbones desktop + iOS Tauri shells
    # fetch the lesson-narration manifest + MP3 files cross-origin
    # (the WebView's effective origin is \`tauri://localhost\` on
    # iOS/Mac and \`http://tauri.localhost\` on Windows, neither of
    # which is libre.academy). Without CORS the manifest fetch
    # fails preflight, useLessonAudio gets null, and the speaker
    # icon never appears in the app.
    #
    # Wildcard origin is safe — audio assets are public-read; CORS
    # is purely about whether the JS layer can SEE the response,
    # not about authentication.
    @audio path /audio/*
    header @audio Access-Control-Allow-Origin "*"
    header @audio Access-Control-Allow-Methods "GET, HEAD, OPTIONS"
    header @audio Access-Control-Allow-Headers "*"
    header @audio Access-Control-Expose-Headers "Content-Length, Content-Range, Accept-Ranges"
    header @audio Access-Control-Max-Age "86400"
}

# Tap relay (different product on the same VPS).
${TAP_DOMAIN:-tap.mattssoftware.com} {
    reverse_proxy 127.0.0.1:${TAP_RELAY_PORT:-8443}
}

# Fishbones API. Protocols are inherited from the global servers
# block above (h1 + h3, no h2) so the WS handshake works.
${API_DOMAIN:-api.mattssoftware.com} {
    reverse_proxy 127.0.0.1:${API_PORT:-9443}
}
EOF

# ── Start / restart ───────────────────────────────────────────────
echo "── Starting services..."
$SSH "systemctl daemon-reload && \
  systemctl enable --now caddy && \
  systemctl restart caddy && \
  systemctl enable --now fishbones-api && \
  systemctl restart fishbones-api"

# Health check. The service binds to 127.0.0.1 so the curl-from-VPS
# check is the right one — no TLS in the loopback hop.
echo "── Checking API health..."
sleep 2
$SSH "curl -sf http://127.0.0.1:${API_PORT:-9443}/health" \
  && echo " ✓ Fishbones API is running" \
  || echo " ✗ Fishbones API not responding yet (check logs: journalctl -u fishbones-api)"

echo ""
echo "── Deploy complete!"
echo "   Tap:       https://${TAP_DOMAIN:-tap.mattssoftware.com}"
echo "   Fishbones: https://${API_DOMAIN:-api.mattssoftware.com}"
echo "   Logs:      ssh $VPS_USER@$VPS_HOST journalctl -u fishbones-api -f"

echo ""
echo "── Apple domain-verification reminder"
echo "   Once you save the SIWA Service ID config, Apple gives you a"
echo "   small text file. Upload it like:"
echo ""
echo "     scp ~/Downloads/apple-developer-domain-association.txt \\"
echo "         $VPS_USER@$VPS_HOST:/etc/fishbones-api/apple-domain-association.txt"
echo ""
echo "   Then click Verify in the Apple Developer portal."
