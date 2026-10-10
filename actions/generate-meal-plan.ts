"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";

import { addDays, formatISO, startOfDay } from "date-fns";
import { sendEmail } from "@/lib/mail";
import { render } from "react-email";
import CustomerMealPlanMail from "@/emails/customer-meal-plan-mail";
import {
  generateMealPlanPdf,
  type PdfMealPlanDay,
} from "@/lib/generate-meal-plan-pdf";
import type { RecipeWithCategory } from "@/types/recipe";
import { NotificationAutomationTrigger } from "@prisma/client";
import {
  scheduleMealPlanDeliveries,
  scheduleMealReminders,
} from "@/lib/meal-plan-queue";
import { runUserAutomationRules } from "@/lib/notification-automations";
import {
  generateWeeklyMealPlan,
  toStoredMealPlanDay,
  toStoredWeeklyManifest,
} from "@/lib/meal-plan-planner";
import type { MealPlanRoutineSlot } from "@/lib/meal-plan-routine";

const getS3Client = () => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_PRIVATE_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS private meal-plan storage is not configured.");
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
};

type MealPlanResult = {
  date: Date;
  s3Url: string;
  mealsByTime: Record<string, RecipeWithCategory[]>;
  routineSlots: MealPlanRoutineSlot[];
};

type MealPlanProgressReporter = (
  percentage: number,
  message: string,
) => Promise<void> | void;

const planDateKey = (date: Date) => formatISO(date, { representation: "date" });

const maxPlanStartDate = (candidate: Date, cutoff: Date) =>
  planDateKey(candidate) < planDateKey(cutoff) ? cutoff : candidate;

// Helper function to upload data to S3
const uploadToS3 = async (fileName: string, fileContent: string) => {
  const params = {
    Bucket: process.env.AWS_PRIVATE_BUCKET_NAME as string,
    Key: fileName,
    Body: fileContent,
    ContentType: "application/json",
  };
  const command = new PutObjectCommand(params);

  try {
    const data = await getS3Client().send(command);
    return data;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

export const generateMealPlan = async (
  userId: string,
  reportProgress?: MealPlanProgressReporter,
): Promise<MealPlanResult[]> => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const historyCutoffDate = today;
    const historyCutoffDateKey = planDateKey(historyCutoffDate);
    await reportProgress?.(10, "Understanding your food preferences");

    // Fetch user's details
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        foodPreference: {
          select: { name: true },
        },
        cookingSkill: {
          select: { title: true },
        },
        userCuisines: {
          include: {
            cuisine: {
              select: { title: true, position: true },
            },
          },
        },
        UserAllrgies: {
          include: {
            allergy: {
              select: { title: true, position: true },
            },
          },
        },
      },
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    await reportProgress?.(16, "Preparing your meal schedule");

    // Fetch user's current active plan
    const userPlan = await db.userPlan.findFirst({
      where: {
        userId,
        endDate: {
          gte: today, // Plan must still be active today
        },
      },
      orderBy: {
        endDate: "desc",
      },
      include: {
        plan: true,
      },
    });

    // Fetch the existing meal plan entry
    let userMealPlan = await db.userMealPlan.findFirst({
      where: {
        userId,
        planEndDate: {
          gte: today, // Keep using the current meal-plan history record
        },
      },
    });

    const launchEndDate = addDays(today, 6);
    let startDate: Date;
    const endDate =
      userPlan?.endDate && userPlan.endDate > launchEndDate
        ? userPlan.endDate
        : launchEndDate;

    if (userMealPlan) {
      // Regeneration is allowed to rewrite only the current date onward.
      // Past S3 date keys are immutable history for the member.
      startDate = maxPlanStartDate(today, historyCutoffDate);

      // Update the meal plan's end date to match the current user plan's end date
      await db.userMealPlan.update({
        where: { id: userMealPlan.id },
        data: {
          planEndDate: endDate,
        },
      });
    } else {
      // Launch access always provides a fresh seven-day plan without purchase.
      startDate = maxPlanStartDate(today, historyCutoffDate);
      userMealPlan = await db.userMealPlan.create({
        data: {
          userId,
          planStartDate: startDate,
          planEndDate: endDate,
        },
      });
    }

    // Generate meal plans only from the current date onward. This prevents
    // preference edits or regeneration from overwriting historical meal days.
    const dates = getDatesBetween(startDate, endDate).filter(
      (date) => planDateKey(date) >= historyCutoffDateKey,
    );
    if (dates.length === 0) {
      throw new Error("Meal plan generation has no current or future dates.");
    }
    await reportProgress?.(18, "Selecting recipes for your week");
    const weeklyPlan = await generateWeeklyMealPlan(userId, dates);
    await reportProgress?.(24, "Building your seven-day plan");
    const mealPlanResults: MealPlanResult[] = [];

    for (const [index, day] of weeklyPlan.days.entries()) {
      const mealPlanJson = JSON.stringify(
        toStoredMealPlanDay(userId, weeklyPlan, day),
      );
      const formattedDate = day.dateKey;
      if (formattedDate < historyCutoffDateKey) {
        console.warn(
          `[MEAL_PLAN_HISTORY_GUARD] Skipping historical date ${formattedDate} for user ${userId}`,
        );
        continue;
      }

      const s3Key = `usersMealPlans/${userId}/${formattedDate}/diet.json`;

      // Upload meal plan JSON to S3
      await uploadToS3(s3Key, mealPlanJson);

      mealPlanResults.push({
        date: day.date,
        s3Url: s3Key,
        mealsByTime: day.mealsByTime,
        routineSlots: day.routineSlots,
      });
      const percentage = Math.round(
        18 + ((index + 1) / weeklyPlan.days.length) * 60,
      );
      await reportProgress?.(
        percentage,
        `Curating day ${index + 1} of ${weeklyPlan.days.length}`,
      );
    }
    await uploadToS3(
      `usersMealPlans/${userId}/weeks/${weeklyPlan.planStartDate}.json`,
      JSON.stringify(toStoredWeeklyManifest(userId, weeklyPlan)),
    );

    await reportProgress?.(88, "Designing your meal-plan PDF");
    try {
      const isPaidAccess = Boolean(
        userPlan?.plan &&
        ((userPlan.plan.priceInr || 0) > 0 ||
          (userPlan.plan.priceUsd || 0) > 0),
      );
      const deliveryDays: PdfMealPlanDay[] = (
        isPaidAccess ? mealPlanResults.slice(0, 1) : mealPlanResults
      ).map(({ date, mealsByTime, routineSlots }) => ({
        date,
        mealsByTime,
        routineSlots,
      }));
      const mealPlanAttachment = await generateMealPlanPdf(
        {
          name: user.name || "Member",
          email: user.email,
          accessLabel: isPaidAccess
            ? `${userPlan?.plan?.name || "Membership"} access`
            : "7-day launch plan",
          foodStyle: user.foodPreference?.name,
          cookingComfort: user.cookingSkill?.title,
          cuisines: [...user.userCuisines]
            .sort(
              (first, second) =>
                (first.cuisine.position ?? Number.MAX_SAFE_INTEGER) -
                (second.cuisine.position ?? Number.MAX_SAFE_INTEGER),
            )
            .map(({ cuisine }) => cuisine.title),
          exclusions: [...user.UserAllrgies]
            .sort(
              (first, second) =>
                (first.allergy.position ?? Number.MAX_SAFE_INTEGER) -
                (second.allergy.position ?? Number.MAX_SAFE_INTEGER),
            )
            .map(({ allergy }) => allergy.title),
        },
        deliveryDays,
        isPaidAccess ? "Day one delivery" : "Seven-day launch plan",
      );
      if (isPaidAccess && mealPlanResults.length > 1) {
        await scheduleMealPlanDeliveries(
          userId,
          mealPlanResults.slice(1).map(({ date }) => date),
        );
      }

      await reportProgress?.(94, "Sending your meal-plan PDF");
      await sendEmail({
        to: user.email as string,
        subject: isPaidAccess
          ? "Your first Kya Khayen meal-plan day is ready"
          : "Your seven-day Kya Khayen meal plan is ready",
        html: await render(
          CustomerMealPlanMail({
            name: user.name || "Member",
            daysIncluded: deliveryDays.length,
          }),
        ),
        attachments: [mealPlanAttachment],
      });
    } catch (emailError) {
      console.error(
        "Meal plan created, but ready email could not be sent:",
        emailError,
      );
    }
    try {
      await runUserAutomationRules({
        trigger: NotificationAutomationTrigger.MEAL_PLAN_READY,
        userId,
        dedupeScope: `meal-plan-ready-${userId}-${formatISO(today, { representation: "date" })}`,
      });
      await scheduleMealReminders(
        userId,
        mealPlanResults.map(({ date }) => date),
      );
    } catch (notificationError) {
      console.error("[MEAL_PLAN_NOTIFICATIONS]", notificationError);
    }
    await reportProgress?.(97, "Your meal plan is ready");

    return mealPlanResults;
  } catch (error) {
    console.error("Error generating or uploading meal plans:", error);
    throw error;
  }
};

// Function to get dates between start and end date inclusive
const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
