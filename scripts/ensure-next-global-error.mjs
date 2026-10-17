import { mkdir, stat, writeFile } from "node:fs/promises";

const globalErrorPath = ".next/server/app/_global-error.html";

try {
  await stat(globalErrorPath);
} catch {
  await mkdir(".next/server/app", { recursive: true });
  await writeFile(
    globalErrorPath,
    "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Kya Khayen</title></head><body></body></html>\n",
    "utf8",
  );
}
