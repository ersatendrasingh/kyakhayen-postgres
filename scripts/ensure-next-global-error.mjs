import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const appOutputDir = ".next/server/app";
const fallbackHtml =
  "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Kya Khayen</title></head><body></body></html>\n";

async function addStaticRouteFallbacks(directory, relativeSegments = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await addStaticRouteFallbacks(entryPath, [...relativeSegments, entry.name]);
      continue;
    }

    if (entry.name !== "page.js") continue;

    const routeSegments = relativeSegments.filter(
      (segment) => !segment.startsWith("(") && !segment.includes("[") && segment !== "api",
    );
    const htmlPath =
      routeSegments.length === 0
        ? path.join(appOutputDir, "index.html")
        : path.join(appOutputDir, `${routeSegments.join("/")}.html`);
    try {
      await stat(htmlPath);
    } catch {
      await mkdir(path.dirname(htmlPath), { recursive: true });
      await writeFile(htmlPath, fallbackHtml, "utf8");
    }
  }
}

await addStaticRouteFallbacks(appOutputDir);

const globalErrorPath = path.join(appOutputDir, "_global-error.html");
try {
  await stat(globalErrorPath);
} catch {
  await writeFile(globalErrorPath, fallbackHtml, "utf8");
}
