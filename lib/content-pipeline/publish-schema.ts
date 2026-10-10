import { z } from "zod";

export const contentPlatformSchema = z.enum([
  "instagram_photo",
  "instagram_reel",
  "facebook_reel",
  "facebook_post",
  "pinterest_pin",
  "youtube_short",
  "x_post",
  "linkedin_post",
]);

export const contentPublishSchema = z.object({
  recipeId: z.string().trim().min(1).optional().nullable(),
  recipeTitle: z.string().trim().min(2).max(180),
  recipeUrl: z.string().trim().url().max(700).optional().nullable(),
  imageUrl: z.string().trim().url().max(700).nullable().optional(),
  videoUrl: z.string().trim().url().max(700).nullable().optional(),
  instagramCaption: z.string().trim().min(2).max(2200),
  facebookPost: z.string().trim().min(2).max(5000),
  pinterestTitle: z.string().trim().min(2).max(100),
  pinterestDescription: z.string().trim().min(2).max(500),
  youtubeTitle: z.string().trim().min(2).max(100),
  youtubeDescription: z.string().trim().min(2).max(5000),
  xPost: z.string().trim().min(2).max(280),
  linkedinPost: z.string().trim().min(2).max(3000),
  platforms: z.array(contentPlatformSchema).min(1).max(8),
});

export type ContentPlatform = z.infer<typeof contentPlatformSchema>;
export type ContentPublishPayload = z.infer<typeof contentPublishSchema>;

export type ContentPublishResult = {
  platform: ContentPlatform;
  status: "published" | "dry_run" | "setup_required" | "blocked" | "failed";
  message: string;
  id?: string;
  url?: string;
};

export const SIMPLE_AUTOMATION_PLATFORMS: ContentPlatform[] = [
  "instagram_photo",
  "facebook_post",
  "pinterest_pin",
  "x_post",
  "linkedin_post",
];

export const VIDEO_APPROVAL_PLATFORMS: ContentPlatform[] = [
  "instagram_reel",
  "facebook_reel",
  "youtube_short",
];
