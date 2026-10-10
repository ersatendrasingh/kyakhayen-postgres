import { createHmac, randomBytes } from "node:crypto";

import {
  ContentPipelineScheduleSource,
  ContentPipelineScheduleStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPinterestAccessToken,
  getPinterestBoardId,
  pinterestApiBaseUrl,
  pinterestEnvironmentLabel,
} from "@/lib/content-pipeline/pinterest-oauth";
import { ensureContentPipelineSchedulingSchema } from "@/lib/content-pipeline/scheduling";
import {
  contentPublishSchema as publishSchema,
  type ContentPlatform,
  type ContentPublishPayload,
  type ContentPublishResult,
} from "@/lib/content-pipeline/publish-schema";

const graphVersion = process.env.META_GRAPH_API_VERSION || "v25.0";
const liveMode = () => process.env.SOCIAL_PUBLISH_MODE === "live";

type GraphJson = {
  id?: string;
  video_id?: string;
  upload_url?: string;
  status?: string;
  status_code?: string;
  error?: { message?: string };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function oauthEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function oauthHeader(
  method: "POST",
  url: string,
  credentials: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  }
) {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  const parsedUrl = new URL(url);
  const signatureParams = new URLSearchParams(parsedUrl.search);
  Object.entries(oauthParams).forEach(([key, value]) => signatureParams.append(key, value));

  const parameterString = Array.from(signatureParams.entries())
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey ? leftValue.localeCompare(rightValue) : leftKey.localeCompare(rightKey)
    )
    .map(([key, value]) => `${oauthEncode(key)}=${oauthEncode(value)}`)
    .join("&");
  const baseUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;
  const signatureBase = [method, oauthEncode(baseUrl), oauthEncode(parameterString)].join("&");
  const signingKey = `${oauthEncode(credentials.apiSecret)}&${oauthEncode(
    credentials.accessTokenSecret
  )}`;
  const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  return `OAuth ${Object.entries({ ...oauthParams, oauth_signature: signature })
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${oauthEncode(key)}="${oauthEncode(value)}"`)
    .join(", ")}`;
}

function pinterestPublishErrorMessage(input: {
  status: number;
  environment: string;
  message?: string | null;
}) {
  const message = input.message || `Pinterest ${input.environment} failed with ${input.status}`;
  const trialProductionBlock =
    /trial access/i.test(message) &&
    /production/i.test(message) &&
    /sandbox/i.test(message);

  if (trialProductionBlock) {
    return `${message}. Your Pinterest app is still on Trial access, so it cannot create real production Pins. For testing, set PINTEREST_API_ENV=sandbox, reconnect Pinterest OAuth, select a Sandbox board, and publish to the Sandbox API. For live kyakhayen.com Pins, upgrade the Pinterest app to Standard access, then switch PINTEREST_API_ENV=production and reconnect.`;
  }

  if (input.status === 401 || input.status === 403) {
    return `${message}. Check that this is a ${input.environment} OAuth token with boards:read, boards:write, pins:read, pins:write, and that the selected board belongs to the same Pinterest environment.`;
  }

  return message;
}

async function postForm(url: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  const response = await fetch(url, {
    method: "POST",
    body,
  });
  const json = (await response.json().catch(() => null)) as GraphJson | null;
  if (!response.ok) {
    throw new Error(json?.error?.message || `Request failed with ${response.status}`);
  }
  return json ?? {};
}

async function getGraph(url: string) {
  const response = await fetch(url);
  const json = (await response.json().catch(() => null)) as GraphJson | null;
  if (!response.ok) {
    throw new Error(json?.error?.message || `Request failed with ${response.status}`);
  }
  return json ?? {};
}

async function waitForInstagramMedia(containerId: string, accessToken: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await getGraph(
      `https://graph.facebook.com/${graphVersion}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(
        accessToken
      )}`
    );

    if (status.status_code === "FINISHED" || status.status_code === "PUBLISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(status.status || `Instagram media container ${status.status_code.toLowerCase()}.`);
    }

    await delay(2500);
  }

  throw new Error("Instagram media is still processing. Wait a minute and publish again.");
}

async function publishInstagramPhoto(input: ContentPublishPayload): Promise<ContentPublishResult> {
  if (!input.imageUrl) {
    return {
      platform: "instagram_photo",
      status: "blocked",
      message: "Instagram photo post needs a public image URL.",
    };
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.META_INSTAGRAM_USER_ID;
  if (!accessToken || !igUserId) {
    return {
      platform: "instagram_photo",
      status: "setup_required",
      message: "Set META_ACCESS_TOKEN and META_INSTAGRAM_USER_ID to publish Instagram posts.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "instagram_photo",
      status: "dry_run",
      message: "Dry run: Instagram photo post is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  const container = await postForm(`https://graph.facebook.com/${graphVersion}/${igUserId}/media`, {
    image_url: input.imageUrl,
    caption: input.instagramCaption,
    access_token: accessToken,
  });
  const containerId = String(container.id ?? "");
  if (!containerId) {
    throw new Error("Instagram media container was not created. Use a public HTTPS image URL and try again.");
  }
  await waitForInstagramMedia(containerId, accessToken);

  const published = await postForm(`https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`, {
    creation_id: containerId,
    access_token: accessToken,
  });

  return {
    platform: "instagram_photo",
    status: "published",
    id: published.id,
    message: "Instagram photo post published.",
  };
}

async function publishInstagramReel(input: ContentPublishPayload): Promise<ContentPublishResult> {
  if (!input.videoUrl) {
    return {
      platform: "instagram_reel",
      status: "blocked",
      message: "Instagram Reel needs a public MP4 video URL. Approve queue is ready; renderer must create the MP4 first.",
    };
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.META_INSTAGRAM_USER_ID;
  if (!accessToken || !igUserId) {
    return {
      platform: "instagram_reel",
      status: "setup_required",
      message: "Set META_ACCESS_TOKEN and META_INSTAGRAM_USER_ID to publish Instagram Reels.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "instagram_reel",
      status: "dry_run",
      message: "Dry run: Instagram Reel is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  const container = await postForm(`https://graph.facebook.com/${graphVersion}/${igUserId}/media`, {
    media_type: "REELS",
    video_url: input.videoUrl,
    caption: input.instagramCaption,
    access_token: accessToken,
  });
  const containerId = String(container.id ?? "");
  if (!containerId) {
    throw new Error("Instagram Reel container was not created. Use a public HTTPS MP4 URL and try again.");
  }
  await waitForInstagramMedia(containerId, accessToken);

  const published = await postForm(`https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`, {
    creation_id: containerId,
    access_token: accessToken,
  });

  return {
    platform: "instagram_reel",
    status: "published",
    id: published.id,
    message: "Instagram Reel published.",
  };
}

async function publishFacebookPost(input: ContentPublishPayload): Promise<ContentPublishResult> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) {
    return {
      platform: "facebook_post",
      status: "setup_required",
      message: "Set META_ACCESS_TOKEN and META_FACEBOOK_PAGE_ID to publish Facebook posts.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "facebook_post",
      status: "dry_run",
      message: "Dry run: Facebook post is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  const published = input.recipeUrl
    ? await postForm(`https://graph.facebook.com/${graphVersion}/${pageId}/feed`, {
        message: input.facebookPost,
        link: input.recipeUrl,
        access_token: accessToken,
      })
    : input.imageUrl
      ? await postForm(`https://graph.facebook.com/${graphVersion}/${pageId}/photos`, {
          url: input.imageUrl,
          caption: input.facebookPost,
          access_token: accessToken,
        })
      : await postForm(`https://graph.facebook.com/${graphVersion}/${pageId}/feed`, {
          message: input.facebookPost,
          access_token: accessToken,
        });

  return {
    platform: "facebook_post",
    status: "published",
    id: published.id,
    message: "Facebook post published.",
  };
}

async function publishFacebookReel(input: ContentPublishPayload): Promise<ContentPublishResult> {
  if (!input.videoUrl) {
    return {
      platform: "facebook_reel",
      status: "blocked",
      message:
        "Facebook Reel needs a public MP4 video URL. Approve queue is ready; renderer must create the MP4 first.",
    };
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) {
    return {
      platform: "facebook_reel",
      status: "setup_required",
      message: "Set META_ACCESS_TOKEN and META_FACEBOOK_PAGE_ID to publish Facebook Reels.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "facebook_reel",
      status: "dry_run",
      message: "Dry run: Facebook Reel is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  const uploadSession = await postForm(
    `https://graph.facebook.com/${graphVersion}/${pageId}/video_reels`,
    {
      upload_phase: "start",
      access_token: accessToken,
    }
  );
  const videoId = String(uploadSession.video_id ?? uploadSession.id ?? "");
  const uploadUrl = String(uploadSession.upload_url ?? "");
  if (!videoId || !uploadUrl) {
    throw new Error("Facebook Reel upload session was not created.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${accessToken}`,
      file_url: input.videoUrl,
    },
  });
  const uploadJson = (await uploadResponse.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  if (!uploadResponse.ok) {
    throw new Error(
      uploadJson?.error?.message || `Facebook Reel upload failed with ${uploadResponse.status}`
    );
  }

  const published = await postForm(
    `https://graph.facebook.com/${graphVersion}/${pageId}/video_reels`,
    {
      upload_phase: "finish",
      video_id: videoId,
      video_state: "PUBLISHED",
      description: input.instagramCaption,
      access_token: accessToken,
    }
  );

  return {
    platform: "facebook_reel",
    status: "published",
    id: published.id ?? videoId,
    message: "Facebook Reel published.",
  };
}

async function publishPinterestPin(input: ContentPublishPayload): Promise<ContentPublishResult> {
  if (!input.imageUrl) {
    return {
      platform: "pinterest_pin",
      status: "blocked",
      message: "Pinterest Pin needs a public image URL.",
    };
  }

  const accessToken = await getPinterestAccessToken();
  const boardId = await getPinterestBoardId();
  if (!accessToken || !boardId) {
    return {
      platform: "pinterest_pin",
      status: "setup_required",
      message:
        "Connect Pinterest OAuth and select a Pinterest board in Social configuration.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "pinterest_pin",
      status: "dry_run",
      message: "Dry run: Pinterest Pin is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  if (process.env.PINTEREST_PUBLISH_ENABLED !== "true") {
    return {
      platform: "pinterest_pin",
      status: "blocked",
      message:
        "Pinterest credentials are configured, but Pin publishing is disabled. Set PINTEREST_PUBLISH_ENABLED=true after the token has pins:write.",
    };
  }

  const response = await fetch(`${pinterestApiBaseUrl()}/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: input.pinterestTitle,
      description: input.pinterestDescription,
      ...(input.recipeUrl ? { link: input.recipeUrl } : {}),
      media_source: {
        source_type: "image_url",
        url: input.imageUrl,
      },
    }),
  });
  const json = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    code?: number;
  } | null;
  if (!response.ok) {
    const environment = pinterestEnvironmentLabel();
    throw new Error(
      pinterestPublishErrorMessage({
        status: response.status,
        environment,
        message: json?.message,
      })
    );
  }

  return {
    platform: "pinterest_pin",
    status: "published",
    id: json?.id,
    message: `Pinterest Pin published in ${pinterestEnvironmentLabel()}.`,
  };
}

async function getYouTubeAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await response.json().catch(() => null)) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  } | null;

  if (!response.ok || !json?.access_token) {
    throw new Error(
      json?.error_description || json?.error || `Google token refresh failed with ${response.status}`
    );
  }

  return json.access_token;
}

async function fetchVideoBuffer(videoUrl: string) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Rendered video could not be downloaded from media storage (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "video/mp4";
  if (!contentType.startsWith("video/")) {
    throw new Error("Rendered reel URL is not a video file.");
  }

  return {
    contentType,
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

function youtubePrivacyStatus() {
  const privacy = process.env.YOUTUBE_UPLOAD_PRIVACY_STATUS;
  return privacy === "public" || privacy === "private" || privacy === "unlisted"
    ? privacy
    : "unlisted";
}

async function publishYouTubeShort(input: ContentPublishPayload): Promise<ContentPublishResult> {
  if (!input.videoUrl) {
    return {
      platform: "youtube_short",
      status: "blocked",
      message: "Render the reel MP4 to media storage before publishing the YouTube Short.",
    };
  }

  const hasGoogleOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.YOUTUBE_REFRESH_TOKEN
  );

  if (!hasGoogleOAuth) {
    return {
      platform: "youtube_short",
      status: "setup_required",
      message:
        "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN for YouTube Shorts.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "youtube_short",
      status: "dry_run",
      message: "Dry run: YouTube Short is ready. Set SOCIAL_PUBLISH_MODE=live to upload.",
    };
  }

  const accessToken = await getYouTubeAccessToken();
  const video = await fetchVideoBuffer(input.videoUrl);
  const boundary = `kyakhayen-youtube-${randomBytes(12).toString("hex")}`;
  const metadata = {
    snippet: {
      title: input.youtubeTitle,
      description: input.youtubeDescription,
      categoryId: "26",
      tags: ["Kya Khayen", "recipe", "shorts", "food"],
    },
    status: {
      privacyStatus: youtubePrivacyStatus(),
      selfDeclaredMadeForKids: false,
    },
  };

  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata
      )}\r\n`
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${video.contentType}\r\n\r\n`),
    video.buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const json = (await response.json().catch(() => null)) as {
    id?: string;
    error?: { message?: string; errors?: Array<{ message?: string }> };
  } | null;

  if (!response.ok || !json?.id) {
    throw new Error(
      json?.error?.errors?.map((error) => error.message).filter(Boolean).join(", ") ||
        json?.error?.message ||
        `YouTube upload failed with ${response.status}`
    );
  }

  return {
    platform: "youtube_short",
    status: "published",
    id: json.id,
    url: `https://youtu.be/${json.id}`,
    message: `YouTube Short uploaded as ${youtubePrivacyStatus()}.`,
  };
}

async function publishXPost(input: ContentPublishPayload): Promise<ContentPublishResult> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return {
      platform: "x_post",
      status: "setup_required",
      message:
        "Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_TOKEN_SECRET to publish X posts.",
    };
  }

  if (process.env.X_PUBLISH_ENABLED !== "true") {
    return {
      platform: "x_post",
      status: "blocked",
      message:
        "X credentials are configured, but paid publishing is disabled. Set X_PUBLISH_ENABLED=true after adding X credits.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "x_post",
      status: "dry_run",
      message: "Dry run: X post is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  const url = "https://api.x.com/2/tweets";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", url, {
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret,
      }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: input.xPost }),
  });
  const json = (await response.json().catch(() => null)) as {
    data?: { id?: string };
    detail?: string;
    title?: string;
    errors?: Array<{ message?: string }>;
  } | null;
  if (!response.ok) {
    throw new Error(
      json?.detail ||
        json?.errors?.map((error) => error.message).filter(Boolean).join(", ") ||
        json?.title ||
        `X post failed with ${response.status}`
    );
  }

  return {
    platform: "x_post",
    status: "published",
    id: json?.data?.id,
    message: "X post published.",
  };
}

async function publishLinkedInPost(
  input: ContentPublishPayload
): Promise<ContentPublishResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN;
  if (!accessToken || !authorUrn) {
    return {
      platform: "linkedin_post",
      status: "setup_required",
      message: "Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN to publish LinkedIn posts.",
    };
  }

  if (!liveMode()) {
    return {
      platform: "linkedin_post",
      status: "dry_run",
      message: "Dry run: LinkedIn post is ready. Set SOCIAL_PUBLISH_MODE=live to publish.",
    };
  }

  const shareContent = input.recipeUrl
    ? {
        shareMediaCategory: "ARTICLE",
        media: [
          {
            status: "READY",
            originalUrl: input.recipeUrl,
            title: { text: input.recipeTitle },
          },
        ],
      }
    : {
        shareMediaCategory: "NONE",
      };

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: input.linkedinPost },
          ...shareContent,
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `LinkedIn post failed with ${response.status}`);
  }

  return {
    platform: "linkedin_post",
    status: "published",
    id: response.headers.get("x-restli-id") ?? undefined,
    message: "LinkedIn post published.",
  };
}

function publishHistoryStatus(results: ContentPublishResult[]) {
  const published = results.filter((result) => result.status === "published");
  if (published.length === results.length) return ContentPipelineScheduleStatus.COMPLETED;
  return ContentPipelineScheduleStatus.PARTIAL_FAILED;
}

function publishHistoryError(results: ContentPublishResult[]) {
  return (
    results
      .filter((result) => result.status !== "published")
      .map((result) => `${result.platform}: ${result.message}`)
      .join("\n") || null
  );
}

async function recordDirectPublishHistory({
  input,
  results,
  admin,
}: {
  input: ContentPublishPayload;
  results: ContentPublishResult[];
  admin: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
}) {
  const publishedResults = results.filter((result) => result.status === "published");
  if (!liveMode() || !publishedResults.length) return;

  await ensureContentPipelineSchedulingSchema();
  await db.contentPipelineScheduledPost.create({
    data: {
      recipeId: input.recipeId || null,
      recipeTitle: input.recipeTitle,
      recipeUrl: input.recipeUrl || "",
      imageUrl: input.imageUrl || null,
      videoUrl: input.videoUrl || null,
      platforms: input.platforms,
      contentJson: input,
      status: publishHistoryStatus(results),
      source: ContentPipelineScheduleSource.MANUAL,
      scheduledAt: new Date(),
      processedAt: new Date(),
      lastError: publishHistoryError(results),
      attempts: 1,
      createdById: admin.id,
      createdByName: admin.name || admin.email || "Admin",
      publishAttempts: {
        create: results.map((result) => ({
          platform: result.platform,
          status: result.status,
          message: result.message,
          externalId: result.id || null,
          externalUrl: result.url || null,
        })),
      },
    },
  });
}

function isWorkerRequest(request: Request) {
  const workerSecret =
    process.env.MEAL_PLAN_WORKER_SECRET ||
    (process.env.NODE_ENV !== "production" ? "local-meal-plan-worker" : "");
  return Boolean(workerSecret && request.headers.get("x-meal-plan-worker-secret") === workerSecret);
}

export async function POST(request: Request) {
  const admin = await currentUser();
  const workerRequest = isWorkerRequest(request);
  if ((!admin || admin.role !== "ADMIN") && !workerRequest) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = publishSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid publish request.", {
      status: 400,
    });
  }

  const input = parsed.data;
  const results: ContentPublishResult[] = [];

  for (const platform of input.platforms as ContentPlatform[]) {
    try {
      if (platform === "instagram_photo") results.push(await publishInstagramPhoto(input));
      if (platform === "instagram_reel") results.push(await publishInstagramReel(input));
      if (platform === "facebook_reel") results.push(await publishFacebookReel(input));
      if (platform === "facebook_post") results.push(await publishFacebookPost(input));
      if (platform === "pinterest_pin") results.push(await publishPinterestPin(input));
      if (platform === "youtube_short") results.push(await publishYouTubeShort(input));
      if (platform === "x_post") results.push(await publishXPost(input));
      if (platform === "linkedin_post") results.push(await publishLinkedInPost(input));
    } catch (error) {
      results.push({
        platform,
        status: "failed",
        message: error instanceof Error ? error.message : "Unable to publish.",
      });
    }
  }

  if (admin && admin.role === "ADMIN" && !workerRequest) {
    await recordDirectPublishHistory({ input, results, admin });
  }

  return NextResponse.json({
    mode: liveMode() ? "live" : "dry_run",
    results,
  });
}
