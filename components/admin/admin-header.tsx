import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminNavUser } from "@/components/admin/admin-nav-user";

export function AdminHeader() {
  return (
    <header className="admin-shell-header sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b px-3 backdrop-blur-xl md:pl-6 md:pr-3">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <AdminBreadcrumbs />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ModeToggle />
        <AdminNavUser variant="header" />
      </div>
    </header>
  );
}
