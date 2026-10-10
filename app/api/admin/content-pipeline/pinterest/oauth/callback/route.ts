import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import {
  exchangePinterestAuthorizationCode,
  pinterestRedirectUri,
} from "@/lib/content-pipeline/pinterest-oauth";

const STATE_COOKIE = "kyakhayen_pinterest_oauth_state";

function publicAppOrigin(request: Request) {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function redirectToPipeline(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/content-pipeline", publicAppOrigin(request));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const savedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  if (error) {
    return redirectToPipeline(request, { pinterest: "error", message: error });
  }
  if (!code) {
    return redirectToPipeline(request, { pinterest: "error", message: "Missing Pinterest code." });
  }
  if (!state || !savedState || state !== savedState) {
    return redirectToPipeline(request, { pinterest: "error", message: "Pinterest OAuth state mismatch." });
  }

  try {
    await exchangePinterestAuthorizationCode({
      code,
      redirectUri: pinterestRedirectUri(url.origin),
      connectedById: admin.id,
      connectedByName: admin.name || admin.email,
    });
    const response = redirectToPipeline(request, { pinterest: "connected" });
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (exchangeError) {
    return redirectToPipeline(request, {
      pinterest: "error",
      message:
        exchangeError instanceof Error
          ? exchangeError.message
          : "Unable to connect Pinterest.",
    });
  }
}
