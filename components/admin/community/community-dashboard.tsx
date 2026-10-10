"use client";

import type { Prisma } from "@prisma/client";
import {
  CheckCircle2,
  Eye,
  MessageSquareText,
  Search,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type ModerationComment = Prisma.CommentGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    recipe: { select: { id: true; title: true } };
    Post: { select: { id: true; title: true } };
  };
}>;

export type ModerationReview = Prisma.ReviewGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    recipe: { select: { id: true; title: true } };
  };
}>;

type ModerationItem = {
  id: string;
  parentId: string | null;
  kind: "comment" | "review";
  author: string;
  email: string;
  content: string;
  target: string;
  rating: number | null;
  likes: number | null;
  approved: boolean;
  createdAt: Date;
};

function day(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(approved: boolean) {
  return approved
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
}

export function CommunityDashboard({
  comments,
  reviews,
  initialType = "all",
}: {
  comments: ModerationComment[];
  reviews: ModerationReview[];
  initialType?: "all" | "comment" | "review";
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<ModerationItem | null>(null);
  const [deleting, setDeleting] = useState<ModerationItem | null>(null);

  const items: ModerationItem[] = [
    ...comments.map((comment) => ({
      id: comment.id,
      parentId: comment.recipeId || comment.postId,
      kind: "comment" as const,
      author: comment.user?.name || "Guest user",
      email: comment.user?.email || "",
      content: comment.content,
      target: comment.recipe?.title || comment.Post?.title || "Removed content",
      rating: null,
      likes: comment.likes || 0,
      approved: comment.isPublished,
      createdAt: comment.createdAt,
    })),
    ...reviews.map((review) => ({
      id: review.id,
      parentId: review.recipeId,
      kind: "review" as const,
      author: review.user?.name || "Registered user",
      email: review.user?.email || "",
      content: review.comment,
      target: review.recipe.title,
      rating: review.rating,
      likes: null,
      approved: review.isPublished,
      createdAt: review.createdAt,
    })),
  ].sort((first, second) => +new Date(second.createdAt) - +new Date(first.createdAt));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = type === "all" || item.kind === type;
      const matchesStatus =
        status === "all" ||
        (status === "pending" && !item.approved) ||
        (status === "approved" && item.approved);
      const matchesSearch =
        !term ||
        item.author.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.target.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [items, search, status, type]);

  const pending = items.filter((item) => !item.approved).length;
  const approved = items.length - pending;
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : "-";

  async function updateApproval(item: ModerationItem, publish: boolean) {
    if (!item.parentId) {
      toast.error("This entry is no longer connected to a recipe or article.");
      return;
    }
    try {
      setBusyId(item.id);
      const path = item.kind === "comment" ? "comments" : "reviews";
      const action = publish ? "approve" : "unapprove";
      const response = await fetch(`/api/${path}/${item.parentId}/${item.id}/${action}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(`Unable to ${publish ? "approve" : "hide"} this ${item.kind}.`);
      toast.success(`${item.kind === "comment" ? "Comment" : "Review"} ${publish ? "approved" : "hidden"}.`);
      setReviewing(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update moderation status.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem() {
    if (!deleting?.parentId) return;
    try {
      setBusyId(deleting.id);
      const path = deleting.kind === "comment" ? "comments" : "reviews";
      const response = await fetch(`/api/${path}/${deleting.parentId}/${deleting.id}/delete`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Unable to delete this ${deleting.kind}.`);
      toast.success(`${deleting.kind === "comment" ? "Comment" : "Review"} deleted.`);
      setDeleting(null);
      setReviewing(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete entry.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <TooltipProvider delayDuration={120}>
    <div className="space-y-6">
      <section className="admin-taxonomy-hero rounded-[32px] p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] max-w-3xl space-y-3">
          <span className="admin-taxonomy-hero-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
            Community
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Moderation dashboard</h1>
          <p className="admin-taxonomy-hero-copy text-sm sm:text-base">
            Review comments and ratings in one queue, approve helpful feedback and remove content
            that should not appear publicly.
          </p>
        </div>
        <div className="relative z-[1] mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat icon={MessageSquareText} label="Comments" value={String(comments.length)} />
          <Stat icon={Star} label="Reviews" value={String(reviews.length)} />
          <Stat icon={CheckCircle2} label="Approved" value={String(approved)} />
          <Stat icon={Star} label="Average Rating" value={averageRating} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Moderation queue</h2>
            <p className="text-sm text-muted-foreground">{pending} entries awaiting a decision.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-[260px]">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user, recipe or message"
                className="h-12 rounded-2xl pl-11"
              />
            </div>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger className="!h-12 w-full rounded-2xl px-4 sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All content</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="!h-12 w-full rounded-2xl px-4 sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Recipe / Article</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={`${item.kind}-${item.id}`}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.kind === "review" ? <Star className="fill-current" /> : <MessageSquareText />}
                      {item.kind}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{item.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.kind === "review" && item.rating !== null
                        ? `${item.rating} / 5 stars`
                        : `${item.likes || 0} likes`}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">{item.target}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {day(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(item.approved)}>
                      {item.approved ? "Live" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="ml-auto flex rounded-xl"
                          aria-label={`Review ${item.kind}`}
                          onClick={() => setReviewing(item)}
                        >
                          <Eye />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6}>Review entry</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    No community entries match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={Boolean(reviewing)} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] p-0 sm:max-w-2xl">
          {reviewing && (
            <>
              <DialogHeader className="border-b bg-muted/20 px-6 py-6 text-left">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {reviewing.kind === "review" ? <Star className="fill-current" /> : <MessageSquareText />}
                    {reviewing.kind}
                  </Badge>
                  <Badge variant="outline" className={statusTone(reviewing.approved)}>
                    {reviewing.approved ? "Live" : "Pending"}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">Review community submission</DialogTitle>
                <DialogDescription>
                  Read the complete submission before deciding whether it should be visible publicly.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[calc(100vh-295px)] space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ReviewFact label="Customer" value={reviewing.author} secondary={reviewing.email || "No email available"} />
                  <ReviewFact label="Published on" value={reviewing.target} secondary={day(reviewing.createdAt)} />
                </div>

                <div className="rounded-2xl border bg-muted/20 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Full {reviewing.kind}
                    </p>
                    {reviewing.rating !== null ? (
                      <p className="text-sm font-semibold text-amber-600">{reviewing.rating} / 5 stars</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">{reviewing.likes || 0} likes</p>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7">{reviewing.content}</p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t bg-background px-6 py-5 sm:flex-row sm:justify-between">
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={busyId === reviewing.id || !reviewing.parentId}
                  onClick={() => setDeleting(reviewing)}
                >
                  <Trash2 />
                  Delete permanently
                </Button>
                <Button
                  className="rounded-xl"
                  variant={reviewing.approved ? "outline" : "default"}
                  disabled={busyId === reviewing.id || !reviewing.parentId}
                  onClick={() => void updateApproval(reviewing, !reviewing.approved)}
                >
                  {reviewing.approved ? <Undo2 /> : <CheckCircle2 />}
                  {reviewing.approved ? "Hide from public" : "Approve for public"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {deleting?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the entry from the public conversation and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void deleteItem()}>
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}

function ReviewFact({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{secondary}</p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquareText;
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
