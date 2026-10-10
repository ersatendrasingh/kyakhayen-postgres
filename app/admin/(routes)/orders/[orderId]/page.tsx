import { redirect } from "next/navigation";

import { OrderDetail } from "@/components/admin/commerce/order-detail";
import { db } from "@/lib/db";

const OrderDetailPage = async (props: { params: Promise<{ orderId: string }> }) => {
  const { orderId } = await props.params;
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        include: {
          UserPlan: { include: { plan: true }, orderBy: { endDate: "desc" } },
        },
      },
      items: { include: { plan: true } },
    },
  });

  if (!order) redirect("/admin/orders");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <OrderDetail order={order} />
    </div>
  );
};

export default OrderDetailPage;
