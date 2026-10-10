"use client";
import { FaStar } from "react-icons/fa";

const StarRatingSkeleton = () => {
  return (
    <div className="flex space-x-2 items-center">
      <div className="animate-pulse">
        <FaStar className="text-gray-300 w-6 h-6" />
      </div>
      <div className="animate-pulse">
        <FaStar className="text-gray-300 w-6 h-6" />
      </div>
      <div className="animate-pulse">
        <FaStar className="text-gray-300 w-6 h-6" />
      </div>
      <div className="animate-pulse">
        <FaStar className="text-gray-300 w-6 h-6" />
      </div>
      <div className="animate-pulse">
        <FaStar className="text-gray-300 w-6 h-6" />
      </div>
    </div>
  );
};

export default StarRatingSkeleton;
