"use client";

import { ContactLeadStatus, type Prisma } from "@prisma/client";
import {
  ArrowUpRight,
  Clock3,
  Download,
  Inbox,
  Mail,
  MessageCircleMore,
  Phone,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ManagedContactQuery = Prisma.ContactUsQueriesGetPayload<{
  include: { activities: true };
}>;

const leadStatuses = [
  ContactLeadStatus.NEW,
  ContactLeadStatus.CONTACTED,
  ContactLeadStatus.INTERESTED,
  ContactLeadStatus.FOLLOW_UP,
  ContactLeadStatus.CONVERTED,
  ContactLeadStatus.NOT_INTERESTED,
  ContactLeadStatus.CLOSED,
] as const;

const methods = [
  { value: "PHONE", label: "Phone call" },
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "IN_PERSON", label: "In person" },
  { value: "INTERNAL_NOTE", label: "Internal note" },
] as const;

const activeLeadStatuses = new Set<ContactLeadStatus>([
  ContactLeadStatus.CONTACTED,
  ContactLeadStatus.INTERESTED,
  ContactLeadStatus.FOLLOW_UP,
]);

function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function inputDate(value = new Date()) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function statusLabel(status: ContactLeadStatus) {
  return {
    NEW: "New lead",
    CONTACTED: "Contacted",
    INTERESTED: "Interested",
    FOLLOW_UP: "Follow up",
    CONVERTED: "Converted",
    NOT_INTERESTED: "Not interested",
    CLOSED: "Closed",
  }[status];
}

function statusTone(status: ContactLeadStatus) {
  if (status === ContactLeadStatus.CONVERTED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (status === ContactLeadStatus.INTERESTED || status === ContactLeadStatus.FOLLOW_UP) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300";
  }
  if (status === ContactLeadStatus.NOT_INTERESTED || status === ContactLeadStatus.CLOSED) {
    return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
}

export function ContactQueriesDashboard({ queries }: { queries: ManagedContactQuery[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(queries[0]?.id || "");
  const [manageOpen, setManageOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leadStatus, setLeadStatus] = useState<ContactLeadStatus>(ContactLeadStatus.NEW);
  const [method, setMethod] = useState<(typeof methods)[number]["value"]>("PHONE");
  const [contactedAt, setContactedAt] = useState(inputDate());
  const [note, setNote] = useState("");
  const [closedReason, setClosedReason] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return queries.filter(
      (query) =>
        !term ||
        query.name.toLowerCase().includes(term) ||
        query.email.toLowerCase().includes(term) ||
        (query.phoneNumber || "").toLowerCase().includes(term) ||
        (query.query || "").toLowerCase().includes(term) ||
        statusLabel(query.status).toLowerCase().includes(term),
    );
  }, [queries, search]);

  const selected = filtered.find((query) => query.id === selectedId) || filtered[0];
  const newLeads = queries.filter((query) => query.status === ContactLeadStatus.NEW).length;
  const activeLeads = queries.filter((query) => activeLeadStatuses.has(query.status)).length;
  const converted = queries.filter((query) => query.status === ContactLeadStatus.CONVERTED).length;

  function openManager() {
    if (!selected) return;
    setLeadStatus(selected.status);
    setMethod("PHONE");
    setContactedAt(inputDate());
    setNote("");
    setClosedReason(selected.closedReason || "");
    setManageOpen(true);
  }

  async function saveActivity() {
    if (!selected) return;
    if (!note.trim()) {
      toast.error("Record what happened before saving this lead update.");
      return;
    }
    if (
      (leadStatus === ContactLeadStatus.CLOSED || leadStatus === ContactLeadStatus.NOT_INTERESTED) &&
      !closedReason.trim()
    ) {
      toast.error("Add a closure reason for this lead.");
      return;
    }
    try {
      setBusy(true);
      const response = await fetch(`/api/admin/contact-queries/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: leadStatus,
          contactMethod: method,
          contactedAt: new Date(contactedAt).toISOString(),
          note: note.trim(),
          closedReason: closedReason.trim() || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(typeof error === "string" ? error : "Unable to save lead activity.");
      }
      toast.success("Lead status and activity log saved.");
      setManageOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save lead activity.");
    } finally {
      setBusy(false);
    }
  }

  function exportQueries() {
    const csv = [
      ["Name", "Email", "Phone", "Status", "Last Contacted", "Message", "Received"],
      ...queries.map((query) => [
        query.name,
        query.email,
        query.phoneNumber || "",
        statusLabel(query.status),
        query.lastContactedAt ? new Date(query.lastContactedAt).toISOString() : "",
        query.query || "",
        new Date(query.createdAt).toISOString(),
      ]),
    ]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "contact-leads.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              CRM
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contact leads workspace</h1>
            <p className="admin-taxonomy-hero-copy text-sm sm:text-base">
              Read each enquiry clearly, track every follow-up and move interested customers
              through a reliable conversion pipeline.
            </p>
          </div>
          <Button variant="outline" className="admin-taxonomy-hero-action rounded-2xl" onClick={exportQueries}>
            <Download /> Export leads
          </Button>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Inbox} label="All Leads" value={String(queries.length)} />
          <Stat icon={MessageCircleMore} label="New Leads" value={String(newLeads)} />
          <Stat icon={Phone} label="In Conversation" value={String(activeLeads)} />
          <Stat icon={UserRound} label="Converted" value={String(converted)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
        <div className="grid h-[min(760px,calc(100vh-180px))] min-h-[620px] lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-b p-4 lg:border-b-0 lg:border-r sm:p-5">
            <div className="relative shrink-0">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads or status"
                className="h-12 rounded-2xl pl-11"
              />
            </div>
            <p className="mt-5 shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Leads ({filtered.length})
            </p>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {filtered.map((query) => {
                const active = selected?.id === query.id;
                return (
                  <button
                    type="button"
                    key={query.id}
                    onClick={() => setSelectedId(query.id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors ${
                      active
                        ? "border-webprimary/40 bg-webprimary/5"
                        : "border-transparent bg-muted/30 hover:border-border hover:bg-muted/55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-medium">{query.name}</p>
                      <Badge variant="outline" className={statusTone(query.status)}>
                        {statusLabel(query.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{query.email}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {query.query || "No message entered."}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">{date(query.createdAt)}</p>
                  </button>
                );
              })}
              {!filtered.length && (
                <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No leads match this search.
                </p>
              )}
            </div>
          </div>

          {selected ? (
            <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-start">
                <div>
                  <Badge variant="outline" className={statusTone(selected.status)}>
                    {statusLabel(selected.status)}
                  </Badge>
                  <h2 className="mt-3 text-2xl font-semibold">{selected.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Received {date(selected.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-xl" onClick={openManager}>
                    <Settings2 /> Manage lead
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: Your Kya Khayen enquiry")}`}>
                      <Mail /> Email
                    </a>
                  </Button>
                  {selected.phoneNumber && (
                    <Button asChild variant="outline" className="rounded-xl">
                      <a href={`tel:${selected.phoneNumber}`}>
                        <Phone /> Call
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 border-b py-6 sm:grid-cols-2 xl:grid-cols-3">
                <ContactItem icon={Mail} label="Email" value={selected.email} href={`mailto:${selected.email}`} />
                <ContactItem icon={Phone} label="Phone" value={selected.phoneNumber || "Not provided"} href={selected.phoneNumber ? `tel:${selected.phoneNumber}` : undefined} />
                <ContactItem
                  icon={Clock3}
                  label="Last contacted"
                  value={selected.lastContactedAt ? date(selected.lastContactedAt) : "Not contacted yet"}
                />
              </div>

              <div className="py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Customer message</p>
                <div className="mt-4 min-h-[180px] rounded-2xl border bg-muted/25 p-5 text-sm leading-7 whitespace-pre-wrap">
                  {selected.query || "The customer did not submit a written message."}
                </div>
              </div>

              {selected.activities[0] && (
                <div className="rounded-2xl border bg-muted/25 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Latest follow-up</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline" className={statusTone(selected.activities[0].status)}>
                      {statusLabel(selected.activities[0].status)}
                    </Badge>
                    <span className="text-muted-foreground">{date(selected.activities[0].contactedAt)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{selected.activities[0].note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <Inbox className="mx-auto mb-3 size-8" />
                <p>Select a lead to review it.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-[28px] p-0 sm:max-w-5xl">
          {selected && (
            <>
              <DialogHeader className="border-b bg-muted/20 px-6 py-6 text-left">
                <DialogTitle className="text-2xl">Manage {selected.name}</DialogTitle>
                <DialogDescription>
                  Log every conversation and keep the lead status reliable for your team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid min-h-0 md:grid-cols-[minmax(320px,0.95fr)_minmax(320px,1.05fr)]">
                <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto border-b px-6 py-5 md:border-b-0 md:border-r">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>New status</Label>
                      <Select value={leadStatus} onValueChange={(value) => setLeadStatus(value as ContactLeadStatus)}>
                        <SelectTrigger className="!h-11 w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact method</Label>
                      <Select value={method} onValueChange={(value) => setMethod(value as typeof method)}>
                        <SelectTrigger className="!h-11 w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methods.map((entry) => (
                            <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-contacted-at">Conversation time</Label>
                    <Input
                      id="lead-contacted-at"
                      type="datetime-local"
                      value={contactedAt}
                      onChange={(event) => setContactedAt(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-note">What happened?</Label>
                    <Textarea
                      id="lead-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Example: Discussed monthly plan. Customer wants to confirm after viewing a sample meal plan."
                      className="min-h-32 rounded-xl"
                    />
                  </div>
                  {(leadStatus === ContactLeadStatus.CLOSED || leadStatus === ContactLeadStatus.NOT_INTERESTED) && (
                    <div className="space-y-2">
                      <Label htmlFor="lead-close-reason">Closure reason</Label>
                      <Textarea
                        id="lead-close-reason"
                        value={closedReason}
                        onChange={(event) => setClosedReason(event.target.value)}
                        placeholder="Why was this lead closed?"
                        className="min-h-24 rounded-xl"
                      />
                    </div>
                  )}
                  <Button className="w-full rounded-xl" disabled={busy} onClick={() => void saveActivity()}>
                    {busy ? "Saving activity..." : "Save activity and status"}
                  </Button>
                </div>

                <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Lead activity log
                  </p>
                  <div className="mt-5 space-y-4">
                    {selected.activities.map((activity) => (
                      <div key={activity.id} className="relative rounded-2xl border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={statusTone(activity.status)}>
                            {statusLabel(activity.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{date(activity.contactedAt)}</span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{activity.note}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {activity.contactMethod?.replaceAll("_", " ") || "Activity"} by {activity.createdByName || "Admin"}
                        </p>
                      </div>
                    ))}
                    {!selected.activities.length && (
                      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No follow-up logged yet. Add the first conversation update.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e7c9a4] bg-background/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        <Icon className="size-5 text-webprimary" />
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const contents = (
    <>
      <span className="flex size-10 items-center justify-center rounded-full bg-webprimary/10 text-webprimary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-medium">{value}</span>
      </span>
      {href && <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />}
    </>
  );
  return href ? (
    <a href={href} className="flex items-center gap-3 rounded-2xl border p-3 hover:bg-muted/40">
      {contents}
    </a>
  ) : (
    <div className="flex items-center gap-3 rounded-2xl border p-3">{contents}</div>
  );
}
