# Deploying quitting7oh.org

This site is built into a Docker image by GitHub Actions and published to
**GHCR** (GitHub Container Registry). To host the site you need:

- One small VPS (any provider — Hetzner, DigitalOcean, Vultr, Linode, OVH,
  AWS Lightsail, etc.). 1 CPU and 1 GB RAM is plenty.
- A domain name with DNS you can edit.
- Docker installed on the server.

Everything else — TLS certs, auto-renewal, container restarts, automatic
updates — is handled by the stack below.

## Architecture

```
   ┌────────────┐       ┌────────────────────┐       ┌──────────┐
   │ Internet   │ ──443→│ Caddy              │ ───8080──→ nginx │ ──> static files
   │            │ ──80──→ (TLS, gzip, HSTS)  │       │ (in container)
   └────────────┘       └────────────────────┘       └──────────┘
                              ↑
                              │
                       Watchtower (optional)
                       polls GHCR, pulls new images
```

Three containers, all defined in [docker-compose.yml](../docker-compose.yml):

| Container     | Job                                                       |
| ------------- | --------------------------------------------------------- |
| `site`        | nginx serving the static site (built from this repo)      |
| `caddy`       | TLS termination, HTTP→HTTPS, www→apex redirects           |
| `watchtower`  | Polls GHCR every 5 min and restarts `site` on new image   |

## One-time server setup

### 1. Get a server and point DNS at it

Spin up a small VPS. SSH in as a sudoer.

In your DNS provider:

```
A     quitting7oh.org       → <server IP>
A     www.quitting7oh.org   → <server IP>
AAAA  quitting7oh.org       → <server IPv6>   (optional)
```

Verify with `dig quitting7oh.org` before moving on — Caddy needs DNS to
resolve before it can request a Let's Encrypt certificate.

### 2. Install Docker

On Debian/Ubuntu:

```sh
# Remove any old podman/docker shims, install official Docker
curl -fsSL https://get.docker.com | sh

# Let your sudo user run docker without sudo
sudo usermod -aG docker $USER

# Re-login so the new group takes effect, then verify
docker run --rm hello-world
```

### 3. Drop the stack files on the server

```sh
sudo mkdir -p /opt/quitting7oh
sudo chown $USER /opt/quitting7oh
cd /opt/quitting7oh

# Copy these files from the repo root:
#   - docker-compose.yml
#   - Caddyfile
# Either scp them, or curl them from GitHub raw:
curl -fsSL https://raw.githubusercontent.com/quitting7oh/quitting7oh.org/main/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/quitting7oh/quitting7oh.org/main/Caddyfile -o Caddyfile
```

Edit the two files:

- **docker-compose.yml** — make sure the `image:` line under `site:` matches
  your GHCR path. The default is `ghcr.io/quitting7oh/quitting7oh.org:latest`.
- **Caddyfile** — change the domain at the top if you're not using
  `quitting7oh.org`.

### 4. (If the image is private) authenticate to GHCR

The image will be **public** by default if the repo is public — skip this
step in that case. If the repo and image are private:

```sh
# Create a GitHub Personal Access Token with the `read:packages` scope.
echo "<your-PAT>" | docker login ghcr.io -u <your-github-username> --password-stdin
```

The credentials get saved to `~/.docker/config.json` and persist across
restarts.

### 5. Start the stack

```sh
cd /opt/quitting7oh
docker compose pull
docker compose up -d
```

In about 30 seconds the site should be live at `https://quitting7oh.org`.
Caddy will have requested a Let's Encrypt cert automatically on first
request.

Verify:

```sh
docker compose ps                # all three containers should be "running"
docker compose logs caddy        # look for "certificate obtained successfully"
curl -I https://quitting7oh.org  # 200 OK with proper TLS
```

## Day-to-day operations

### Pushing updates

When you push to `main`, GitHub Actions builds a new Docker image and pushes
it to GHCR with the `latest` tag. With Watchtower in the compose file, the
server picks it up within ~5 minutes. **No SSH needed for routine deploys.**

If you want to deploy immediately rather than wait:

```sh
cd /opt/quitting7oh
docker compose pull site
docker compose up -d site
```

### Pinning to a specific version

In `docker-compose.yml`, change `:latest` to `:sha-abc1234` (every commit
gets a `sha-<short>` tag). Watchtower will stop auto-updating once you pin
to a non-`latest` tag.

### Disabling auto-updates

If you want manual control over deploys, remove the `watchtower:` service
from `docker-compose.yml` and re-run `docker compose up -d`. Updates then
require an explicit `docker compose pull && docker compose up -d`.

### Rollback

```sh
cd /opt/quitting7oh
docker compose pull ghcr.io/quitting7oh/quitting7oh.org:sha-<previous-sha>
# Edit docker-compose.yml to pin to that sha
docker compose up -d site
```

The previous image stays cached locally for a while after Watchtower
updates, so a fast rollback is usually as quick as editing the tag.

## Logs and troubleshooting

```sh
# Tail logs from all containers
docker compose logs -f --tail=100

# Just the site (nginx access log)
docker compose logs -f site

# Just Caddy (cert lifecycle, HTTPS errors)
docker compose logs -f caddy

# Watchtower's last update check
docker compose logs --tail=50 watchtower
```

**Common issues:**

| Symptom                              | Likely cause                                                  |
| ------------------------------------ | ------------------------------------------------------------- |
| TLS error / no cert                  | DNS not pointing to server yet, or port 80/443 not open       |
| `502 Bad Gateway` from Caddy         | `site` container failed health check — `docker compose logs site` |
| Updates not happening                | Watchtower can't pull — `docker login ghcr.io` if image is private |
| 404 on a page that should exist      | Hit `/healthz` to confirm nginx is serving; the file may not be in `dist/` |
| `permission denied` on docker.sock   | User not in `docker` group — `sudo usermod -aG docker $USER` and re-login |

## Backups

This site has **no database, no user accounts, no uploads** — there is
nothing on the server worth backing up. The entire site is regenerated
from the repo on every push. If the server dies, spin up a new one and
follow the steps above; total restore time is around 10 minutes.

The only stateful thing is Caddy's TLS certificates in the `caddy_data`
volume. Even those aren't worth backing up — Let's Encrypt will re-issue
on the new server within minutes.

## Hardening (optional)

The basics:

```sh
# Firewall — only 22, 80, 443 should be open
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable

# Disable password SSH; use keys only
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Keep the system patched
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Docker handles container isolation; the site is read-only static files; the
attack surface is small. The above is enough for a community site at this
scale.

## Scaling beyond one server

If traffic ever justifies it, you have options without restructuring:

- **Cloudflare in front.** Free plan, CDN cache, DDoS protection. Just
  change DNS to "proxied" in Cloudflare and origin server load drops by
  90%+.
- **Multiple servers behind DNS round-robin or a load balancer.** The site
  is fully stateless — any number of identical containers can serve in
  parallel. Just deploy the same compose file on N servers.
- **GHCR has CDN-backed pulls,** so cold-starting on new servers is fast.

But honestly: a single $5/month VPS will serve this site indefinitely.
Static sites are easy.
