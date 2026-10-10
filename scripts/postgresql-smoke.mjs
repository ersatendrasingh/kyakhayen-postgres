import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("[postgresql-smoke] DATABASE_URL is missing");
  process.exit(1);
}

const protocol = new URL(process.env.DATABASE_URL).protocol;
if (protocol !== "postgres:" && protocol !== "postgresql:") {
  console.error(`[postgresql-smoke] Expected PostgreSQL URL, received ${protocol}`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1`;

  const [
    recipes,
    publishedRecipes,
    users,
    ingredients,
    recipeMethods,
    orders,
    notificationCampaigns,
    scheduledPosts,
  ] = await Promise.all([
    prisma.recipes.count(),
    prisma.recipes.count({ where: { isPublished: true } }),
    prisma.user.count(),
    prisma.ingredients.count(),
    prisma.recipeMethods.count(),
    prisma.order.count(),
    prisma.notificationCampaign.count(),
    prisma.contentPipelineScheduledPost.count(),
  ]);

  console.log("[postgresql-smoke] connection: ok");
  console.table({
    recipes,
    publishedRecipes,
    users,
    ingredients,
    recipeMethods,
    orders,
    notificationCampaigns,
    scheduledPosts,
  });
} catch (error) {
  console.error("[postgresql-smoke] failed", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
