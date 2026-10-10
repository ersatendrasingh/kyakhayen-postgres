import { getPinterestCredentialStatus } from "@/lib/content-pipeline/pinterest-oauth";

export type SocialSetupPlatformKey =
  | "facebook"
  | "instagram"
  | "youtube"
  | "x"
  | "linkedin"
  | "pinterest";

export type SocialSetupPlatform = {
  key: SocialSetupPlatformKey;
  label: string;
  configured: boolean;
  canPublish: boolean;
  missing: string[];
  note: string;
  setupUrl?: string;
  connected?: boolean;
  environment?: string | null;
  selectedBoardId?: string | null;
};

export type SocialSetupStatus = {
  mode: "dry_run" | "live";
  graphVersion: string;
  platforms: SocialSetupPlatform[];
};

function missingEnv(keys: string[]) {
  return keys.filter((key) => !process.env[key]);
}

function platform(
  key: SocialSetupPlatformKey,
  label: string,
  requiredEnv: string[],
  note: string,
  canPublishOverride?: boolean
): SocialSetupPlatform {
  const missing = missingEnv(requiredEnv);
  const configured = missing.length === 0;

  return {
    key,
    label,
    configured,
    canPublish:
      configured &&
      process.env.SOCIAL_PUBLISH_MODE === "live" &&
      (canPublishOverride ?? true),
    missing,
    note,
  };
}

export async function getSocialSetupStatus(): Promise<SocialSetupStatus> {
  const pinterestStatus = await getPinterestCredentialStatus();
  return {
    mode: process.env.SOCIAL_PUBLISH_MODE === "live" ? "live" : "dry_run",
    graphVersion: process.env.META_GRAPH_API_VERSION || "v25.0",
    platforms: [
      platform(
        "facebook",
        "Facebook",
        ["META_ACCESS_TOKEN", "META_FACEBOOK_PAGE_ID"],
        "Use a long-lived Page/System User token. Graph API Explorer tokens expire quickly."
      ),
      platform(
        "instagram",
        "Instagram",
        ["META_ACCESS_TOKEN", "META_INSTAGRAM_USER_ID"],
        "Requires an Instagram professional account connected to the Facebook Page."
      ),
      platform(
        "youtube",
        "YouTube",
        ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"],
        "Uses Google OAuth refresh token. Shorts still need a rendered public MP4."
      ),
      platform(
        "x",
        "X",
        ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"],
        process.env.X_PUBLISH_ENABLED === "true"
          ? "Uses OAuth 1.0a user tokens. X credits may be charged per publish request."
          : "OAuth 1.0a tokens can be configured now. Publishing stays blocked until X_PUBLISH_ENABLED=true.",
        process.env.X_PUBLISH_ENABLED === "true"
      ),
      platform(
        "linkedin",
        "LinkedIn",
        ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_AUTHOR_URN"],
        "Author URN can be a person or organization with posting permission."
      ),
      {
        key: "pinterest",
        label: "Pinterest",
        configured: pinterestStatus.configured,
        canPublish:
          pinterestStatus.configured &&
          process.env.SOCIAL_PUBLISH_MODE === "live" &&
          process.env.PINTEREST_PUBLISH_ENABLED === "true",
        missing: pinterestStatus.missing,
        setupUrl: "/api/admin/content-pipeline/pinterest/oauth/start",
        connected: pinterestStatus.connected,
        environment: pinterestStatus.environment,
        selectedBoardId: pinterestStatus.boardId,
        note: pinterestStatus.connected
          ? `Connected${pinterestStatus.connectedAccountName ? ` as ${pinterestStatus.connectedAccountName}` : ""}. ${
              pinterestStatus.boardId ? "Board selected." : "Select a board before publishing."
            } Refresh token ${
              pinterestStatus.refreshTokenExpiresAt
                ? `expires ${new Date(pinterestStatus.refreshTokenExpiresAt).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}`
                : "is stored"
            }.`
          : "Connect with Pinterest OAuth. Required scopes: boards:read, boards:write, pins:read, pins:write.",
      },
    ],
  };
}
