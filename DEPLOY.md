# Deployment Guide — SSS Monitor Hub
## Vercel + Neon Postgres — fastest path to a public URL

---

## STEP 0 — Critical pre-check (do this first)

Verify these two files are correct before touching anything else:

```
prisma/schema.prisma   → provider must be "postgresql"  (NOT sqlite)
vercel.json            → must exist at project root
```

Both are already correct in this package.

---

## STEP 1 — Create the Neon database (5 min)

1. Go to **https://neon.tech** → sign up (free) → New Project
2. Name: `sss-monitor-hub` — Region: **EU West (Frankfurt)** or closest to CH
3. Once created, go to **Dashboard → Connection Details**
4. Select **Prisma** in the "Connect from" dropdown
5. Copy the two connection strings shown:

```
# Pooled (for runtime queries — goes into DATABASE_URL on Vercel)
postgresql://user:pass@ep-xxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Direct (for migrations — goes into DIRECT_URL on Vercel AND locally)
postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

---

## STEP 2 — Generate secrets locally

Run these two commands. Copy the output — you will need it in Step 4.

```bash
node -e "console.log('AUTH_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('PROVIDER_TOKEN_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
```

---

## STEP 3 — Run migrations and seed against Neon (from your machine)

Use the **direct** URL (not pooled) for both commands.

```bash
# Apply the schema to Neon
DATABASE_URL="<direct-url>" DIRECT_URL="<direct-url>" npx prisma migrate deploy

# Load demo data (4 sites, 1 admin, 1 client)
DATABASE_URL="<direct-url>" npm run db:seed
```

On Windows (PowerShell):
```powershell
$env:DATABASE_URL="<direct-url>"; $env:DIRECT_URL="<direct-url>"; npx prisma migrate deploy
$env:DATABASE_URL="<direct-url>"; npm run db:seed
```

`migrate deploy` — not `migrate dev`. `migrate dev` is for local development only.
`migrate deploy` applies existing migrations in order, without generating new files. This is the correct command for production.

---

## STEP 4 — Push code to GitHub

```bash
git init          # if not already a git repo
git add .
git commit -m "Initial commit — SSS Monitor Hub"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/sss-monitor-hub.git
git push -u origin main
```

---

## STEP 5 — Deploy on Vercel

1. Go to **https://vercel.com** → New Project → Import from GitHub
2. Select your `sss-monitor-hub` repository
3. Framework: **Next.js** (auto-detected)
4. Root directory: leave empty (project is at root)
5. **Before clicking Deploy** → open **Environment Variables** and add all variables from the table below

---

## Environment variables — complete list for Vercel

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** URL | YES |
| `DIRECT_URL` | Neon **direct** URL | YES |
| `AUTH_SESSION_SECRET` | Output from Step 2 | YES |
| `PROVIDER_TOKEN_ENCRYPTION_KEY` | Output from Step 2 | YES |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | YES |
| `ENABLE_GLOBAL_DEMO_MODE` | `true` | YES (for demo) |
| `SYNC_CRON_SECRET` | Any random string (ex. `openssl rand -hex 32`) | YES |
| `ENPHASE_CLIENT_ID` | From developer-v4.enphase.com | Optional |
| `ENPHASE_CLIENT_SECRET` | From developer-v4.enphase.com | Optional |
| `ENPHASE_API_KEY` | From developer-v4.enphase.com | Optional |
| `ENPHASE_REDIRECT_URI` | `https://your-project.vercel.app/api/providers/enphase/callback` | Optional |
| `VICTRON_VRM_USERNAME` | VRM account email | Optional |
| `VICTRON_VRM_PASSWORD` | VRM account password | Optional |

6. Click **Deploy** → wait ~2 min for build to complete

---

## STEP 6 — Deployment checklist (strict order)

- [ ] Neon project created, both URLs copied
- [ ] `prisma/schema.prisma` — provider is `postgresql`, `directUrl` line present
- [ ] `vercel.json` — present at project root
- [ ] Secrets generated (AUTH_SESSION_SECRET + PROVIDER_TOKEN_ENCRYPTION_KEY)
- [ ] `prisma migrate deploy` run successfully against Neon direct URL
- [ ] `npm run db:seed` run successfully against Neon direct URL
- [ ] Code pushed to GitHub
- [ ] All environment variables added in Vercel (no trailing spaces, no quotes)
- [ ] `NEXT_PUBLIC_APP_URL` matches the actual Vercel deployment URL
- [ ] Vercel build completed without errors

---

## STEP 7 — Go-live verification (run after deployment)

Open `https://your-project.vercel.app` and verify in order:

- [ ] **Root URL** redirects to `/login` — app is running
- [ ] **Login as admin** (`adson@swisssolarsystem.com` / `admin1234`) → lands on `/admin`
- [ ] **Admin dashboard** shows 4 connections in the list
- [ ] **Login as client** (`regie@demo.ch` / `regie1234`) → lands on `/dashboard`
- [ ] **Dashboard** shows 4 site cards with live metrics (production, batterie, énergie du jour)
- [ ] **Click a site card** → detail page loads with chart and metrics grid
- [ ] **Address line** on site detail shows postal code + city (ex. `Chemin des Cèdres 4, 1009, Pully`)
- [ ] **Sync cron** — call `GET https://your-project.vercel.app/api/sync` → returns `{"success":true,"total":4,"ok":4,"errors":0}`
- [ ] **Mobile** — open on iPhone, check layout is readable

---

## After go-live — change credentials before showing to client

```bash
# In Vercel → Settings → Environment Variables:
# Set ENABLE_GLOBAL_DEMO_MODE=true  (keep for demo)

# Change passwords via the admin UI:
# /admin/utilisateurs → edit → new password
# Or run against Neon directly:
DATABASE_URL="<direct-url>" npx prisma studio
```

---

## Neon free tier limits (Neon Free)

| Resource | Limit |
|---|---|
| Storage | 512 MB |
| Compute | 0.25 vCPU (auto-suspends after 5 min idle) |
| Branches | 10 |

Sufficient for demonstration. Upgrade to Neon Launch ($19/mo) for production.

---

Swiss Solar System Sàrl · contact@swisssolarsystem.com · +41 21 552 04 40
