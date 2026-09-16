# Deployment

The runbook for putting this on a Hostinger KVM 2. Written **12 August 2026**.

Everything here is ready to run **except the two lines that need a domain**,
which is open item **O1**. Until `DOMAIN` is real, Caddy cannot issue a
certificate and Google sign-in cannot be configured. The rest — image,
compose, migrations, backups, firewall — is done and can be rehearsed against
the server's IP or a throwaway subdomain.

---

## What ships

| File | What it is |
|---|---|
| `Dockerfile` | Four stages: deps, builder, **migrator**, runner. Runtime is the Next standalone bundle on `node:22-alpine`, as uid 1001. |
| `docker-compose.prod.yml` | `caddy` · `web` · `db` · `backup`, plus a one-shot `migrate`. |
| `deploy/Caddyfile` | TLS, HSTS, compression, HTTP/3, the proxy, and the header rewrite the rate limiter depends on. |
| `deploy/backup.sh` | Nightly `pg_dump`, gzipped, kept 14 days. |
| `.env.production.example` | Every variable, with what happens if it is wrong. |
| `app/api/health/route.ts` | `select 1`. Used by Docker and by Caddy's upstream check. |

**Only Caddy is published.** `web` and `db` have no `ports:` at all, so
Postgres is unreachable from the internet even if ufw is later misconfigured.

---

## First deploy

### 1 · The box

```bash
adduser deploy && usermod -aG sudo deploy
# Key-only SSH. Set PasswordAuthentication no and PermitRootLogin no.
sudo nano /etc/ssh/sshd_config && sudo systemctl restart ssh
```

```bash
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443
sudo ufw enable
sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban
```

Docker Engine and the compose plugin from Docker's own repository, not
Ubuntu's — the distribution package lags and ships the old `docker-compose`.

### 2 · DNS

`A` on the apex and on `www`, both to the server's IPv4. Wait for it to
resolve before the first `up`: Caddy asks Let's Encrypt immediately, and
failed attempts count against the rate limit.

### 3 · The application

```bash
git clone https://github.com/salahmed-ctrlz/TrendyPlaza.git /srv/tp
cd /srv/tp
cp .env.production.example .env && chmod 600 .env && nano .env
```

Fill it. `openssl rand -base64 32` for `BETTER_AUTH_SECRET`, `openssl rand
-base64 24` for the database password, and put that same password into
`DATABASE_URL`.

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

`migrate` runs to completion and exits 0. `web` does not start until it has —
that ordering is the point of a separate container, because two web replicas
racing `drizzle-kit migrate` is how a migration gets applied twice.

### 4 · The first account

The seed is a **development** fixture: demo orders, demo students, printed
credentials. Do not run it on a server that will hold real orders.

```bash
# Sign up through the site at https://<domain>/en/inscription, then:
docker compose -f docker-compose.prod.yml exec db \
  psql -U tp -d tp -c "insert into user_permissions (user_id, permission)
    select id, unnest(array['orders.view','orders.edit','orders.confirm',
      'orders.delete','products.manage','content.manage','content.publish',
      'codes.generate','codes.revoke','students.view','students.manage',
      'students.delete','finance.view','settings.manage','users.manage'])
    from users where email = 'THE_EMAIL';"
```

Everyone after that is created from `/admin/team`, which mints a single-use
setup link. No screen in this application handles someone else's password.

---

## Updating

```bash
cd /srv/tp && git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Compose rebuilds, runs `migrate`, then replaces `web`. There is a few seconds
of downtime while the container swaps; on a site this size that is the right
trade against the complexity of a blue-green pair on one 8 GB box.

**A `NEXT_PUBLIC_` change needs `--build`, not a restart.** Next inlines those
values into the bundle. This is exactly the problem behind open item O4: the
client cannot change their own RIP number without a developer until it moves
into `app_settings`.

---

## Backups

The `backup` container dumps nightly to the `tp_backups` volume and keeps 14
days. **That is half a backup** — same disk as the database, so it covers "a
table was dropped" and not "the VPS is gone".

Pull them off the box. From a machine that is not the server:

```bash
rsync -avz --remove-source-files=false \
  deploy@<server>:/var/lib/docker/volumes/tp_tp_backups/_data/ ./tp-backups/
```

### Restore drill — do this once before launch

A dump that has never been restored is not a backup.

```bash
gunzip -c tp-YYYYMMDD-HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U tp -d tp_restore_test
```

Create `tp_restore_test` first, restore into it, count a few tables, drop it.
Never rehearse into `tp`.

**Uploads are not in the dump.** Receipts, resources and avatars live on the
`tp_storage` volume. Back that up too, or a restore returns a database full of
rows pointing at files that are gone:

```bash
docker run --rm -v tp_tp_storage:/data -v "$PWD":/out alpine \
  tar czf /out/tp-storage-$(date -u +%Y%m%d).tar.gz -C /data .
```

---

## Checks after a deploy

```bash
curl -sI https://<domain> | head -1                 # 200, and HTTPS
curl -s https://<domain>/api/health                  # 404 through Caddy, by design
docker compose -f docker-compose.prod.yml exec web \
  node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>console.log(r.status))"
```

Then by hand, because these are the paths that carry money and access:

1. Add to cart → checkout → an order reference comes back.
2. `/suivi` with that reference and the phone number.
3. Redeem a code → the library opens.
4. Upload a receipt → it appears in `/admin/requests`.
5. Open a PDF in the viewer. Sign out, hit `/api/resource/<id>` — 401.

---

## What is still open

| # | Item | Blocks |
|---|---|---|
| **O1** | Domain purchase | TLS, the Google redirect URI, this whole file's first run |
| **O4** | RIP number in `app_settings` | The client changing their bank number without a redeploy |

### Known, and deliberate

- **The rate limiter is per process.** One web container, one map. A second
  replica doubles every allowance. Documented in `src/server/rate-limit.ts`;
  the swap to a Postgres table is contained to that one file.
- **Fonts come from the Google CDN.** Two round trips to a third party on a 3G
  connection. Self-hosting means subsetting Amiri's Arabic, which is real work
  and is not cosmetic on this audience's connection.
- **No `error.tsx` or `not-found.tsx` in any route group**, so a thrown error
  in production shows the Next.js default page.
- **No log shipping.** `docker compose logs` is the whole story. Fine at one
  box; the first thing to add if there is a second.
