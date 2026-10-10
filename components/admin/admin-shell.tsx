import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen className="admin-shell">
      <AdminSidebar />
      <SidebarInset className="admin-shell-main min-w-0 overflow-x-clip">
        <AdminHeader />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-clip bg-transparent p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
