import { db } from "@/lib/db";
import { CouponsDashboard } from "@/components/admin/commerce/coupons-dashboard";

const CouponsPage = async () => {
  const coupons = await db.coupon.findMany({
    include: {
      PlanOnCoupon: {
        include: { plan: { select: { id: true, name: true } } },
      },
      _count: { select: { UserCoupon: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CouponsDashboard coupons={coupons} />
    </div>
  );
};

export default CouponsPage;
