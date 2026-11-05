# Make MediHub public (your own domain + Cloudflare Tunnel)

This turns the website on your Fedora PC into a real internet address like
`https://medihub.pk`, with a padlock (HTTPS), **without** touching your router
and **without** a static IP.

Why Cloudflare Tunnel: most home connections in Pakistan sit behind CGNAT, so
normal "port forwarding" does not work. A tunnel makes an outgoing connection
from your PC to Cloudflare, so it works from any connection.

---

## What you need

- A domain name (about $10–15 per year for `.com`; `.pk` is bought from PKNIC
  and costs more).
- A free Cloudflare account.
- The Fedora PC kept on while the site should be online.

---

## Step 1 — Buy a domain

Good choices:

| Registrar | Notes |
| --- | --- |
| Cloudflare Registrar | Sells at cost, no markup. Needs a card that works internationally. |
| Porkbun | Cheap, simple. |
| Namecheap | Popular, frequent discounts. |
| PKNIC | Only for `.pk` / `.com.pk` domains. |

Buy the domain with your own name and email. You do **not** need hosting or
email add-ons.

---

## Step 2 — Add the domain to Cloudflare

1. Go to <https://dash.cloudflare.com> and create a free account.
2. Click **Add a site**, type your domain, choose the **Free** plan.
3. Cloudflare shows two nameservers, like `ada.ns.cloudflare.com`.
4. Log in to the registrar where you bought the domain, find
   **Nameservers / DNS**, and replace the existing ones with Cloudflare's two.
5. Wait. It usually takes 10 minutes to a few hours (max 24 hours).
   Cloudflare emails you when the domain is active.

---

## Step 3 — Create the tunnel

1. In Cloudflare, open **Zero Trust** (left menu).
2. Go to **Networks → Tunnels → Create a tunnel**.
3. Choose **Cloudflared**, name it `medihub`, save.
4. It shows an install command containing a long token. Keep that page open.

---

## Step 4 — Install the tunnel on the Fedora PC

Check the processor type first:

```bash
uname -m
```

If it prints `x86_64`, run:

```bash
curl -L -o /tmp/cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
```

```bash
sudo dnf install -y /tmp/cloudflared.rpm
```

Now paste the **install command from the Cloudflare page**. It looks like:

```bash
sudo cloudflared service install eyJhIjoi...long-token...
```

Check it is running:

```bash
sudo systemctl status cloudflared
```

The Cloudflare page should show the tunnel as **Healthy**.

---

## Step 5 — Point the domain at your website

Still in the tunnel settings, open **Public Hostname → Add a public hostname**:

| Field | Value |
| --- | --- |
| Subdomain | leave empty (for `medihub.pk`) |
| Domain | your domain |
| Type | `HTTP` |
| URL | `localhost:80` |

Save. Then add a second hostname for `www` the same way if you want
`www.medihub.pk` to work too.

Open `https://your-domain` in a browser. It should show the site.

In Cloudflare → **SSL/TLS → Overview**, set the mode to **Full**.
In **SSL/TLS → Edge Certificates**, turn on **Always Use HTTPS**.

---

## Step 6 — Protect the admin panel (strongly recommended)

The website is public, so `/admin/login` is public too. Cloudflare Access adds a
login step *before* anyone can even see the admin page. Free for up to 50 users.

1. Zero Trust → **Access → Applications → Add an application → Self-hosted**.
2. Name: `MediHub Admin`. Domain: your domain. Path: `admin*`.
3. Add a policy: **Allow**, rule **Emails**, list your email and the email of
   anyone who uploads content.
4. Repeat once more with path `api/admin*` (the same policy) so the API is
   protected too.
5. Login method: **One-time PIN** (Cloudflare emails a code — no password).

Now visitors opening `/admin` must confirm their email first, and only the
addresses you listed get in.

Inside the site, uploaders still log in with the normal admin email/password.
Use `reset-password.sh` to change it.

---

## Uploading from another PC or phone

Anyone you allow can log in from anywhere:

```
https://your-domain/admin/login
```

Files are saved on the Fedora PC's disk. Keep the PC on while uploading.

### Big files (over 100 MB)

Cloudflare's free plan rejects any single request over **100 MB**. The app works
around this automatically: files larger than 90 MB are cut into **20 MB pieces**
and sent one at a time, then joined on the server. The admin panel shows a
percentage while this happens.

- Works through Cloudflare, no compression needed.
- The app's own limit is **1 GB per file**.
- Weak connections: each piece is retried up to 4 times, so a small drop does
  not fail the whole upload.
- Abandoned pieces are removed automatically after 24 hours.

Compressing a PDF is still useful to save disk space and make downloads faster,
but it is no longer required to get past 100 MB.

> This requires the latest version of the code. On the Fedora PC run:
>
> ```bash
> cd ~/medihub-pakistan
> git pull
> cd deploy/selfhost
> sudo docker compose -f docker-compose.yml up -d --build
> ```
>
> (If you installed with the tarball method, download and extract the newest
> tarball again instead of `git pull`.)

Check free disk space now and then:

```bash
df -h ~/medihub-pakistan/deploy/selfhost
```

---

## Typical monthly cost

| Item | Cost |
| --- | --- |
| Domain | ~$10–15 / year |
| Cloudflare Tunnel + Access | free |
| Electricity for the old PC | depends on local rates |

---

## Troubleshooting

**Error 1033 / tunnel offline** — the tunnel service stopped:

```bash
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

**Error 502 / 521** — Cloudflare is fine but the website is down:

```bash
cd ~/medihub-pakistan/deploy/selfhost
sudo docker compose -f docker-compose.yml ps
sudo docker compose -f docker-compose.yml up -d
```

**Domain does not load at all** — nameservers were not changed at the registrar,
or Cloudflare still says "Pending". Wait and re-check.

**Site is slow** — the old PC has limited RAM. Avoid uploading while many people
are browsing, and keep backups.

---

## Keep it alive

- Disable sleep: **Settings → Power → Automatic Suspend → off**.
- The tunnel and the containers start automatically after a reboot.
- If the power or internet goes out, the site goes offline until it returns.
- Run `bash backup.sh` regularly and copy the backups off the PC.
