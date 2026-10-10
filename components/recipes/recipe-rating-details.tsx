"use client";

import { FaEye } from "react-icons/fa";
import RatingStars from "@/components/recipes/rating-star";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface RecipeRatingDetailsProps {
  rating: number;
  reviews: number;
  totalViewsCount: number;
}

const RecipeRatingDetails = ({
  rating,
  reviews,
  totalViewsCount,
}: RecipeRatingDetailsProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center md:my-2">
      {rating > 0 && (
        <div className="text-sm text-gray-700 flex items-center">
          <Badge className="bg-websecondary mr-2">{rating.toFixed(1)}</Badge>

          <RatingStars rating={rating} />
        </div>
      )}
      <div className="text-sm text-gray-700 flex items-center md:flex-grow">
        {reviews > 0 && (
          <p
            className={cn(
              "md:text-md bg-gray-200/20 hover:bg-gray-200/60 transition duration-300 cursor-pointer p-2 rounded-md md:ml-4",
              rating > 0 && "ml-2"
            )}
          >
            {`${reviews.toLocaleString()} Ratings`}
          </p>
        )}

        {totalViewsCount > 0 && (
          <p
            className={cn("text-sm text-black ", reviews > 0 && "ml-2 md:ml-4")}
          >
            <FaEye className="inline-flex mr-2 w-5 h-5" />
            {`${totalViewsCount.toLocaleString()} Unique Views`}
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipeRatingDetails;
