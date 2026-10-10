"use client";

import axios from "axios";
import { Check, EllipsisVertical, Loader2, PencilLine, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CommunityAuthorAvatar } from "@/components/community-author-avatar";
import LinkedText from "@/components/linked-text";
import { CommentDeleteConfirmModal } from "@/components/modals/comment-delete-confirm-modal";
import StarRating from "@/components/reviews/star-rating";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { timeAgo } from "@/lib/comment-time";
import type { ReviewWithRelations } from "@/types/review";

interface ReviewsRatingListProps {
  recipeId: string;
  reviews: ReviewWithRelations[];
  onReviewAdded: () => void;
}

const ReviewsRatingList = ({
  recipeId,
  reviews,
  onReviewAdded,
}: ReviewsRatingListProps) => {
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const user = useCurrentUser();

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      await axios.delete(`/api/reviews/${recipeId}/${reviewId}`);
      toast.success("Review deleted.");
      onReviewAdded();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("We could not delete this review.");
    } finally {
      setDeletingId(null);
      setReviewToDelete(null);
    }
  };

  const handleEdit = (review: ReviewWithRelations) => {
    setEditingReviewId(review.id);
    setEditContent(review.comment);
    setEditRating(review.rating);
  };

  const handleSaveEdit = async (reviewId: string) => {
    if (!editContent.trim()) {
      toast.error("Write a short review before saving.");
      return;
    }

    setSavingId(reviewId);
    try {
      await axios.put(`/api/reviews/${recipeId}/${reviewId}`, {
        content: editContent.trim(),
        rating: editRating,
      });
      toast.success("Review updated.");
      setEditingReviewId(null);
      onReviewAdded();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("We could not update this review.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-[1.35rem] border border-[#eee1cf] bg-[#fcf7ed] p-4 dark:border-white/8 dark:bg-[#162e27] sm:p-5">
      <h3 className="mb-4 text-base font-semibold text-[#322820] dark:text-[#eef2ed]">
        Recent reviews
      </h3>
      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#dfccb0] p-5 text-sm text-[#75665a] dark:border-white/10 dark:text-[#a7b5af]">
          Be the first cook to share a rating for this recipe.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const editing = editingReviewId === review.id;
            return (
              <article
                key={review.id}
                className="rounded-2xl border border-[#ece0ce] bg-[#fffdf8] p-4 dark:border-white/8 dark:bg-[#11251f]"
              >
                <div className="flex gap-3">
                  <CommunityAuthorAvatar
                    image={review.user?.image}
                    name={review.user?.name}
                    className="size-[42px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#342920] dark:text-[#eef2ec]">
                          {review.user?.name || "Home cook"}
                        </p>
                        <p className="text-xs text-[#887566] dark:text-[#95a59e]">
                          {timeAgo(review.createdAt)}
                        </p>
                      </div>
                      {(review.userId === user?.id || user?.role === "ADMIN") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Review actions"
                              className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-transparent text-[#877565] transition hover:border-[#ebdac0] hover:bg-[#f7ecda] hover:text-[#3c3028] dark:text-[#9fb0a8] dark:hover:border-white/10 dark:hover:bg-white/6 dark:hover:text-white"
                            >
                              {deletingId === review.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <EllipsisVertical className="size-4" />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-[#eadbc4] bg-[#fffaf2] p-1.5 shadow-xl dark:border-white/10 dark:bg-[#183129]"
                          >
                            <DropdownMenuItem
                              onClick={() => handleEdit(review)}
                              className="rounded-lg px-3 py-2.5 text-[#54473d] focus:bg-[#f4e7d2] dark:text-[#dde5e0] dark:focus:bg-white/8"
                            >
                              <PencilLine className="mr-1 size-4" /> Edit review
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setReviewToDelete(review.id)}
                              variant="destructive"
                              className="rounded-lg px-3 py-2.5"
                            >
                              <Trash2 className="mr-1 size-4" /> Delete review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="mt-2">
                      <StarRating
                        value={editing ? editRating : review.rating}
                        onChange={editing ? setEditRating : undefined}
                        size={18}
                        activeClassName="fill-[#d5a044] text-[#d5a044]"
                      />
                    </div>
                    {editing ? (
                      <div className="mt-3 rounded-xl border border-[#ead9bd] bg-[#fcf4e7] p-3 dark:border-white/8 dark:bg-white/[0.035]">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a07a43] dark:text-[#d4ad6d]">
                          Edit your review
                        </p>
                        <textarea
                          value={editContent}
                          onChange={(event) => setEditContent(event.target.value)}
                          disabled={savingId === review.id}
                          className="min-h-24 w-full resize-none rounded-xl border border-[#e3d2b7] bg-[#fffdf8] p-3 text-sm leading-6 text-[#493b31] outline-none transition focus:border-[#c18d40] focus:ring-2 focus:ring-[#c18d40]/20 disabled:opacity-60 dark:border-white/10 dark:bg-[#10211c] dark:text-[#e5ece7]"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(review.id)}
                            disabled={savingId === review.id}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#17382d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#102b22] disabled:cursor-wait disabled:opacity-65 dark:bg-[#d3a04c] dark:text-[#10211c]"
                          >
                            {savingId === review.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            Update review
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            disabled={savingId === review.id}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dfceb4] px-4 py-2 text-xs font-medium text-[#63554a] dark:border-white/12 dark:text-[#bdc8c2]"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <LinkedText text={review.comment} className="mt-3 text-sm leading-6 text-[#64574b] dark:text-[#b2c0b9]" />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <CommentDeleteConfirmModal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={() => reviewToDelete && handleDelete(reviewToDelete)}
        itemLabel="review"
        isDeleting={Boolean(deletingId)}
      />
    </div>
  );
};

export default ReviewsRatingList;
