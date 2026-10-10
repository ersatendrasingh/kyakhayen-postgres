import { Feature } from "@prisma/client";

export type SubscriptionPlanType = {
  id: string;
  name: string;
  durationDays: number | null;
  priceInr: number | null;
  priceUsd: number | null;
  features: Feature[];
  isPublished: boolean;
};
