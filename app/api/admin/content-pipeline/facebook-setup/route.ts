import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";

type FacebookSetupStatus = {
  mode: "dry_run" | "live";
  graphVersion: string;
  hasAccessToken: boolean;
  hasPageId: boolean;
  pageId: string | null;
  readyToPublish: boolean;
  verified: boolean;
  pageName: string | null;
  error: string | null;
};

const graphVersion = process.env.META_GRAPH_API_VERSION || "v25.0";

function isMetadataPermissionError(message: string | undefined) {
  return Boolean(
    message &&
      (/pages_read_engagement/i.test(message) ||
        /Page Public Metadata Access/i.test(message) ||
        /Page Public Content Access/i.test(message))
  );
}

function baseStatus(): FacebookSetupStatus {
  const hasAccessToken = Boolean(process.env.META_ACCESS_TOKEN);
  const pageId = process.env.META_FACEBOOK_PAGE_ID || null;
  const mode = process.env.SOCIAL_PUBLISH_MODE === "live" ? "live" : "dry_run";

  return {
    mode,
    graphVersion,
    hasAccessToken,
    hasPageId: Boolean(pageId),
    pageId,
    readyToPublish: hasAccessToken && Boolean(pageId) && mode === "live",
    verified: false,
    pageName: null,
    error: null,
  };
}

export async function GET(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const status = baseStatus();
  const url = new URL(request.url);
  const verify = url.searchParams.get("verify") === "true";

  if (!verify || !status.hasAccessToken || !status.pageId) {
    return NextResponse.json(status);
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${status.pageId}?fields=id,name&access_token=${encodeURIComponent(
        process.env.META_ACCESS_TOKEN || ""
      )}`,
      { cache: "no-store" }
    );
    const json = (await response.json().catch(() => null)) as {
      id?: string;
      name?: string;
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      const message = json?.error?.message;
      if (status.readyToPublish && isMetadataPermissionError(message)) {
        return NextResponse.json({
          ...status,
          verified: true,
          pageName: "Publishing configured",
          error: null,
        });
      }

      return NextResponse.json({
        ...status,
        error: message || `Meta verification failed with ${response.status}`,
      });
    }

    return NextResponse.json({
      ...status,
      verified: true,
      pageName: json?.name ?? null,
    });
  } catch (error) {
    return NextResponse.json({
      ...status,
      error: error instanceof Error ? error.message : "Unable to verify Facebook setup.",
    });
  }
}
