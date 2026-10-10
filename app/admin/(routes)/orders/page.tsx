import { OrdersDashboard } from "@/components/admin/commerce/orders-dashboard";
import { db } from "@/lib/db";

const OrdersPage = async () => {
  const orders = await db.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          plan: { select: { id: true, name: true, durationDays: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <OrdersDashboard orders={orders} />
    </div>
  );
};

export default OrdersPage;
