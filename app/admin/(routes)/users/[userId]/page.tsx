import { redirect } from "next/navigation";

import { UserDetail } from "@/components/admin/users/user-detail";
import { db } from "@/lib/db";

const UserDetailPage = async (props: { params: Promise<{ userId: string }> }) => {
  const { userId } = await props.params;
  const [user, plans, foodPreferences, cookingSkills, cuisines, allergies] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        foodPreference: true,
        cookingSkill: true,
        userCuisines: { include: { cuisine: true } },
        UserAllrgies: { include: { allergy: true } },
        UserPlan: { include: { plan: true }, orderBy: { endDate: "desc" } },
        UserMealPlan: { orderBy: { planStartDate: "desc" } },
        Order: { orderBy: { createdAt: "desc" } },
        _count: {
          select: { Favorite: true, Review: true, Comment: true, RecipeReaction: true },
        },
      },
    }),
    db.plan.findMany({
      select: { id: true, name: true, durationDays: true, isPublished: true },
      orderBy: { name: "asc" },
    }),
    db.recipeCategories.findMany({
      select: { id: true, name: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    db.recipeDifficulty.findMany({
      select: { id: true, title: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    }),
    db.cuisines.findMany({
      select: { id: true, title: true, imageUrl: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    }),
    db.allergies.findMany({
      select: { id: true, title: true, imageUrl: true },
      orderBy: [{ position: "asc" }, { title: "asc" }],
    }),
  ]);

  if (!user) redirect("/admin/users");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UserDetail
        user={user}
        options={{ plans, foodPreferences, cookingSkills, cuisines, allergies }}
      />
    </div>
  );
};

export default UserDetailPage;
