import { AdminShell } from "@/components/admin/admin-shell";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = async ({ children }: AdminLayoutProps) => {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=%2Fadmin%2Fdashboard");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
};

export default AdminLayout;
