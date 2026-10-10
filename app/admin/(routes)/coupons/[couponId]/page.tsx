import { redirect } from "next/navigation";

import { CouponEditor } from "@/components/admin/commerce/coupon-editor";
import { db } from "@/lib/db";

const CouponIdPage = async (props: { params: Promise<{ couponId: string }> }) => {
  const params = await props.params;
  const [coupon, plans] = await Promise.all([
    db.coupon.findUnique({
      where: { id: params.couponId },
      include: {
        PlanOnCoupon: { include: { plan: true } },
        _count: { select: { UserCoupon: true } },
      },
    }),
    db.plan.findMany({ orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }] }),
  ]);
  if (!coupon) redirect("/admin/coupons");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CouponEditor coupon={coupon} plans={plans} />
    </div>
  );
};

export default CouponIdPage;
