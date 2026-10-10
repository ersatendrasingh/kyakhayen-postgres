"use client";

import axios from "axios";
import { ArrowRight, LoaderCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import StarRating from "@/components/reviews/star-rating";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ReviewsRatingFormProps {
  recipeId: string;
  onReviewAdded: () => void;
}

export const ReviewsRatingForm = ({
  recipeId,
  onReviewAdded,
}: ReviewsRatingFormProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useCurrentUser();

  const handleSubmit = async () => {
    if (!user) {
      return;
    }
    if (rating < 1 || rating > 5) {
      setRatingError("Choose a rating before sharing your review.");
      return;
    }

    setRatingError(null);
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/reviews", {
        recipeId,
        rating,
        review,
      });
      if (response.status === 200) {
        toast.success("Your review has been shared.");
        onReviewAdded();
        setRating(0);
        setReview("");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("We could not save your review right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[1.35rem] border border-[#eee1cf] bg-[#fcf7ed] p-5 dark:border-white/8 dark:bg-[#162e27]">
      <h3 className="text-base font-semibold text-[#322820] dark:text-[#eef2ed]">
        Tried this recipe?
      </h3>
      <p className="mt-1 text-sm leading-6 text-[#75665a] dark:text-[#a7b5af]">
        Rate the taste and tell others what worked for you.
      </p>
      {user ? (
        <div className="mt-5 space-y-4">
          <StarRating value={rating} onChange={setRating} size={28} />
          {ratingError && <p className="text-xs text-[#b83324]">{ratingError}</p>}
          <textarea
            className="min-h-28 w-full resize-none rounded-xl border border-[#e3d2b7] bg-[#fffdf8] p-3 text-sm text-[#332820] outline-none transition focus:border-[#bd8b40] dark:border-white/10 dark:bg-[#11251f] dark:text-[#edf2ec]"
            placeholder="How was the flavour, texture or preparation?"
            value={review}
            onChange={(event) => setReview(event.target.value)}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#b83324] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9c2d21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            Share review
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-[#eadcc8] bg-[#fffdf8] p-4 dark:border-white/10 dark:bg-[#10241e]">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f6e8d2] text-[#b83324] dark:bg-white/8 dark:text-[#dfb36c]">
              <LogIn className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#332820] dark:text-[#eef2ed]">
                Sign in to rate this recipe
              </p>
              <p className="mt-1 text-xs leading-5 text-[#75665a] dark:text-[#a7b5af]">
                Share your result after you have cooked it.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/auth/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#b83324] px-4 text-xs font-semibold text-white transition hover:bg-[#9c2d21]"
            >
              Sign in <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center rounded-full border border-[#decbb0] px-4 text-xs font-semibold text-[#57493e] transition hover:bg-[#f8ecda] dark:border-white/12 dark:text-[#d6dfda] dark:hover:bg-white/6"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
