export function getWorkerSecret() {
  return (
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "")
  );
}

export function isCronOrWorkerRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;

  const workerSecret = getWorkerSecret();
  return Boolean(
    workerSecret &&
      request.headers.get("x-meal-plan-worker-secret") === workerSecret,
  );
}
