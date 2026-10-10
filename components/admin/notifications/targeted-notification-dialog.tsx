"use client";

import { BellRing, CalendarClock, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MediaField } from "@/components/admin/media/media-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TargetedNotificationDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string | null; email: string | null };
}) {
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    url: "/",
    imageUrl: null as string | null,
    scheduledAt: "",
  });

  async function sendNotification() {
    try {
      setSending(true);
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: "USER",
          userId: user.id,
          ...form,
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result === "string" ? result : "Unable to send notification.");
      toast.success(form.scheduledAt ? "Customer notification scheduled." : "Customer notification processed.");
      setForm({ title: "", body: "", url: "/", imageUrl: null, scheduledAt: "" });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send customer notification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BellRing className="size-5" /> Send push notification</DialogTitle>
          <DialogDescription>
            Send directly to {user.name || user.email || "this customer"} on subscribed devices.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Title">
            <Input value={form.title} maxLength={120} placeholder="A useful update for you" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="Message">
            <Textarea value={form.body} maxLength={300} rows={4} placeholder="Tell the customer what is ready and where to open it." onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Open link">
              <Input value={form.url} placeholder="/meal-plan" onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} />
            </Field>
            <Field label="Schedule (optional)">
              <Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} />
            </Field>
          </div>
          <MediaField label="Rich notification image" value={form.imageUrl} onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} accept="image" disabled={sending} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={sending || !form.title.trim() || !form.body.trim()} onClick={() => void sendNotification()}>
            {sending ? <LoaderCircle className="animate-spin" /> : form.scheduledAt ? <CalendarClock /> : <Send />}
            {form.scheduledAt ? "Schedule" : "Send push"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
