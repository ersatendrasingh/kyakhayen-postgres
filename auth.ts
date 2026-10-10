import NextAuth from "next-auth";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { render } from "react-email";

import { db } from "@/lib/db";

import authConfig from "@/auth.config";
import { getUserById } from "@/data/user";
import { UserRole } from "@prisma/client";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { getAccountByUserId } from "@/data/account";
import WelcomeSocialLoginMail from "@/emails/welcome-social-login-mail";
import { sendEmail } from "@/lib/mail";
import { assignFreePlanToUser } from "@/lib/assignFreePlan";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      if (!user.id) {
        console.error("User ID is undefined in linkAccount event");
        throw new Error("User ID is required to assign a free plan");
      }
      try {
        // Update email verification status
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });

        // Existing email/password members linking Google already have access.
        // Only create launch access when this is a genuinely plan-less account.
        const hasExistingPlan = await db.userPlan.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!hasExistingPlan) {
          await assignFreePlanToUser(user.id);
        }
      } catch (error) {
        console.error("Error in linkAccount event:", error);
        throw new Error("Failed to assign free plan during account link");
      }
    },
    async signIn({ user, account, isNewUser }) {
      // Check if it's a new user signing in with social login
      if (isNewUser && account?.provider !== "credentials") {
        // Send welcome email to the new user
        await sendEmail({
          to: user.email as string,
          subject: "Welcome! Let's Get Started with Kya Khayen?",
          html: await render(
            WelcomeSocialLoginMail({
              name: user.name as string,
            })
          ),
        });
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      const existingUser = await getUserById(user.id as string);

      if (existingUser && !existingUser.isActive) {
        return "/auth/login?error=AccountSuspended";
      }

      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      if (existingUser?.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        if (!twoFactorConfirmation) return false;

        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.role = token.role as UserRole;
        session.user.createdAt = token.createdAt as Date;
        session.user.updateAt = token.updateAt as Date;
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.isPersonalised = token.isPersonalised as boolean;
        session.user.isActive = token.isActive !== false;
        session.user.bio = token.bio as string;
        session.user.gender = token.gender as string;
        session.user.userPlan = token.userPlan as string[];
        session.user.userPlanStartDate = token.userPlanStartDate as Date[];
        session.user.userPlanEndDate = token.userPlanEndDate as Date[];
        session.user.foodPreference = token.foodPreference as string;
        session.user.cookingSkill = token.cookingSkill as string;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.id = existingUser.id;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.image = existingUser.image;
      token.role = existingUser.role;
      token.phoneNumber = existingUser.phoneNumber;
      token.isPersonalised = existingUser.isPersonalised;
      token.isActive = existingUser.isActive;
      token.bio = existingUser.bio;
      token.gender = existingUser.gender?.title;
      token.userPlan = existingUser.UserPlan.map((plan) => plan.plan.name);
      token.userPlanStartDate = existingUser.UserPlan.map(
        (plan) => plan.startDate
      );
      token.userPlanEndDate = existingUser.UserPlan.map((plan) => plan.endDate);
      token.foodPreference = existingUser.foodPreference?.name;
      token.cookingSkill = existingUser.cookingSkill?.title;
      token.createdAt = existingUser.createdAt;
      token.updateAt = existingUser.updateAt;

      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
