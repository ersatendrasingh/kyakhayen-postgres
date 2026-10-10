"use client";

import axios from "axios";
import { useState } from "react";

import { CommentsForm } from "@/components/comments/comments-form";
import CommentsList from "@/components/comments/comments-list";
import { CommentWithRelations } from "@/types/comment";

interface ArticleCommentsProps {
  articleId: string;
  comments?: CommentWithRelations[];
}

const ArticleComments = ({ articleId, comments }: ArticleCommentsProps) => {
  const [commentsList, setCommentsList] = useState<CommentWithRelations[]>(
    comments || []
  );

  const handleCommentAdded = async () => {
    try {
      const response = await axios.get(`/api/comments/${articleId}`);

      setCommentsList(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  return (
    <div className="mt-5 w-full space-y-5">
      <CommentsForm postId={articleId} onCommentAdded={handleCommentAdded} />
      <CommentsList
        postId={articleId}
        comments={commentsList}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default ArticleComments;
