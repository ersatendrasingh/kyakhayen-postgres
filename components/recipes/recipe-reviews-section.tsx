"use client";

import axios from "axios";
import { Star } from "lucide-react";
import { useState } from "react";

import { ReviewsRatingForm } from "@/components/reviews/reviews-rating-form";
import ReviewsRatingList from "@/components/reviews/reviews-rating-list";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { ReviewWithRelations } from "@/types/review";

interface RecipeReviewsSectionProps {
  recipeId: string;
  reviews?: ReviewWithRelations[];
}

const RecipeReviewsSection = ({
  recipeId,
  reviews,
}: RecipeReviewsSectionProps) => {
  const [reviewsList, setReviewsList] = useState<ReviewWithRelations[]>(
    reviews || [],
  );
  const user = useCurrentUser();
  const userHasReviewed = Boolean(
    user && reviewsList.some((review) => review.userId === user.id),
  );
  const averageRating = reviewsList.length
    ? reviewsList.reduce((sum, review) => sum + review.rating, 0) /
      reviewsList.length
    : 0;

  const refreshReviews = async () => {
    try {
      const response = await axios.get<ReviewWithRelations[]>(
        `/api/reviews/${recipeId}`,
      );
      setReviewsList(response.data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  return (
    <section className="recipe-support-panel overflow-hidden rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm dark:border-white/10 dark:bg-[#10221d] sm:p-7">
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
            Cooked by the community
          </p>
          <h2 className="text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
            Ratings & reviews
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#75665a] dark:text-[#aab8b1]">
            Share how this recipe tasted after you tried it.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#ecdec9] bg-[#fbf4e8] px-4 py-3 dark:border-white/8 dark:bg-[#162e27]">
          <Star className="size-5 fill-[#d7a343] text-[#d7a343]" />
          <span className="text-2xl font-semibold text-[#332820] dark:text-[#eef2ec]">
            {reviewsList.length ? averageRating.toFixed(1) : "-"}
          </span>
          <span className="text-xs text-[#806e60] dark:text-[#a6b5ae]">
            {reviewsList.length} {reviewsList.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {!userHasReviewed && (
          <ReviewsRatingForm
            recipeId={recipeId}
            onReviewAdded={refreshReviews}
          />
        )}
        <ReviewsRatingList
          recipeId={recipeId}
          reviews={reviewsList}
          onReviewAdded={refreshReviews}
        />
      </div>
    </section>
  );
};

export default RecipeReviewsSection;
