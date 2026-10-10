import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const reason = (process.argv[2] || "manual").replace(/[^a-z0-9_-]/gi, "-");
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const backupDir =
  process.env.DB_BACKUP_DIR || path.join(process.cwd(), ".backups", "postgresql");
const retentionDays = Number(process.env.DB_BACKUP_RETENTION_DAYS || 30);
const s3Bucket = process.env.DB_BACKUP_S3_BUCKET;
const s3Prefix = (process.env.DB_BACKUP_S3_PREFIX || "kyakhayen/postgresql")
  .replace(/^\/+|\/+$/g, "");
const requireS3Backup = process.env.DB_BACKUP_S3_REQUIRED === "true";

function fail(message) {
  console.error(`[db-backup] ${message}`);
  process.exit(1);
}

function parseDatabaseUrl(value) {
  if (!value) fail("DIRECT_URL or DATABASE_URL is missing");

  const parsed = new URL(value);
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    fail(`Unsupported DATABASE_URL protocol: ${parsed.protocol}`);
  }

  const database = parsed.pathname.replace(/^\/+/, "");
  if (!database) fail("DATABASE_URL database name is missing");

  // Prisma accepts connection options that libpq/pg_dump does not understand.
  for (const option of ["schema", "connection_limit", "pool_timeout", "pgbouncer"]) {
    parsed.searchParams.delete(option);
  }

  return parsed.toString();
}

function removeOldLocalBackups() {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return;
  if (!fs.existsSync(backupDir)) return;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(backupDir)) {
    if (!file.startsWith("kyakhayen-") || !file.endsWith(".dump")) continue;

    const filePath = path.join(backupDir, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      console.log(`[db-backup] Removed old backup ${filePath}`);
    }
  }
}

async function createBackup() {
  const connectionUrl = parseDatabaseUrl(databaseUrl);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `kyakhayen-${reason}-${timestamp}.dump`;
  const filePath = path.join(backupDir, fileName);

  fs.mkdirSync(backupDir, { recursive: true });

  const dumpArgs = [
    `--dbname=${connectionUrl}`,
    "--format=custom",
    "--compress=9",
    "--no-owner",
    "--no-privileges",
    `--file=${filePath}`,
  ];

  console.log(`[db-backup] Creating ${filePath}`);

  await new Promise((resolve, reject) => {
    const dump = spawn("pg_dump", dumpArgs, { stdio: "inherit" });

    const cleanup = () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    };

    dump.on("error", (error) => {
      cleanup();
      reject(error);
    });
    dump.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        cleanup();
        reject(new Error(`pg_dump failed with exit code ${code}`));
      }
    });
  });

  const sizeMb = fs.statSync(filePath).size / 1024 / 1024;
  console.log(`[db-backup] Local backup complete (${sizeMb.toFixed(2)} MB)`);

  if (s3Bucket) {
    const key = `${s3Prefix}/${fileName}`;
    const destination = `s3://${s3Bucket}/${key}`;
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      fail("AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for S3 backups");
    }

    console.log(`[db-backup] Uploading to ${destination}`);
    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: fs.createReadStream(filePath),
          ContentType: "application/octet-stream",
        }),
      );
      console.log("[db-backup] S3 upload complete");
    } catch (error) {
      if (requireS3Backup) throw error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[db-backup] S3 upload skipped: ${message}`);
      console.warn("[db-backup] Local backup was kept successfully.");
    }
  }

  removeOldLocalBackups();
}

createBackup().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
