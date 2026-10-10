import { db } from "@/lib/db";
import { ContactQueriesDashboard } from "@/components/admin/support/contact-queries-dashboard";

const ContactQueriesPage = async () => {
  const queries = await db.contactUsQueries.findMany({
    include: {
      activities: { orderBy: { contactedAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ContactQueriesDashboard queries={queries} />
    </div>
  );
};

export default ContactQueriesPage;
