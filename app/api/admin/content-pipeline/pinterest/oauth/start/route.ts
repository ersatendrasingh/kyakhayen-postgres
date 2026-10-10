import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import {
  PINTEREST_REQUIRED_SCOPES,
  hasPinterestTokenEncryption,
  pinterestRedirectUri,
} from "@/lib/content-pipeline/pinterest-oauth";

const STATE_COOKIE = "kyakhayen_pinterest_oauth_state";

export async function GET(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }
  if (!process.env.PINTEREST_CLIENT_ID || !process.env.PINTEREST_CLIENT_SECRET) {
    return NextResponse.json("Set PINTEREST_CLIENT_ID and PINTEREST_CLIENT_SECRET.", {
      status: 400,
    });
  }
  if (!hasPinterestTokenEncryption()) {
    return NextResponse.json("Set SOCIAL_TOKEN_ENCRYPTION_KEY before connecting Pinterest.", {
      status: 400,
    });
  }

  const url = new URL(request.url);
  const redirectUri = pinterestRedirectUri(url.origin);
  const state = randomBytes(24).toString("hex");
  const oauthUrl = new URL("https://www.pinterest.com/oauth/");
  oauthUrl.searchParams.set("client_id", process.env.PINTEREST_CLIENT_ID);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("response_type", "code");
  oauthUrl.searchParams.set("scope", PINTEREST_REQUIRED_SCOPES.join(","));
  oauthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
