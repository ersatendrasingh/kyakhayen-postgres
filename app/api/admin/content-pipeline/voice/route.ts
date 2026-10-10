import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

const CARTESIA_API_VERSION = "2026-03-01";
const CARTESIA_API_BASE_URL = "https://api.cartesia.ai";
const CARTESIA_MODEL_ID = "sonic-3.5";
const CARTESIA_LANGUAGES = ["hi", "en"] as const;
const CARTESIA_DEFAULT_LANGUAGE = "hi";
const CARTESIA_DEFAULT_VOICE_ID = "faf0731e-dfb9-4cfc-8119-259a79b27e12";
const CARTESIA_OUTPUT_FORMAT = {
  container: "mp3",
  sample_rate: 44100,
  bit_rate: 128000,
} as const;
const CARTESIA_GENERATION_CONFIG = {
  volume: 1,
  speed: 0.9,
} as const;

type CartesiaVoice = {
  id: string;
  name: string;
  description?: string | null;
  gender?: string | null;
  language?: string | null;
  country?: string | null;
  preview_file_url?: string | null;
};

type CartesiaLanguage = (typeof CARTESIA_LANGUAGES)[number];

const voiceSchema = z.object({
  input: z.string().trim().min(12).max(4000),
  language: z.enum(CARTESIA_LANGUAGES).default(CARTESIA_DEFAULT_LANGUAGE),
  voiceId: z.string().trim().min(1).optional(),
});

function normalizeSpeechInput(input: string, language: CartesiaLanguage) {
  if (language !== "hi") return input;

  return input
    .replace(/\bKya\s+Khayen\b/gi, "क्या खाएं")
    .replace(/\bKyakhayen\b/gi, "क्या खाएं");
}

async function readResponseMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as { title?: string; message?: string; error?: string };
    return payload.message || payload.title || payload.error || fallback;
  } catch {
    return text.replace(/^"|"$/g, "") || fallback;
  }
}

function cartesiaApiKey() {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) throw new Error("Set CARTESIA_API_KEY to generate Cartesia AI voiceovers.");
  return apiKey;
}

function cartesiaLanguage(value: string | null): CartesiaLanguage {
  return CARTESIA_LANGUAGES.find((language) => language === value) ?? CARTESIA_DEFAULT_LANGUAGE;
}

function defaultCartesiaVoiceId(language: CartesiaLanguage) {
  if (language !== "hi") return "";
  return process.env.CARTESIA_DEFAULT_VOICE_ID || CARTESIA_DEFAULT_VOICE_ID;
}

async function listCartesiaVoices(apiKey: string, language: CartesiaLanguage) {
  const url = new URL(`${CARTESIA_API_BASE_URL}/voices`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("language", language);
  url.searchParams.set("expand[]", "preview_file_url");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Cartesia-Version": CARTESIA_API_VERSION,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readResponseMessage(response, "Unable to load Cartesia voices."));
  }

  const payload = (await response.json()) as { data?: CartesiaVoice[] };
  return (payload.data ?? []).filter((voice) => voice.id && voice.name);
}

async function getCartesiaVoice(apiKey: string, voiceId: string) {
  const url = new URL(`${CARTESIA_API_BASE_URL}/voices/${voiceId}`);
  url.searchParams.set("expand[]", "preview_file_url");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Cartesia-Version": CARTESIA_API_VERSION,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as CartesiaVoice;
}

async function listCartesiaVoicesWithDefault(apiKey: string, language: CartesiaLanguage) {
  const defaultVoiceId = defaultCartesiaVoiceId(language);
  const voices = await listCartesiaVoices(apiKey, language);
  if (!defaultVoiceId) return voices;
  if (voices.some((voice) => voice.id === defaultVoiceId)) return voices;

  const defaultVoice = await getCartesiaVoice(apiKey, defaultVoiceId);
  return defaultVoice ? [defaultVoice, ...voices] : voices;
}

async function generateCartesiaVoice(input: string, voiceId: string, language: CartesiaLanguage) {
  const apiKey = cartesiaApiKey();

  const response = await fetch(`${CARTESIA_API_BASE_URL}/tts/bytes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Cartesia-Version": CARTESIA_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: CARTESIA_MODEL_ID,
      transcript: normalizeSpeechInput(input, language),
      voice: { id: voiceId },
      language,
      output_format: CARTESIA_OUTPUT_FORMAT,
      generation_config: CARTESIA_GENERATION_CONFIG,
    }),
  });

  if (!response.ok) {
    throw new Error(await readResponseMessage(response, "Unable to generate Cartesia AI voice."));
  }

  return response.arrayBuffer();
}

async function requireAdmin() {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") {
    return null;
  }
  return admin;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  try {
    const language = cartesiaLanguage(new URL(request.url).searchParams.get("language"));
    const voices = await listCartesiaVoicesWithDefault(cartesiaApiKey(), language);
    const defaultVoiceId = defaultCartesiaVoiceId(language) || voices[0]?.id || "";
    return NextResponse.json({
      defaultVoiceId,
      language,
      voices,
    });
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Unable to load Cartesia voices.",
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const parsed = voiceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.issues[0]?.message || "Invalid voice request.", {
      status: 400,
    });
  }

  try {
    const voiceId = parsed.data.voiceId || defaultCartesiaVoiceId(parsed.data.language);
    if (!voiceId) {
      return NextResponse.json("Choose a Cartesia voice before generating audio.", {
        status: 400,
      });
    }

    const audio = await generateCartesiaVoice(
      parsed.data.input,
      voiceId,
      parsed.data.language
    );
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="kyakhayen-cartesia-voice.mp3"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      error instanceof Error ? error.message : "Unable to generate Cartesia AI voice.",
      { status: 503 }
    );
  }
}
