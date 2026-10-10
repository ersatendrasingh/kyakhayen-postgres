import { Metadata } from "next";
import MealPlan from "@/components/meal-plan/meal-plan";
import { buildSeoMetadata } from "@/lib/seo";

const meta = {
  title: "Personalized Meal Plans | Kya Khayen",
  description:
    "Explore weekly meal ideas based on your food preferences, favourite cuisines and ingredients you want to avoid.",
  image: "/meta-images/meal-plan.png",
};

export const metadata: Metadata = buildSeoMetadata({
  title: meta.title,
  description: meta.description,
  path: "/meal-plan",
  image: meta.image,
  imageAlt: "Kya Khayen personalized meal plans",
  keywords: [
    "weekly meal plan",
    "personalized meal plan",
    "healthy meal plan",
    "meal planner",
    "meal planning ideas",
  ],
});
const MealPlanPage = async () => {
  return (
    <div>
      <MealPlan />
    </div>
  );
};

export default MealPlanPage;
