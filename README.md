# MediHub Pakistan

A study-resource platform for Pakistani MBBS and MDCAT students — full-stack app with a React frontend, Express API, PostgreSQL database and transactional email.

```
medihub-pakistan/
├── frontend/   # React 18 + Vite + Tailwind CSS + TanStack Query
└── backend/    # Node.js + Express + Prisma ORM + PostgreSQL + Nodemailer
```

## Features

- **Public site** (`/`, `/mbbs`, `/mdcat`, `/about`, `/contact`) with real client-side routing, per-page meta tags (react-helmet-async) and fully responsive layouts
- **Home** hero with live stat counters (resources / Telegram groups / students connected) fetched from `GET /api/stats`
- **MBBS Library** with search, category filters, pagination, loading skeletons and empty states — all driven by query params
- **MDCAT Prep** page with a live countdown timer fed by `GET /api/mdcat/status` (data-driven via the `mdcat_config` table, editable in admin)
- **Contact form** and **MDCAT notify-me** box with inline Zod validation, submitting states and toasts — hitting the real API
- **Admin dashboard** (`/admin`) protected by JWT: resources CRUD, contact inbox (mark read/replied), subscriber list, MDCAT countdown settings
- **Backend**: layered routes → controllers → services, Zod validation, helmet, CORS allow-list, rate limiting on all public POSTs, consistent JSON error shape, HTML sanitisation on text inputs
- **Emails** via Nodemailer SMTP (works with Resend/SendGrid): contact notification to admin + auto-reply to sender, double opt-in confirmation for subscribers. Without SMTP config, emails are logged to console instead of sent.

## Run on an EC2 instance (one command)

Images are prebuilt on Docker Hub (`irfanjat/medihub-api`, `irfanjat/medihub-web`) — nothing is compiled on the server.

**Option A — zero commands (recommended):** in the EC2 launch wizard, paste `deploy/ec2-user-data.sh` into **Advanced details → User data**. The instance installs Docker and starts the whole stack automatically on first boot.

**Option B — one command over SSH:**

```bash
ssh -i key.pem ec2-user@<EC2_PUBLIC_IP> 'curl -sL <raw-url-of-this-file>/ec2-user-data.sh | sudo bash'
# or copy first, then run:
scp -i key.pem deploy/setup.sh ec2-user@<EC2_PUBLIC_IP>:/tmp/ && ssh -i key.pem ec2-user@<EC2_PUBLIC_IP> 'sudo bash /tmp/setup.sh'
```

Requirements: security group with inbound TCP **22** (SSH) and **80** (HTTP). Works on Ubuntu 22.04+/Debian/Amazon Linux 2023, t2.micro upwards (script auto-adds swap on ≤2.5 GB instances). Site serves on port **80**.

Admin: `/admin/login` — seeded `admin@medihub.pk` / `ChangeMe!2024`. Change it after first login. Emails are logged to `docker logs medihub-api` until SMTP variables are added to `.env`.

## Prerequisites

- Node.js ≥ 18.17
- PostgreSQL ≥ 13 running locally (or any reachable Postgres)
- Or: Podman / Docker with Compose (see "Run the full stack in containers" below)

## Run the full stack in containers

One command builds and starts everything — Postgres, API (auto-migrates + seeds on boot) and an nginx web server:

```bash
# Podman users (Docker Desktop users can skip this export):
export DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock
systemctl --user enable --now podman.socket   # once, so the socket survives reboots

docker compose up -d --build                  # from the project root
```

The site is then served at **http://localhost:8081** (nginx proxies `/api/*` to the API container).

Useful commands:

```bash
docker compose ps                # status of db / api / web
docker compose logs -f api       # API logs (emails are logged here until SMTP is configured)
docker compose down              # stop (add -v to also wipe the database volume)
```

Admin panel: http://localhost:8081/admin/login — seeded `admin@medihub.pk` / `ChangeMe!2024`.
To change the admin password or SMTP settings before first start, edit the `environment:` block for `api` in `docker-compose.yml`.

## 1 · Database setup

```bash
# Create the database (adjust credentials to your Postgres install)
createdb medihub        # or: psql -c "CREATE DATABASE medihub;"
```

## 2 · Backend

```bash
cd backend
cp .env.example .env      # then edit values (DATABASE_URL, JWT_SECRET, …)
npm install
npm run migrate           # prisma migrate dev --name init  (creates tables)
npm run seed              # seeds sample resources, mdcat config & admin user
npm run dev               # → http://localhost:5000
```

Default seeded admin (change via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding):

| Email | Password |
| --- | --- |
| `admin@medihub.pk` | `ChangeMe!2024` |

Sanity checks:

- `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
- `GET http://localhost:5000/api/mdcat/status` → launch date + phase for the countdown

## 3 · Frontend

```bash
cd frontend
cp .env.example .env      # optional; Vite proxies /api → :5000 in dev
npm install
npm run dev               # → http://localhost:5173
```

Open <http://localhost:5173>. Sign in at `/admin/login` with the seeded admin credentials.

## Environment variables

### backend/.env

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Admin token signing |
| `CLIENT_ORIGIN` | CORS allow-list (comma-separated origins) |
| `WEB_APP_URL`, `API_URL` | Used to build email links (confirm subscription etc.) |
| `SMTP_HOST/PORT/USER/PASS` | Nodemailer transport (Resend: `smtp.resend.com` + API key; SendGrid: `smtp.sendgrid.net` + `apikey`) |
| `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | From-address and admin inbox for contact notifications |
| `CONTACT_AUTOREPLY` | Set `false` to disable auto-reply to senders |
| `STUDENTS_BASELINE` | Display baseline for the “students connected” counter |

### frontend/.env (optional in dev)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Absolute API base (defaults to `/api`, proxied by Vite) |

## API reference (summary)

Public:

- `GET /api/resources?category=&year=&search=&page=&limit=`
- `GET /api/resources/:id`
- `GET /api/stats`
- `GET /api/mdcat/status`
- `POST /api/contact` *(rate-limited)*
- `POST /api/subscribe` *(rate-limited)*
- `GET /api/subscribe/confirm/:token`

Admin (JWT Bearer):

- `POST /api/admin/login`
- `GET /api/admin/me` · `GET /api/admin/stats`
- `GET|POST /api/admin/resources` · `PUT|DELETE /api/admin/resources/:id`
- `GET /api/admin/messages?status=` · `PATCH /api/admin/messages/:id`
- `GET /api/admin/subscribers`
- `PUT /api/admin/mdcat-config`

Errors always return `{ "error": { "message": "...", "details"?: { field: msg } } }`.

## Production notes

- Build the SPA with `npm run build` (frontend) and serve `dist/` behind any static host/reverse proxy.
- Point `VITE_API_URL` at your deployed API and set matching CORS/URL env vars on the backend.
- Run migrations with `npm run deploy` (`prisma migrate deploy`) instead of `migrate`.
