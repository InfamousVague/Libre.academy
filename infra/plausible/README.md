# Self-hosted Plausible Analytics for Libre.academy

This directory holds everything needed to stand up Plausible
Community Edition on a server you control, accessible at
`stats.libre.academy`. The frontend (`src/lib/analytics.ts`)
already points at that hostname — once the service is up and
DNS resolves, events start landing automatically.

## What's in here

## Deployment model

Libre.academy lives on a Vultr VPS at `149.28.120.197`, sharing
that box with `libre.academy` + `api.libre.academy`. So Plausible
runs **behind the existing host-level reverse proxy** (Caddy or
Nginx, whichever the VPS already uses) instead of binding ports
80/443 itself.

The Plausible app server is exposed only on `127.0.0.1:8000`; the
host's reverse proxy adds a `stats.libre.academy` vhost that
terminates TLS and forwards loopback traffic.

| File | Purpose |
|---|---|
| `docker-compose.yml` | Plausible app + Postgres + ClickHouse, bound to `127.0.0.1:8000`. |
| `.env.example` | Template — copy to `.env`, fill in secrets. |
| `Caddyfile.snippet` | Drop-in vhost for the host's existing Caddy config. |
| `nginx.snippet` | Drop-in vhost for the host's existing Nginx config. |
| `clickhouse-config.xml` | Quiet down ClickHouse's default logging. |
| `clickhouse-user-config.xml` | User-profile log overrides (pairs with the file above). |

## Prerequisites

- DNS A record: `stats.libre.academy → 149.28.120.197`.
- Docker + Docker Compose on the VPS.
- An SMTP provider (Mailgun / Postmark / SES / Resend) for
  password-reset + invite emails. The first-user bootstrap below
  works without mail — you can defer SMTP if you're the only
  user.

## Deploy

```bash
# On your local machine — add the DNS record first so the cert
# issuance step below works:
#
#   stats.libre.academy   A   149.28.120.197   TTL 300
#
# Wait ~60s for propagation:
dig +short stats.libre.academy
# → 149.28.120.197

# ── On the VPS ────────────────────────────────────────────────

# 1. Get the files onto the server.
git clone https://github.com/InfamousVague/Libre /opt/libre
cd /opt/libre/infra/plausible

# 2. Generate secrets + fill in env vars.
cp .env.example .env
# Edit .env:
#   - Set SECRET_KEY_BASE      = `openssl rand -base64 48`
#   - Set TOTP_VAULT_KEY       = `openssl rand -base64 32`
#   - Set POSTGRES_PASSWORD    = any strong password
#   - Fill in SMTP_* (if you have it; otherwise skip for now)
vim .env

# 3. Add the stats.libre.academy vhost to your existing reverse
#    proxy.
#
#    If the VPS runs Caddy:
sudo cat Caddyfile.snippet >> /etc/caddy/Caddyfile
sudo systemctl reload caddy
#
#    If the VPS runs Nginx:
sudo cp nginx.snippet /etc/nginx/sites-available/stats.libre.academy
sudo ln -s /etc/nginx/sites-available/stats.libre.academy \
           /etc/nginx/sites-enabled/
sudo certbot --nginx -d stats.libre.academy   # issues the cert
sudo nginx -t && sudo systemctl reload nginx

# 4. Boot the Plausible stack.
docker compose pull
docker compose up -d

# 5. Watch logs for the first ~60s. Plausible runs migrations
#    on first boot; the `plausible` container logs `Listening on
#    http://0.0.0.0:8000` once it's ready.
docker compose logs -f plausible

# 6. Visit https://stats.libre.academy. The Plausible signup
#    form appears; register the admin account.

# 7. Add libre.academy as a site in the dashboard. Plausible
#    generates an embed script — verify the URL it shows is
#    https://stats.libre.academy/js/script.outbound-links.js
#    (matches ANALYTICS_SCRIPT in src/lib/analytics.ts).

# 8. Lock down signups. Edit .env, set DISABLE_REGISTRATION=true,
#    then:
docker compose up -d plausible
```

## Smoke test

```bash
# Hit the events endpoint manually — should respond 202 Accepted
# and the dashboard should show a new pageview within a few seconds.
curl -X POST https://stats.libre.academy/api/event \
  -H "Content-Type: application/json" \
  -H "User-Agent: libre-smoke-test" \
  -d '{
    "name": "pageview",
    "url": "https://libre.academy/?smoke=1",
    "domain": "libre.academy"
  }'
```

## Updating

Plausible's official upgrade path:

```bash
cd /opt/libre/infra/plausible
docker compose pull
docker compose up -d
```

Tag bumps go through `docker-compose.yml` — change
`ghcr.io/plausible/community-edition:vX.Y.Z`. Read the release
notes for breaking config changes before bumping a major.

## Backups

Two things to back up:

1. **Postgres** (user accounts + site config) —
   ```bash
   docker compose exec plausible_db pg_dump -U postgres plausible_db \
     | gzip > /backups/plausible-pg-$(date +%F).sql.gz
   ```
2. **ClickHouse** (analytics events) — the official path is
   `clickhouse-backup`. For small instances a nightly
   `docker compose exec plausible_events_db clickhouse-client
   --query="BACKUP DATABASE plausible_events_db TO Disk('backups',
   'snapshot-$(date +%F)')"` is fine.

Aim for a daily snapshot off-host. Postgres is small (~MB); the
ClickHouse store grows with events but compresses well.

## Why self-hosted

- **Privacy / sovereignty** — every event stays on infrastructure
  Libre owns. No third-party gets a copy of the user list, the
  click stream, or the referrer headers.
- **No cookies / GDPR-friendly out of the box** — Plausible
  doesn't fingerprint and doesn't set cookies, so no consent
  banner needed on libre.academy itself.
- **Same-origin for events** — `stats.libre.academy` shares the
  apex domain (`libre.academy`) so corporate firewalls + browser
  privacy modes that block cross-site trackers treat the script
  as first-party.
- **Free for any volume** — the Community Edition has no
  event cap.

## Troubleshooting

- **"This domain is not configured" on the dashboard** — you
  added a site but the embed script is hitting a different
  `data-domain`. The script's `data-domain` attribute must match
  exactly what you typed when you added the site (and what
  `ANALYTICS_DOMAIN` is set to in `src/lib/analytics.ts`).
- **Cert issuance fails** — check the Caddy logs
  (`docker compose logs caddy`); the most common cause is the
  DNS A record hasn't propagated yet OR port 80 isn't open.
- **CORS errors in the browser console** — the `Caddyfile`'s
  `Access-Control-Allow-Origin` must match the exact origin
  firing events. If you serve libre.academy with the `www.`
  prefix, add both.
- **No events showing up** — open the network tab on libre.academy
  in dev tools, look for the request to
  `stats.libre.academy/js/script.outbound-links.js`. If it 404s,
  Plausible isn't serving the script; if it loads but no event
  POSTs follow on page navigation, check that `data-domain`
  matches.
