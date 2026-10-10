import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { UsersDashboard } from "@/components/admin/users/users-dashboard";

const PAGE_SIZE = 12;

type UserSearchParams = Promise<{
  q?: string | string[];
  segment?: string | string[];
  page?: string | string[];
}>;

const singleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const UsersPage = async ({
  searchParams,
}: {
  searchParams: UserSearchParams;
}) => {
  const params = await searchParams;
  const search = singleParam(params.q).trim();
  const segment = singleParam(params.segment);
  const requestedPage = Math.max(
    Number.parseInt(singleParam(params.page) || "1", 10) || 1,
    1,
  );
  const referenceDate = new Date();

  const activeAccessFilter: Prisma.UserWhereInput = {
    isActive: true,
    UserPlan: {
      some: {
        OR: [{ endDate: null }, { endDate: { gte: referenceDate } }],
      },
    },
  };
  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phoneNumber: { contains: search } },
            { UserPlan: { some: { plan: { name: { contains: search } } } } },
          ],
        }
      : {}),
    ...(segment === "member"
      ? activeAccessFilter
      : segment === "personalized"
        ? { isPersonalised: true }
        : segment === "pending"
          ? { isPersonalised: false }
          : segment === "suspended"
            ? { isActive: false }
            : {}),
  };

  const [total, activeMembers, personalized, verified, totalFiltered] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: activeAccessFilter }),
      db.user.count({ where: { isPersonalised: true } }),
      db.user.count({ where: { emailVerified: { not: null } } }),
      db.user.count({ where }),
    ]);

  const pageCount = Math.max(Math.ceil(totalFiltered / PAGE_SIZE), 1);
  const page = Math.min(requestedPage, pageCount);
  const users = await db.user.findMany({
    where,
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
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UsersDashboard
        key={[search, segment, page].join(":")}
        users={users}
        referenceDate={referenceDate.toISOString()}
        stats={{
          total,
          activeMembers,
          personalized,
          verified,
        }}
        filters={{ search, segment }}
        page={page}
        pageCount={pageCount}
        totalFiltered={totalFiltered}
      />
    </div>
  );
};

export default UsersPage;
