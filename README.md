# Kya Khayen PostgreSQL

This is the PostgreSQL/Vercel migration copy of Kya Khayen. The original MySQL repository remains separate and unchanged.

## Local setup

The local PostgreSQL cluster uses port `55432`, stores its files in the ignored
`.postgres-data` directory, and can be managed from npm.

```bash
npm ci
npm run db:local:start
node scripts/configure-local-postgresql.mjs ../kyakhayen/.env
npm run db:validate
npm run db:migrate:deploy
node scripts/migrate-mysql-data.mjs ../kyakhayen
npm run db:smoke
npm run dev
```

The configuration command preserves the original project's non-database secrets,
replaces only the database URLs, and protects `.env` with owner-only permissions.
The data migration command truncates the target application tables before copying,
so use it only for an empty/rehearsal PostgreSQL target or during a controlled cutover.

## Migration and deployment

- MySQL data migration: `docs/mysql-to-postgresql-migration.md`
- Vercel deployment: `docs/deployment.md`
- Active PostgreSQL migrations: `prisma/migrations`
- Archived MySQL migrations: `prisma/migrations-mysql`

## Media storage

Cloudinary is the preferred provider for new public image and video uploads. Configure it from **Admin → Site Settings** after setting `SITE_SETTINGS_ENCRYPTION_KEY`. The existing S3 integration is retained for old assets, fallback uploads, private meal-plan files and database backups.

Useful checks:

```bash
npm run check
npm run build
npm run db:migrate:status
npm run db:smoke
```
