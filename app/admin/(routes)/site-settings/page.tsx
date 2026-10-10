import { Settings2 } from "lucide-react";

import { MediaStorageSettings } from "@/components/admin/site-settings/media-storage-settings";

export default function SiteSettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-3 text-primary"><Settings2 className="size-6" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Platform configuration</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Site settings</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Choose the primary media provider and manage Cloudinary securely while retaining Amazon S3 as a fallback.</p>
          </div>
        </div>
      </section>
      <MediaStorageSettings />
    </div>
  );
}
