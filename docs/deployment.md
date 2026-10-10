# Kya Khayen PostgreSQL on Vercel

This project is the PostgreSQL/Vercel variant of Kya Khayen. The original MySQL migration history is archived in `prisma/migrations-mysql`; only `prisma/migrations` is applied to PostgreSQL.

## Runtime layout

- Web and API routes: Vercel Next.js functions.
- Database: managed PostgreSQL with a pooled runtime URL and a direct migration URL.
- Queue: Upstash Redis through `REDIS_URL`.
- Queue worker: bounded Vercel function at `/api/cron/meal-plan-worker`.
- Scheduler: an external HTTP scheduler on Vercel Hobby; native Vercel Cron can be used on a plan that supports the required frequency.
- Public media: Cloudinary primary with the existing S3 storage retained as automatic fallback.
- Private meal-plan files and PostgreSQL backups: the existing S3-compatible object storage.

## Required Vercel variables

```text
NEXT_PUBLIC_APP_URL=https://www.kyakhayen.com
AUTH_URL=https://www.kyakhayen.com
AUTH_TRUST_HOST=true

DATABASE_URL=<pooled PostgreSQL URL>
DIRECT_URL=<direct PostgreSQL URL>

REDIS_URL=<managed Redis TLS URL>
MEAL_PLAN_WORKER_SECRET=<random secret>
CRON_SECRET=<different random secret>

VERCEL_WORKER_CRON_TIMEOUT_MS=240000
VERCEL_WORKER_CONCURRENCY=1
MEAL_PLAN_WORKER_TIMEOUT_MS=240000

SITE_SETTINGS_ENCRYPTION_KEY=<at least 32 random characters>
```

Keep the existing authentication, email, S3, Razorpay, social, push and OAuth variables. `DATABASE_URL` is used by the application. `DIRECT_URL` is used only by Prisma migrations and PostgreSQL backups.

## Cloudinary media setup

1. Deploy the database migration and application.
2. Sign in as an admin and open `/admin/site-settings`.
3. Keep **Cloudinary** selected as the primary provider.
4. Enter the Cloudinary cloud name, API key and API secret, then save.
5. Use **Test connection** before uploading media.

The API secret is encrypted with `SITE_SETTINGS_ENCRYPTION_KEY` before it is stored and is never returned to the browser. `SOCIAL_TOKEN_ENCRYPTION_KEY` is accepted as a migration fallback, but production should define the dedicated key.

Cloudinary credentials can alternatively be bootstrapped through `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Database values saved in Site Settings take precedence. Existing S3 URLs remain unchanged, and new uploads fall back to S3 automatically whenever Cloudinary has not been configured.

## Database deployment

Never run the archived MySQL migrations against PostgreSQL.

Apply the PostgreSQL baseline and later migrations from CI or a trusted release machine:

```bash
npm ci
npx prisma validate
npx prisma migrate deploy
npm run build
```

The initial PostgreSQL schema is in `prisma/migrations/20261010000000_postgresql_baseline/migration.sql`.

For an existing MySQL production database, follow `docs/mysql-to-postgresql-migration.md` and use its Prisma data-copy workflow.

## Scheduler setup on Vercel Hobby

Vercel Hobby does not support frequent native cron schedules. Configure an external HTTPS scheduler and add this header to every request:

```text
Authorization: Bearer <CRON_SECRET>
```

| Purpose | URL | Schedule |
| --- | --- | --- |
| Process meal plans, notifications and content jobs | `https://www.kyakhayen.com/api/cron/meal-plan-worker` | Every minute |
| Repair traffic notification schedules | `https://www.kyakhayen.com/api/cron/traffic-sync` | Every 6 hours |
| Repair membership expiry reminders | `https://www.kyakhayen.com/api/cron/expiry-reminders` | Daily |

The worker exits after the queue drains or its configured time window expires. BullMQ owns job retries; scheduler retries must not create duplicate application work.

## Backups

The backup command now uses `pg_dump` and prefers `DIRECT_URL`:

```bash
npm run backup:db -- manual
```

Backups are PostgreSQL custom-format `.dump` files. When `DB_BACKUP_S3_BUCKET` is configured they are uploaded below `DB_BACKUP_S3_PREFIX`, which defaults to `kyakhayen/postgresql`.

Restore into a separate staging database first:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="$DIRECT_URL" /path/to/kyakhayen-backup.dump
```

## Production smoke tests

1. Home, recipe listing, recipe details, articles and sitemap render successfully.
2. Credentials login and Google login both work.
3. Admin recipe create/edit/publish works.
4. Favorites, reviews, comments, reactions and view tracking write successfully.
5. Meal-plan generation progresses after the next worker wake-up.
6. PDF upload/download and email delivery work.
7. Push campaigns and scheduled notifications are not duplicated.
8. Pinterest credentials can be connected and refreshed.
9. Razorpay webhook processing is idempotent.
10. `npm run backup:db` creates a restorable PostgreSQL dump.
11. Site Settings reports Cloudinary as ready, a test image upload returns a Cloudinary URL, and an older S3 asset still renders.

Keep the source MySQL database read-only for at least one rollback window after production cutover.
