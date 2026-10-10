import { db } from "@/lib/db";
import { SubscriptionPlansDashboard } from "@/components/admin/commerce/subscription-plans-dashboard";

const SubscriptionPlansPage = async () => {
  const plans = await db.plan.findMany({
    include: {
      features: { orderBy: { position: "asc" } },
      _count: { select: { UserPlan: true, PlanOnCoupon: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <SubscriptionPlansDashboard plans={plans} />
    </div>
  );
};

export default SubscriptionPlansPage;
