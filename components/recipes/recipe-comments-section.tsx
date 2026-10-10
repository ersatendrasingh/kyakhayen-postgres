"use client";

import axios from "axios";
import { useState } from "react";

import { CommentsForm } from "@/components/comments/comments-form";
import CommentsList from "@/components/comments/comments-list";
import { CommentWithRelations } from "@/types/comment";

interface RecipeCommentSectionProps {
  recipeId: string;
  comments?: CommentWithRelations[];
}

const RecipeCommentSection = ({
  recipeId,
  comments,
}: RecipeCommentSectionProps) => {
  const [commentsList, setCommentsList] = useState<CommentWithRelations[]>(
    comments || []
  );

  const handleCommentAdded = async () => {
    try {
      const response = await axios.get(`/api/comments/${recipeId}`);

      setCommentsList(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  return (
    <section className="recipe-support-panel overflow-hidden rounded-[1.75rem] border border-[#eadcc8] bg-[#fffdf8] p-5 shadow-sm dark:border-white/10 dark:bg-[#10221d] sm:p-7">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a47a3f] dark:text-[#d6ad63]">
          Cook together
        </p>
        <h2 className="text-2xl font-semibold text-[#2e251f] dark:text-[#f2f3ed]">
          Questions & kitchen tips
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#75665a] dark:text-[#aab8b1]">
          Ask about substitutions or share a useful cooking tip.
        </p>
      </div>
      <div className="space-y-5">
        <CommentsForm recipeId={recipeId} onCommentAdded={handleCommentAdded} />
        <CommentsList
          recipeId={recipeId}
          comments={commentsList}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </section>
  );
};

export default RecipeCommentSection;
