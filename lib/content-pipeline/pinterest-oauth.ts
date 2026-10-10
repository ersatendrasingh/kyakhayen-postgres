import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { db } from "@/lib/db";

export const PINTEREST_PROVIDER = "pinterest";
export const PINTEREST_REQUIRED_SCOPES = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
];

type PinterestCredentialRow = {
  id: string;
  provider: string;
  environment: string;
  boardId: string | null;
  accessTokenCiphertext: string | null;
  refreshTokenCiphertext: string | null;
  tokenType: string | null;
  scope: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  connectedAccountId: string | null;
  connectedAccountName: string | null;
};

type PinterestTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  refresh_token_expires_at?: number;
  scope?: string;
  message?: string;
};
type PinterestTokenSuccess = PinterestTokenResponse & { access_token: string };

type PinterestUserAccountResponse = {
  username?: string;
  account_type?: string;
  profile_image?: string;
  website_url?: string;
};

export type PinterestBoardSummary = {
  id: string;
  name: string;
  privacy?: string | null;
};

type PinterestBoardResponse = {
  id?: string;
  name?: string;
  privacy?: string;
  message?: string;
};

type PinterestBoardsResponse = {
  items?: PinterestBoardResponse[];
  message?: string;
};

export function pinterestEnvironment() {
  return process.env.PINTEREST_API_ENV === "sandbox" ? "sandbox" : "production";
}

export function pinterestApiBaseUrl() {
  return pinterestEnvironment() === "sandbox"
    ? "https://api-sandbox.pinterest.com/v5"
    : "https://api.pinterest.com/v5";
}

export function pinterestEnvironmentLabel() {
  return pinterestEnvironment() === "sandbox" ? "Sandbox" : "Production";
}

export function pinterestRedirectUri(origin?: string) {
  const configuredRedirect = process.env.PINTEREST_REDIRECT_URI?.replace(/\/$/, "");
  if (configuredRedirect) return configuredRedirect;

  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";

  return `${configuredOrigin.replace(/\/$/, "")}/api/admin/content-pipeline/pinterest/oauth/callback`;
}

function encryptionSecret() {
  return process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || "";
}

export function hasPinterestTokenEncryption() {
  return Boolean(encryptionSecret());
}

function encryptionKey() {
  const secret = encryptionSecret();
  if (!secret) {
    throw new Error("Set SOCIAL_TOKEN_ENCRYPTION_KEY before connecting Pinterest OAuth.");
  }
  return createHash("sha256").update(secret).digest();
}

function encryptToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

function decryptToken(value: string | null) {
  if (!value) return null;
  const [version, ivValue, tagValue, ciphertextValue] = value.split(":");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Saved Pinterest token is not in a supported format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function pinterestClientCredentials() {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set PINTEREST_CLIENT_ID and PINTEREST_CLIENT_SECRET.");
  }
  return { clientId, clientSecret };
}

function scopeSet(scope: string | null | undefined) {
  return new Set((scope || "").split(/[,\s]+/).filter(Boolean));
}

export function missingPinterestScopes(scope: string | null | undefined) {
  const granted = scopeSet(scope);
  return PINTEREST_REQUIRED_SCOPES.filter((scopeName) => !granted.has(scopeName));
}

function expiresAtFromSeconds(seconds: number | undefined) {
  return seconds ? new Date(Date.now() + seconds * 1000) : null;
}

function refreshTokenExpiresAt(json: PinterestTokenResponse) {
  if (json.refresh_token_expires_at) return new Date(json.refresh_token_expires_at * 1000);
  return expiresAtFromSeconds(json.refresh_token_expires_in);
}

export async function ensurePinterestCredentialSchema() {
  // PostgreSQL schema changes are applied by Prisma migrations during deploy.
}

async function findPinterestCredential() {
  await ensurePinterestCredentialSchema();
  return db.contentPipelineSocialCredential.findUnique({
    where: { provider: PINTEREST_PROVIDER },
  });
}

async function savePinterestCredential(input: {
  boardId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  scope?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  connectedAccountId?: string | null;
  connectedAccountName?: string | null;
  connectedById?: string | null;
  connectedByName?: string | null;
}) {
  await ensurePinterestCredentialSchema();
  const accessTokenCiphertext = input.accessToken ? encryptToken(input.accessToken) : null;
  const refreshTokenCiphertext = input.refreshToken ? encryptToken(input.refreshToken) : null;
  const boardId = input.boardId?.trim() || null;

  await db.contentPipelineSocialCredential.upsert({
    where: { provider: PINTEREST_PROVIDER },
    create: {
      provider: PINTEREST_PROVIDER,
      environment: pinterestEnvironment(),
      boardId,
      accessTokenCiphertext,
      refreshTokenCiphertext,
      tokenType: input.tokenType || "bearer",
      scope: input.scope || PINTEREST_REQUIRED_SCOPES.join(" "),
      accessTokenExpiresAt: input.accessTokenExpiresAt || null,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt || null,
      connectedAccountId: input.connectedAccountId || null,
      connectedAccountName: input.connectedAccountName || null,
      connectedById: input.connectedById || null,
      connectedByName: input.connectedByName || null,
    },
    update: {
      environment: pinterestEnvironment(),
      ...(boardId ? { boardId } : {}),
      ...(accessTokenCiphertext ? { accessTokenCiphertext } : {}),
      ...(refreshTokenCiphertext ? { refreshTokenCiphertext } : {}),
      tokenType: input.tokenType || "bearer",
      scope: input.scope || PINTEREST_REQUIRED_SCOPES.join(" "),
      ...(input.accessTokenExpiresAt
        ? { accessTokenExpiresAt: input.accessTokenExpiresAt }
        : {}),
      ...(input.refreshTokenExpiresAt
        ? { refreshTokenExpiresAt: input.refreshTokenExpiresAt }
        : {}),
      ...(input.connectedAccountId
        ? { connectedAccountId: input.connectedAccountId }
        : {}),
      ...(input.connectedAccountName
        ? { connectedAccountName: input.connectedAccountName }
        : {}),
      ...(input.connectedById ? { connectedById: input.connectedById } : {}),
      ...(input.connectedByName ? { connectedByName: input.connectedByName } : {}),
    },
  });
}

async function requestPinterestToken(body: URLSearchParams): Promise<PinterestTokenSuccess> {
  const { clientId, clientSecret } = pinterestClientCredentials();
  const response = await fetch(`${pinterestApiBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await response.json().catch(() => null)) as PinterestTokenResponse | null;
  if (!response.ok || !json?.access_token) {
    throw new Error(
      json?.message ||
        `Pinterest ${pinterestEnvironmentLabel()} token request failed with ${response.status}.`
    );
  }

  const missingScopes = missingPinterestScopes(json.scope);
  if (missingScopes.length) {
    throw new Error(`Pinterest token is missing required scopes: ${missingScopes.join(", ")}.`);
  }

  return json as PinterestTokenSuccess;
}

async function readPinterestAccount(accessToken: string) {
  const response = await fetch(`${pinterestApiBaseUrl()}/user_account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as PinterestUserAccountResponse | null;
}

export async function exchangePinterestAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  connectedById?: string | null;
  connectedByName?: string | null;
}) {
  const json = await requestPinterestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      continuous_refresh: "true",
    })
  );
  const accessToken = json.access_token;
  const account = await readPinterestAccount(accessToken);
  await savePinterestCredential({
    accessToken,
    refreshToken: json.refresh_token,
    tokenType: json.token_type,
    scope: json.scope,
    accessTokenExpiresAt: expiresAtFromSeconds(json.expires_in),
    refreshTokenExpiresAt: refreshTokenExpiresAt(json),
    connectedAccountId: account?.username || null,
    connectedAccountName: account?.username || null,
    connectedById: input.connectedById,
    connectedByName: input.connectedByName,
  });
}

async function refreshPinterestCredential(row: PinterestCredentialRow, refreshToken: string) {
  const json = await requestPinterestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: PINTEREST_REQUIRED_SCOPES.join(","),
    })
  );
  const accessToken = json.access_token;
  await savePinterestCredential({
    boardId: row.boardId,
    accessToken,
    refreshToken: json.refresh_token || refreshToken,
    tokenType: json.token_type,
    scope: json.scope,
    accessTokenExpiresAt: expiresAtFromSeconds(json.expires_in),
    refreshTokenExpiresAt: refreshTokenExpiresAt(json),
    connectedAccountId: row.connectedAccountId,
    connectedAccountName: row.connectedAccountName,
  });
  return accessToken;
}

export async function getPinterestAccessToken() {
  const row = await findPinterestCredential();
  const nowWithBuffer = Date.now() + 60 * 60 * 1000;

  if (
    row?.accessTokenCiphertext &&
    (!row.accessTokenExpiresAt || row.accessTokenExpiresAt.getTime() > nowWithBuffer)
  ) {
    return decryptToken(row.accessTokenCiphertext);
  }

  if (row?.refreshTokenCiphertext) {
    const refreshToken = decryptToken(row.refreshTokenCiphertext);
    return refreshToken ? refreshPinterestCredential(row, refreshToken) : null;
  }

  return null;
}

export async function getPinterestBoardId() {
  const row = await findPinterestCredential();
  return row?.boardId || null;
}

export async function setPinterestBoardId(boardId: string) {
  const trimmedBoardId = boardId.trim();
  if (!trimmedBoardId) {
    throw new Error("Choose a Pinterest board.");
  }
  await savePinterestCredential({ boardId: trimmedBoardId });
}

export async function listPinterestBoards(): Promise<PinterestBoardSummary[]> {
  const accessToken = await getPinterestAccessToken();
  if (!accessToken) {
    throw new Error("Connect Pinterest OAuth before loading boards.");
  }

  const response = await fetch(`${pinterestApiBaseUrl()}/boards?page_size=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await response.json().catch(() => null)) as PinterestBoardsResponse | null;
  if (!response.ok) {
    throw new Error(
      json?.message ||
        `Pinterest ${pinterestEnvironmentLabel()} boards request failed with ${response.status}.`
    );
  }

  return (json?.items || [])
    .filter((board): board is Required<Pick<PinterestBoardResponse, "id" | "name">> & PinterestBoardResponse =>
      Boolean(board.id && board.name)
    )
    .map((board) => ({
      id: board.id,
      name: board.name,
      privacy: board.privacy || null,
    }));
}

export async function createPinterestBoard(name = "Kya Khayen Recipes") {
  const accessToken = await getPinterestAccessToken();
  if (!accessToken) {
    throw new Error("Connect Pinterest OAuth before creating a board.");
  }

  const response = await fetch(`${pinterestApiBaseUrl()}/boards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description: "Recipe Pins published from Kya Khayen.",
      privacy: "PUBLIC",
    }),
  });
  const json = (await response.json().catch(() => null)) as PinterestBoardResponse | null;
  if (!response.ok || !json?.id || !json.name) {
    throw new Error(
      json?.message ||
        `Pinterest ${pinterestEnvironmentLabel()} board create failed with ${response.status}.`
    );
  }

  const board = {
    id: json.id,
    name: json.name,
    privacy: json.privacy || null,
  };
  await setPinterestBoardId(board.id);
  return board;
}

export async function getPinterestCredentialStatus() {
  const row = await findPinterestCredential().catch(() => null);
  const boardId = row?.boardId || "";
  const connected = Boolean(row?.refreshTokenCiphertext || row?.accessTokenCiphertext);
  const missingBase = (["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET"] as const).filter(
    (key) => !process.env[key]
  );
  const missingScopes = connected ? missingPinterestScopes(row?.scope) : [];
  const missing = [
    ...missingBase,
    ...(!hasPinterestTokenEncryption() ? ["SOCIAL_TOKEN_ENCRYPTION_KEY"] : []),
    ...(!connected ? ["Pinterest OAuth connection"] : []),
    ...(connected && !boardId ? ["Pinterest board selection"] : []),
    ...(missingScopes.length ? [`Pinterest scopes: ${missingScopes.join(", ")}`] : []),
  ];

  return {
    configured: missing.length === 0,
    connected,
    environment: row?.environment || pinterestEnvironment(),
    missing,
    scope: row?.scope || null,
    accessTokenExpiresAt: row?.accessTokenExpiresAt?.toISOString() || null,
    refreshTokenExpiresAt: row?.refreshTokenExpiresAt?.toISOString() || null,
    boardId: boardId || null,
    connectedAccountName: row?.connectedAccountName || null,
  };
}
