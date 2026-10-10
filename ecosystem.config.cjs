const cwd =
  process.env.KYAKHAYEN_DEPLOY_PATH || "/opt/kasa/kyakhayen-current";
const port = process.env.PORT || "3002";
const internalAppUrl =
  process.env.INTERNAL_APP_URL || `http://127.0.0.1:${port}`;

const baseEnv = {
  NODE_ENV: "production",
  PORT: port,
  INTERNAL_APP_URL: internalAppUrl,
};

module.exports = {
  apps: [
    {
      name: "kyakhayen-web",
      script: "npm",
      args: "run start",
      cwd,
      env: baseEnv,
      max_memory_restart: "768M",
    },
    {
      name: "kyakhayen-meal-plan-worker",
      script: "node",
      args: "workers/mealPlan.mjs",
      cwd,
      env: baseEnv,
      max_memory_restart: "512M",
      restart_delay: 3000,
    },
  ],
};
