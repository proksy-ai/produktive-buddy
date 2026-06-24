# Deploy Kairo to Google Cloud (production)

Architecture: **Cloud Run** (the app) + **Cloud SQL for PostgreSQL** (database) +
**Secret Manager** (secrets) + **Cloud Scheduler** (15-min sheet sync) + a custom
domain from Hostinger mapped to Cloud Run.

> Replace placeholders: `PROJECT_ID`, `REGION` (e.g. `asia-south1` = Mumbai),
> `DB_PASSWORD`, `app.yourdomain.com`.

---

## 0. One-time prerequisites (your machine)

```bash
# Install the gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project PROJECT_ID

# Enable the APIs we use
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com
```

## 1. Create the database (Cloud SQL Postgres)

```bash
gcloud sql instances create kairo-db \
  --database-version=POSTGRES_16 \
  --tier=db-perf-optimized-N-2 \
  --region=REGION \
  --storage-size=10GB --storage-auto-increase

# Smallest/cheapest alternative tier: --edition=ENTERPRISE --tier=db-f1-micro

gcloud sql databases create kairo --instance=kairo-db
gcloud sql users create kairo --instance=kairo-db --password='DB_PASSWORD'

# Note the connection name -> PROJECT_ID:REGION:kairo-db
gcloud sql instances describe kairo-db --format='value(connectionName)'
```

## 2. Create secrets

```bash
# Generate strong values
openssl rand -base64 48   # -> AUTH_SECRET
openssl rand -base64 32   # -> CRON_SECRET
npx web-push generate-vapid-keys   # -> VAPID public/private (optional, for push)

CONN="PROJECT_ID:REGION:kairo-db"

printf '%s' 'PASTE_AUTH_SECRET'  | gcloud secrets create AUTH_SECRET  --data-file=-
printf '%s' 'PASTE_CRON_SECRET'  | gcloud secrets create CRON_SECRET  --data-file=-
printf '%s' 're_PASTE_RESEND_KEY' | gcloud secrets create RESEND_API_KEY --data-file=-
printf '%s' 'Kairo <login@yourdomain.com>' | gcloud secrets create EMAIL_FROM --data-file=-
printf '%s' 'PASTE_VAPID_PUBLIC'  | gcloud secrets create VAPID_PUBLIC_KEY --data-file=-
printf '%s' 'PASTE_VAPID_PRIVATE' | gcloud secrets create VAPID_PRIVATE_KEY --data-file=-
printf '%s' 'mailto:you@yourdomain.com' | gcloud secrets create VAPID_SUBJECT --data-file=-

# DATABASE_URL uses the Cloud SQL unix socket (Cloud Run mounts it):
printf '%s' "postgresql://kairo:DB_PASSWORD@/kairo?host=/cloudsql/${CONN}" \
  | gcloud secrets create DATABASE_URL --data-file=-
```

## 3. Create the schema + seed (one-time, via Cloud SQL Auth Proxy)

```bash
# Download the proxy: https://cloud.google.com/sql/docs/postgres/sql-proxy
./cloud-sql-proxy PROJECT_ID:REGION:kairo-db &   # listens on 127.0.0.1:5432

# In the repo, point Prisma at the proxy and push the schema + seed
export DIRECT_URL="postgresql://kairo:DB_PASSWORD@127.0.0.1:5432/kairo"
export DATABASE_URL="$DIRECT_URL"
npx prisma db push
npm run db:seed
npm run sync:sheets   # pull live timetable data

kill %1   # stop the proxy
```

## 4. Deploy to Cloud Run

Grant the runtime service account access to secrets + Cloud SQL (first deploy only):

```bash
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for s in AUTH_SECRET CRON_SECRET RESEND_API_KEY EMAIL_FROM VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_SUBJECT DATABASE_URL; do
  gcloud secrets add-iam-policy-binding "$s" \
    --member="serviceAccount:${SA}" --role=roles/secretmanager.secretAccessor
done
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:${SA}" --role=roles/cloudsql.client
```

Deploy (builds from the Dockerfile automatically):

```bash
gcloud run deploy kairo \
  --source . \
  --region REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:REGION:kairo-db \
  --min-instances 0 --max-instances 4 \
  --cpu 1 --memory 512Mi --concurrency 80 \
  --set-secrets "AUTH_SECRET=AUTH_SECRET:latest,CRON_SECRET=CRON_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,EMAIL_FROM=EMAIL_FROM:latest,VAPID_PUBLIC_KEY=VAPID_PUBLIC_KEY:latest,VAPID_PRIVATE_KEY=VAPID_PRIVATE_KEY:latest,VAPID_SUBJECT=VAPID_SUBJECT:latest,DATABASE_URL=DATABASE_URL:latest"
```

Health check: open `https://<run-url>/api/health` → should return `{ "ok": true }`.

> **Web Push (optional):** the public VAPID key must be baked in at build time.
> When you want push, build with the key and deploy that image instead:
> ```bash
> gcloud builds submit --config cloudbuild.yaml \
>   --substitutions=_REGION=REGION,_REPO=kairo,_VAPID_PUBLIC=YOUR_PUBLIC_KEY
> gcloud run deploy kairo --image REGION-docker.pkg.dev/PROJECT_ID/kairo/kairo:latest \
>   --region REGION ...(same flags as above)
> ```

## 5. Schedule the 15-minute sheet sync

```bash
RUN_URL=$(gcloud run services describe kairo --region REGION --format='value(status.url)')

gcloud scheduler jobs create http kairo-sync \
  --location REGION \
  --schedule "*/15 * * * *" \
  --uri "${RUN_URL}/api/cron/sync-sheets" \
  --http-method POST \
  --headers "Authorization=Bearer PASTE_CRON_SECRET"
```

## 6. Map your Hostinger domain

```bash
gcloud beta run domain-mappings create \
  --service kairo --region REGION --domain app.yourdomain.com
# Prints DNS records (usually a CNAME to ghs.googlehosted.com, or A/AAAA).
```

Add the printed record(s) in **Hostinger → DNS**. Cloud Run auto-provisions a
managed TLS certificate (can take 15–60 min to go live).

> If domain mappings aren't offered in your region, use a Global External HTTPS
> Load Balancer with a serverless NEG pointing at the Cloud Run service instead.

## 7. Re-deploys

```bash
gcloud run deploy kairo --source . --region REGION
```

Schema changes: re-run the proxy + `npx prisma db push` from step 3 before deploying.

---

## Security guardrails in place

- Secrets only in Secret Manager (never in the image or repo).
- HTTPS enforced by Cloud Run + HSTS header in production.
- Security headers + CSP, `X-Frame-Options: DENY`, `nosniff`, strict referrer.
- Same-origin (CSRF) checks on mutating routes; httpOnly + Secure session cookie.
- Email-domain-gated sign-in (`@iimk.ac.in`) + hashed, expiring OTP with attempt limits.
- Cron endpoint requires `Bearer CRON_SECRET`.
- Non-root container user; least-privilege runtime service account.

## Known follow-ups (not blockers)

- Rate limiting is in-memory per instance; move to Memorystore/Redis if you run
  many instances or need strict global limits.
- CSP keeps `script-src 'unsafe-inline'` (Next inlines hydration); tighten to a
  nonce/hash policy later if required by audit.
- Schema is applied via `prisma db push`; switch to versioned migrations
  (`prisma migrate`) before multiple people deploy concurrently.
