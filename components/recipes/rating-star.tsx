"use client";

import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
}
const StarFullIcon = () => (
  <Star
    className="h-5 w-5 text-yellow-500 mr-1"
    aria-hidden="true"
    fill="currentColor"
  />
);
const StarHalfIcon = () => (
  <StarHalf
    className="h-5 w-5 text-yellow-500 mr-1"
    aria-hidden="true"
    fill="currentColor"
  />
);
const RatingStars = ({ rating }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars !== 0;

  const fullStarComponents = Array.from({ length: fullStars }, (_, index) => (
    <StarFullIcon key={index} />
  ));

  if (hasHalfStar) {
    fullStarComponents.push(<StarHalfIcon key="half-star" />);
  }

  return <div className="flex">{fullStarComponents}</div>;
};

export default RatingStars;
