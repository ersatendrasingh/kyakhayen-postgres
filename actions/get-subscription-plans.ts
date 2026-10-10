"use server";
import { db } from "@/lib/db";
import { Feature, Plan } from "@prisma/client";
import { exchangePrice } from "@/lib/exchangePrice";

type SubscriptionPlan = Plan & {
  features: Feature[];
};

export const getSubscriptionPlans = async (
  userCurrency: string = "USD"
): Promise<SubscriptionPlan[]> => {
  try {
    const allSubscriptionPlans = await db.plan.findMany({
      where: {
        isPublished: true,
      },
      include: {
        features: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    const order = ["Bronze", "Silver", "Gold", "Platinum"];

    allSubscriptionPlans.sort((a, b) => {
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

    for (const plan of allSubscriptionPlans) {
      if (userCurrency !== "INR") {
        const exchangedPriceValue = await exchangePrice(
          plan.priceUsd!,
          userCurrency
        );
        const exchangedRegularPriceValue = await exchangePrice(
          plan.regularPriceUsd!,
          userCurrency
        );

        plan.priceUsd = exchangedPriceValue;
        plan.regularPriceUsd = exchangedRegularPriceValue;
      }
    }
    return allSubscriptionPlans;
  } catch (error) {
    console.error("[GET_SUBSCRIPTION_PLANS]", error);
    return [];
  }
};
