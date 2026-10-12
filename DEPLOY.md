# Production deploy

`docker-compose.prod.yml` runs Postgres, the API and the web app behind
Traefik, published only through a Cloudflare Tunnel — no port is opened on the
server.

```
browser ──https──▶ Cloudflare ──tunnel──▶ cloudflared ──▶ traefik:80
                                                           ├─ Host(API_DOMAIN) ─▶ api:3000 ─▶ postgres
                                                           └─ Host(WEB_DOMAIN) ─▶ web:80 (nginx, static SPA)
```

## One-time setup

1. **Tunnel.** Cloudflare Zero Trust → Networks → Tunnels → create a tunnel
   (Cloudflared connector) and copy its token. Under **Public hostnames** add
   two, both with service `HTTP` → `traefik:80`:
   - `api.<your-domain>`
   - `app.<your-domain>`
2. **Server.** Docker with the compose plugin. Clone the repo, then
   `cp .env.example .env` and replace its contents with the production block
   at the bottom of `.env.example` (uncommented and filled in).
3. **Start.**

   ```bash
   bash scripts/deploy.sh up        # build and start everything
   bash scripts/deploy.sh migrate   # build the schema (backs up first, asks)
   bash scripts/deploy.sh seed      # doctor picklist + lab test catalog
   ```

4. Sign in at `https://app.<your-domain>` with an address in `ADMIN_EMAILS` —
   it's made admin on first sign-in.

## Day to day

```bash
bash scripts/deploy.sh help      # every command
bash scripts/deploy.sh update    # pull, build, migrate if needed, restart
bash scripts/deploy.sh backup    # dump the database to backups/
bash scripts/deploy.sh logs api -f
```

## Notes

- **The web app bakes in the API URL at build time** (`VITE_API_URL`, from
  `API_DOMAIN`). Changing `API_DOMAIN` means rebuilding `web`, which `update`
  and `build` do.
- **Uploads** (patient ID documents) live in the `uploads` Docker volume, not
  in the database — `deploy.sh backup` does not include them. Back the volume
  up separately.
- **One API replica.** Better Auth keeps its OTP rate-limit counters in process
  memory; a second replica would double every limit.
- **Client IP.** The API keys rate limits on `CF-Connecting-IP`
  (`CLIENT_IP_HEADER` in the compose file). That's only safe because nothing
  reaches the API except through the tunnel — don't publish the API's or
  Traefik's port.
- **Demo mode** can't run here: the API refuses `DEMO_MODE=true` in
  production. Use [DEMO.md](DEMO.md) locally.
