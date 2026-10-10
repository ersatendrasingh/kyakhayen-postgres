"use client";
import axios from "axios";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  commentId: string;
  postId?: string;
  initialLikes?: number | null;
}

const LikeButton = ({ commentId, postId, initialLikes }: LikeButtonProps) => {
  const [likes, setLikes] = useState(initialLikes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const user = useCurrentUser();

  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await axios.get(
          `/api/comments/${postId}/${commentId}/like-status`
        );
        setIsLiked(response.data.isLiked);
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    fetchLikeStatus();
  }, [commentId, postId]);

  const handleLike = async () => {
    if (!user) {
      return;
    }
    const previousLikes = likes;
    const previousIsLiked = isLiked;

    if (isLiked) {
      // Optimistically update UI
      setLikes(likes - 1);
      setIsLiked(false);
      try {
        // Unlike the comment
        await axios.delete(`/api/comments/${postId}/${commentId}/unlike`);
      } catch (error) {
        // Revert UI update if API call fails
        setLikes(previousLikes);
        setIsLiked(previousIsLiked);
        console.error("Error unliking comment:", error);
      }
    } else {
      // Optimistically update UI
      setLikes(likes + 1);
      setIsLiked(true);
      try {
        // Like the comment
        await axios.post(`/api/comments/${postId}/${commentId}/like`);
      } catch (error) {
        // Revert UI update if API call fails
        setLikes(previousLikes);
        setIsLiked(previousIsLiked);
        console.error("Error liking comment:", error);
      }
    }
  };

  return (
    <div className="flex items-center">
      {user ? (
        <button
          type="button"
          onClick={handleLike}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
            isLiked
              ? "bg-[#f9e5e1] text-[#b83324] hover:bg-[#f5d7d1] dark:bg-[#b83324]/16 dark:text-[#ec796d]"
              : "text-[#817061] hover:bg-[#f4e7d4] hover:text-[#b83324] dark:text-[#a5b4ad] dark:hover:bg-white/7 dark:hover:text-[#ec796d]"
          )}
          aria-label={isLiked ? "Unlike comment" : "Like comment"}
        >
          <Heart className={cn("size-4", isLiked && "fill-current")} />
          <span>{isLiked ? "Liked" : "Like"}</span>
          <span className="tabular-nums">{likes}</span>
        </button>
      ) : (
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[#817061] transition hover:bg-[#f4e7d4] hover:text-[#b83324] dark:text-[#a5b4ad] dark:hover:bg-white/7 dark:hover:text-[#ec796d]"
          aria-label="Sign in to like comment"
        >
          <Heart className="size-4" />
          <span>Sign in to like</span>
          <span className="tabular-nums">{likes}</span>
        </Link>
      )}
    </div>
  );
};

export default LikeButton;
