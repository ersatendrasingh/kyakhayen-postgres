#!/usr/bin/env node

import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Prisma, PrismaClient as TargetPrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const sourceProject = process.argv[2];
if (!sourceProject) {
  console.error("Usage: node scripts/migrate-mysql-data.mjs /path/to/mysql/project");
  process.exit(1);
}

const sourceEnv = await readFile(resolve(sourceProject, ".env"), "utf8");
const urlMatch = sourceEnv.match(/^DATABASE_URL\s*=\s*(.+)$/m);
if (!urlMatch) throw new Error("Source DATABASE_URL is missing.");

const sourceUrl = urlMatch[1].trim().replace(/^([\"'])(.*)\1$/, "$2");
const sourceRequire = createRequire(resolve(sourceProject, "package.json"));
const { PrismaClient: SourcePrismaClient } = sourceRequire("@prisma/client");

const source = new SourcePrismaClient({ datasources: { db: { url: sourceUrl } } });
const target = new TargetPrismaClient();
const models = Prisma.dmmf.datamodel.models;
const quote = (identifier) => `"${identifier.replaceAll('"', '""')}"`;
const delegateName = (modelName) => modelName[0].toLowerCase() + modelName.slice(1);

try {
  await source.$connect();
  await target.$connect();

  const tableList = models
    .map((model) => quote(model.dbName ?? model.name))
    .join(", ");

  const counts = {};
  await target.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
      await tx.$executeRawUnsafe("SET LOCAL session_replication_role = replica");

      for (const model of models) {
        const delegate = delegateName(model.name);
        let copied = 0;

        while (true) {
          const rows = await source[delegate].findMany({ skip: copied, take: 250 });
          if (rows.length === 0) break;
          await tx[delegate].createMany({ data: rows });
          copied += rows.length;
        }

        counts[model.name] = copied;
        console.log(`${model.name}: ${copied}`);
      }
    },
    { maxWait: 30_000, timeout: 1_800_000 },
  );

  for (const model of models) {
    const table = model.dbName ?? model.name;
    for (const field of model.fields) {
      if (field.default?.name !== "autoincrement") continue;
      const column = field.dbName ?? field.name;
      await target.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('${quote(table)}', '${column}'), COALESCE(MAX(${quote(column)}), 1), MAX(${quote(column)}) IS NOT NULL) FROM ${quote(table)}`,
      );
    }
  }

  const totalRows = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`Migration complete: ${models.length} tables, ${totalRows} rows.`);
} finally {
  await Promise.allSettled([source.$disconnect(), target.$disconnect()]);
}
