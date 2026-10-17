import withSerwistInit from "@serwist/next";
import fs from "node:fs";
import path from "node:path";

const enableDevelopmentServiceWorker =
  process.env.ENABLE_DEV_SERVICE_WORKER === "true" ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_SERVICE_WORKER === "true";

/** @type {import('next').NextConfig} */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development" && !enableDevelopmentServiceWorker,
});

const mediaRemotePattern = process.env.NEXT_PUBLIC_MEDIA_URL
  ? (() => {
      const mediaUrl = new URL(process.env.NEXT_PUBLIC_MEDIA_URL);
      const pathname = mediaUrl.pathname.replace(/\/+$/, "");

      return {
        protocol: mediaUrl.protocol.replace(":", ""),
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: `${pathname}/**`,
      };
    })()
  : null;

const ensureVercelRouteArtifacts = (appDir) => {
  const fallback = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kya Khayen</title></head><body></body></html>\n';
  const walk = (directory, segments = []) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath, [...segments, entry.name]);
        continue;
      }
      if (entry.name === "route.js") {
        const route = segments.filter((segment) => !segment.startsWith("(") && !segment.includes("["));
        if (route.length) {
          const bodyPath = path.join(appDir, `${route.join("/")}.body`);
          if (!fs.existsSync(bodyPath)) {
            fs.mkdirSync(path.dirname(bodyPath), { recursive: true });
            fs.writeFileSync(bodyPath, "");
          }
        }
        continue;
      }
      if (entry.name !== "page.js") continue;
      const route = segments.filter((segment) => !segment.startsWith("(") && !segment.includes("[") && segment !== "api");
      const htmlPath = path.join(appDir, route.length ? `${route.join("/")}.html` : "index.html");
      if (!fs.existsSync(htmlPath)) {
        fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
        fs.writeFileSync(htmlPath, fallback);
      }
      const rscPath = path.join(appDir, route.length ? `${route.join("/")}.rsc` : "index.rsc");
      if (!fs.existsSync(rscPath)) fs.writeFileSync(rscPath, "");
    }
  };
  walk(appDir);
  for (const route of [
    "tools/what-can-i-cook-with-ingredients",
    "tools/what-to-cook-today",
    "tools/budget-meal-planner",
    "tools/menu-for-guests-at-home",
    "tools/kids-meal-ideas",
    "tools/food-compare",
    "tools/smart-budget-meals",
    "tools/smart-guest-menu",
    "tools/smart-kids-meals",
    "tools/smart-food-compare",
  ]) {
    for (const suffix of ["html", "rsc"]) {
      const routePath = path.join(appDir, `${route}.${suffix}`);
      if (!fs.existsSync(routePath)) {
        fs.mkdirSync(path.dirname(routePath), { recursive: true });
        fs.writeFileSync(routePath, suffix === "html" ? fallback : "");
      }
    }
  }
  const globalError = path.join(appDir, "_global-error.html");
  if (!fs.existsSync(globalError)) fs.writeFileSync(globalError, fallback);
};

const NextConfig = {
  experimental: {
    // Public pages use ISR. Generate them serially during a deployment so a
    // build cannot stampede the Neon connection pool with concurrent Prisma
    // queries. Runtime visitors are served from Next's cache.
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 10_000,
    staticGenerationRetryCount: 0,
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/tools/what-can-i-cook-with-ingredients",
        destination: "/tools/smart-recipe-finder",
        permanent: true,
      },
      {
        source: "/tools/what-to-cook-today",
        destination: "/tools/smart-daily-menu",
        permanent: true,
      },
      {
        source: "/tools/budget-meal-planner",
        destination: "/tools/smart-budget-meals",
        permanent: true,
      },
      {
        source: "/tools/menu-for-guests-at-home",
        destination: "/tools/smart-guest-menu",
        permanent: true,
      },
      {
        source: "/tools/kids-meal-ideas",
        destination: "/tools/smart-kids-meals",
        permanent: true,
      },
      {
        source: "/tools/food-compare",
        destination: "/tools/smart-food-compare",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*\\.(jpg|jpeg|png|webp|avif|gif|svg|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      ...(mediaRemotePattern ? [mediaRemotePattern] : []),
      // Cloudinary is the primary media provider for migrated and new images.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Keep legacy S3 records renderable until stored URLs are migrated.
      {
        protocol: "https",
        hostname: "kyakhayen-dev.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "kyakhayen-prod.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  webpack: (config, { isServer, dir }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    if (isServer) {
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.done.tap("EnsureVercelRouteArtifacts", () => {
            const appDir = path.join(dir, ".next", "server", "app");
            if (fs.existsSync(appDir)) ensureVercelRouteArtifacts(appDir);
          });
        },
      });
    }
    return config;
  },
};

export default withSerwist(NextConfig);
