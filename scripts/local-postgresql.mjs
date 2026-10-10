#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const action = process.argv[2] || "status";
const root = process.cwd();
const dataDir = resolve(root, ".postgres-data");
const logFile = resolve(root, "postgres.log");
const port = process.env.LOCAL_POSTGRES_PORT || "55432";
const database = process.env.LOCAL_POSTGRES_DATABASE || "kyakhayen_dev";

if (!/^\d+$/.test(port) || !/^[a-zA-Z0-9_]+$/.test(database)) {
  throw new Error("Invalid LOCAL_POSTGRES_PORT or LOCAL_POSTGRES_DATABASE.");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function status(quiet = false) {
  return run("pg_ctl", ["-D", dataDir, "status"], {
    stdio: quiet ? "ignore" : "inherit",
  });
}

function ensureDatabase() {
  const query = `SELECT 1 FROM pg_database WHERE datname = '${database}'`;
  const result = spawnSync(
    "psql",
    ["-h", "127.0.0.1", "-p", port, "-U", "postgres", "-d", "postgres", "-Atc", query],
    { encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || "Unable to inspect PostgreSQL databases.");
  if (result.stdout.trim() !== "1") {
    const code = run("createdb", ["-h", "127.0.0.1", "-p", port, "-U", "postgres", database]);
    if (code !== 0) process.exit(code);
  }
}

if (action === "start") {
  mkdirSync(dataDir, { recursive: true });
  if (!existsSync(resolve(dataDir, "PG_VERSION"))) {
    const code = run("initdb", ["-D", dataDir, "-U", "postgres", "--auth-local=trust", "--auth-host=trust", "--encoding=UTF8", "--no-locale"]);
    if (code !== 0) process.exit(code);
  }
  if (status(true) !== 0) {
    const code = run("pg_ctl", ["-D", dataDir, "-l", logFile, "-o", `-p ${port} -h 127.0.0.1`, "start"]);
    if (code !== 0) process.exit(code);
  }
  ensureDatabase();
  console.log(`Local PostgreSQL is ready on 127.0.0.1:${port}/${database}.`);
} else if (action === "stop") {
  if (status(true) === 0) process.exit(run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"]));
  console.log("Local PostgreSQL is already stopped.");
} else if (action === "status") {
  process.exit(status());
} else {
  console.error("Usage: node scripts/local-postgresql.mjs <start|stop|status>");
  process.exit(1);
}
