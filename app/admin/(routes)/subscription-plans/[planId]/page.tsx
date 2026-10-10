import { redirect } from "next/navigation";

import { PlanEditor } from "@/components/admin/commerce/plan-editor";
import { db } from "@/lib/db";

const SubscriptionPlanIdPage = async (props: { params: Promise<{ planId: string }> }) => {
  const params = await props.params;
  const plan = await db.plan.findUnique({
    where: { id: params.planId },
    include: {
      features: { orderBy: { position: "asc" } },
      _count: { select: { UserPlan: true, PlanOnCoupon: true } },
    },
  });
  if (!plan) redirect("/admin/subscription-plans");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PlanEditor plan={plan} />
    </div>
  );
};

export default SubscriptionPlanIdPage;
