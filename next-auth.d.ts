import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  phoneNumber?: string;
  bio?: string;
  gender?: string;
  userPlan?: string[];
  userPlanStartDate: Date[];
  userPlanEndDate: Date[];
  foodPreference?: string;
  cookingSkill?: string;
  createdAt?: Date;
  updateAt?: Date;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isPersonalised: boolean;
  isOAuth: boolean;
  isActive: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
