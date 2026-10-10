#!/usr/bin/env node

import { chmod, copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = process.argv[2];
const targetPath = resolve(process.cwd(), ".env");
const localUrl = "postgresql://postgres@127.0.0.1:55432/kyakhayen_dev?schema=public";

if (!sourcePath) {
  console.error("Usage: node scripts/configure-local-postgresql.mjs /path/to/source/.env");
  process.exit(1);
}

await copyFile(resolve(sourcePath), targetPath);
let env = await readFile(targetPath, "utf8");

const setVariable = (contents, name, value) => {
  const nextLine = `${name}=\"${value}\"`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  return pattern.test(contents)
    ? contents.replace(pattern, nextLine)
    : `${contents.trimEnd()}\n${nextLine}\n`;
};

env = setVariable(env, "DATABASE_URL", localUrl);
env = setVariable(env, "DIRECT_URL", localUrl);
await writeFile(targetPath, env, { mode: 0o600 });
await chmod(targetPath, 0o600);

console.log("Local PostgreSQL environment configured in .env (credentials hidden).");
