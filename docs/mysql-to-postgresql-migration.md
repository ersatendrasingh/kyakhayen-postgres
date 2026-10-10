# MySQL to PostgreSQL Migration

This runbook moves the existing Kya Khayen data into the PostgreSQL schema without changing the original MySQL project.

## Safety rules

- Rehearse against staging before the production cutover.
- Take a verified MySQL dump before every import attempt.
- Stop the web app, workers, schedulers, webhooks and admin writes for the final import.
- Keep MySQL read-only until PostgreSQL has passed the rollback window.
- Never expose either database URL in shell history, build logs or committed files.

## 1. Measure and back up MySQL

Record the database size, table counts and current migration state. Create a compressed logical dump using the original MySQL project's backup process.

## 2. Create an empty PostgreSQL database

Create the database in the same broad region as the Vercel functions. Obtain both URLs:

```text
DATABASE_URL=<pooled runtime URL>
DIRECT_URL=<direct migration URL>
```

The import must use the direct URL.

## 3. Apply the PostgreSQL baseline

Set the target's `DATABASE_URL` and `DIRECT_URL`, then create the PostgreSQL schema:

```bash
npm run db:migrate:deploy
```

## 4. Copy MySQL data

Use the original MySQL project directory as the source. This command clears only
the target application's tables, copies scalar data in batches, preserves IDs,
temporarily disables target triggers inside one transaction, and resets sequences.

```bash
node scripts/migrate-mysql-data.mjs /absolute/path/to/kyakhayen
```

The target must already contain the baseline schema. Keep the original project and
its `.env` readable on the migration machine; credentials are never printed.

`pgloader` remains an optional alternative via `scripts/pgloader.load.example`, but
it may not authenticate with MySQL 9 `caching_sha2_password`. If pgloader creates
the schema itself, compare it with Prisma before cutover:

```bash
npx prisma migrate diff \
  --from-url "$DIRECT_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Review every statement. Apply only reviewed alignment changes, then mark the baseline as represented:

```bash
npx prisma migrate resolve \
  --applied 20261010000000_postgresql_baseline
```

Do not run `migrate deploy` against pgloader-created production tables before resolving the baseline.

## 5. Verify data

Compare row counts for every table, then specifically verify:

- published recipes, ingredients, methods and taxonomy joins;
- users, Auth.js accounts and verification tokens;
- memberships, plans, orders, items and coupons;
- comments, reviews, favorites and reactions;
- push subscriptions, campaigns and deliveries;
- content schedules, publish attempts and encrypted social credentials;
- JSON fields, timestamps, enum values and large text fields.

Run `npm run db:smoke` against the target database for application-level counts and connection checks.

## 6. Production cutover

1. Put the existing site into maintenance/read-only mode.
2. Stop BullMQ workers and all schedulers.
3. Take the final MySQL backup.
4. Recreate or clear the target staging-tested PostgreSQL database.
5. Apply the baseline and run the final Prisma data-copy command.
6. Run migration status, row-count and application smoke checks.
7. Set Vercel `DATABASE_URL` and `DIRECT_URL` for Production.
8. Deploy the PostgreSQL branch.
9. Run the production smoke tests from `docs/deployment.md`.
10. Re-enable schedulers only after write-path verification succeeds.

## 7. Rollback

If critical verification fails, disable PostgreSQL writes, restore the previous Vercel environment variables, redeploy the MySQL release, and re-enable the original workers. Reconcile any PostgreSQL-only writes before attempting another cutover.
