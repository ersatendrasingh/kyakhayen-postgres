import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";

const allowedMediaTypes = ["image/", "video/", "audio/"];
const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^\[?::1\]?$/i,
];

function isAllowedUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(url.protocol)) return false;
  return !privateHostPatterns.some((pattern) => pattern.test(url.hostname));
}

export async function GET(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get("url");
  if (!mediaUrl || !isAllowedUrl(mediaUrl)) {
    return NextResponse.json({ error: "Invalid media URL." }, { status: 400 });
  }

  const response = await fetch(mediaUrl, {
    headers: {
      "User-Agent": "KyakhayenContentPipeline/1.0",
    },
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Unable to load media for rendering." },
      { status: response.status || 502 }
    );
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "";
  if (!allowedMediaTypes.some((type) => contentType.startsWith(type))) {
    return NextResponse.json({ error: "Unsupported media type." }, { status: 415 });
  }

  return new Response(response.body, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": contentType,
    },
  });
}
