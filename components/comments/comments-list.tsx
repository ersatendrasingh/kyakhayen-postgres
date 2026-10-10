"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Clock3,
  EllipsisVertical,
  Loader2,
  MessageCircleReply,
  PencilLine,
  Trash2,
  X,
} from "lucide-react";
import axios from "axios";

import { CommunityAuthorAvatar } from "@/components/community-author-avatar";
import { Button } from "@/components/ui/button";
import { CommentsForm } from "@/components/comments/comments-form";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/comment-time";
import { CommentWithRelations } from "@/types/comment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentDeleteConfirmModal } from "@/components/modals/comment-delete-confirm-modal";
import LikeButton from "@/components/comments/like-button";
import { useCurrentUser } from "@/hooks/use-current-user";
import LinkedText from "@/components/linked-text";

interface CommentsListProps {
  postId?: string;
  recipeId?: string;
  comments: CommentWithRelations[];
  onCommentAdded: () => void;
}

const CommentsList = ({
  postId,
  recipeId,
  comments,
  onCommentAdded,
}: CommentsListProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const user = useCurrentUser();

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId === replyingTo ? null : commentId);
  };

  const handleCommentAddedAndReset = () => {
    onCommentAdded();
    setReplyingTo(null);
  };

  const handleEdit = (commentId: string) => {
    const commentToEdit = comments.find((comment) => comment.id === commentId);
    if (commentToEdit) {
      setEditingCommentId(commentId);
      setEditContent(commentToEdit.content);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) {
      toast.error("Write a message before saving.");
      return;
    }

    const postCommentId = recipeId || postId;
    if (!postCommentId) {
      toast.error("This conversation could not be updated right now.");
      return;
    }

    setSavingId(commentId);
    try {
      await axios.put(`/api/comments/${postCommentId}/${commentId}`, {
        content: newContent.trim(),
      });
      toast.success("Message updated.");
      onCommentAdded();
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("We could not update this message.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    const postCommentId = recipeId || postId;
    if (!postCommentId) {
      toast.error("This conversation could not be updated right now.");
      return;
    }

    try {
      setDeletingId(commentId);
      await axios.delete(`/api/comments/${postCommentId}/${commentId}`);
      toast.success("Message deleted.");
      onCommentAdded();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("We could not delete this message.");
    } finally {
      setDeletingId(null);
      setCommentToDelete(null);
      setIsModalOpen(false);
    }
  };

  const renderComments = (
    comments: CommentWithRelations[],
    parentCommentId?: string | null,
    depth = 0
  ) => {
    return comments
      .filter((comment) => {
        if (parentCommentId === undefined) {
          return (
            comment.parentCommentId === null ||
            comment.parentCommentId === undefined
          );
        } else {
          return comment.parentCommentId === parentCommentId;
        }
      })
      .map((comment) => (
        <div
          key={comment.id}
          className={cn(
            "relative flex w-full flex-col items-start justify-start",
            depth === 0
              ? "mb-3 rounded-2xl border border-[#ece0ce] bg-[#fffdf8] p-4 dark:border-white/8 dark:bg-[#11251f]"
              : "ml-3 mt-4 w-[calc(100%-0.75rem)] border-l border-[#dbc291] pl-4 dark:border-[#9a7d4a]/45",
            depth > 0 &&
              "before:absolute before:-left-[5px] before:top-[20px] before:size-2 before:rounded-full before:bg-[#c5974c] before:ring-4 before:ring-[#fffdf8] dark:before:bg-[#e0b76d] dark:before:ring-[#11251f]",
            depth > 1 && "ml-2 w-[calc(100%-0.5rem)] pl-3"
          )}
        >
          <div
            className={cn(
              "flex w-full flex-row items-start justify-start",
              depth > 0 &&
                "rounded-xl bg-[#fbf5eb]/75 px-3 py-3 dark:bg-white/[0.025]"
            )}
          >
            <CommunityAuthorAvatar
              image={comment.user?.image}
              name={comment.user?.name}
              className={cn("mr-3", depth === 0 ? "size-10" : "size-9")}
            />
            <div className="flex flex-col w-full">
              <div className="flex items-center mb-1 justify-between">
                <div className="flex flex-col md:flex-row items-start">
                  <span className={cn("font-semibold text-[#342920] dark:text-[#eef2ec]", depth === 0 ? "text-sm" : "text-[13px]")}>{comment.user?.name || "Home cook"}</span>
                  <div className="mt-1 flex items-center gap-1 md:ml-2 md:mt-0">
                    <Clock3 className="size-3.5" />
                    <span className="text-xs text-[#887566] dark:text-[#95a59e]">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  {(comment.userId === user?.id || user?.role === "ADMIN") &&
                    deletingId !== comment.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Comment actions"
                            className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-transparent text-[#877565] transition hover:border-[#ebdac0] hover:bg-[#f7ecda] hover:text-[#3c3028] dark:text-[#9fb0a8] dark:hover:border-white/10 dark:hover:bg-white/6 dark:hover:text-white"
                          >
                            <EllipsisVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl border-[#eadbc4] bg-[#fffaf2] p-1.5 shadow-xl dark:border-white/10 dark:bg-[#183129]"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEdit(comment.id)}
                            className="rounded-lg px-3 py-2.5 text-[#54473d] focus:bg-[#f4e7d2] dark:text-[#dde5e0] dark:focus:bg-white/8"
                          >
                            <PencilLine className="mr-1 size-4" /> Edit message
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCommentToDelete(comment.id);
                              setIsModalOpen(true);
                            }}
                            variant="destructive"
                            className="rounded-lg px-3 py-2.5"
                          >
                            <Trash2 className="mr-1 size-4" /> Delete message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  {deletingId === comment.id && (
                    <div className="ml-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <div className="mt-3 rounded-xl border border-[#ead9bd] bg-[#fcf4e7] p-3 dark:border-white/8 dark:bg-white/[0.035]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a07a43] dark:text-[#d4ad6d]">
                    Edit your message
                  </p>
                  <textarea
                    className="min-h-24 w-full resize-none rounded-xl border border-[#e3d2b7] bg-[#fffdf8] p-3 text-sm leading-6 text-[#493b31] outline-none transition focus:border-[#c18d40] focus:ring-2 focus:ring-[#c18d40]/20 disabled:opacity-60 dark:border-white/10 dark:bg-[#10211c] dark:text-[#e5ece7]"
                    value={editContent}
                    disabled={savingId === comment.id}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(comment.id, editContent)}
                      disabled={savingId === comment.id}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#17382d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#102b22] disabled:cursor-wait disabled:opacity-65 dark:bg-[#d3a04c] dark:text-[#10211c]"
                    >
                      {savingId === comment.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Update message
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={savingId === comment.id}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dfceb4] px-4 py-2 text-xs font-medium text-[#63554a] dark:border-white/12 dark:text-[#bdc8c2]"
                    >
                      <X className="size-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <LinkedText
                  text={comment.content}
                  className={cn(
                    "mt-2 w-full leading-6 text-[#64574b] dark:text-[#b2c0b9]",
                    depth === 0 ? "text-sm" : "text-[13px]"
                  )}
                />
              )}

              {comment.isPublished ? null : (
                <p className="text-sm text-gray-500 mt-2">
                  This comment is awaiting review and is only visible to you.
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-[#817061] dark:text-[#a5b4ad]">
                <LikeButton
                  commentId={comment.id}
                  postId={recipeId || postId}
                  initialLikes={comment.likes}
                />
                <Button
                  onClick={() => handleReplyClick(comment.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 cursor-pointer rounded-full px-3 text-xs"
                >
                  <MessageCircleReply className="size-4" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
          {replyingTo === comment.id && (
            <div className="flex flex-col w-full mt-4">
              <CommentsForm
                postId={postId}
                recipeId={recipeId}
                parentId={comment.id}
                title="Leave a reply"
                onCommentAdded={handleCommentAddedAndReset}
              />
            </div>
          )}
          {renderComments(comments, comment.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="flex w-full flex-col items-start justify-start rounded-[1.35rem] border border-[#eee1cf] bg-[#fcf7ed] p-4 dark:border-white/8 dark:bg-[#162e27] sm:p-5">
      <div className="mb-4 flex w-full justify-between border-b border-[#ebdfcd] pb-4 dark:border-white/8">
        <h4 className="text-base font-semibold text-[#322820] dark:text-[#eef2ed]">
          Conversation
        </h4>
        {comments.length > 0 && (
          <p className="text-right text-xs font-medium text-[#887566] dark:text-[#95a59e]">
            {comments.length} messages
          </p>
        )}
      </div>
      {comments.length === 0 && (
        <p className="w-full rounded-xl border border-dashed border-[#dfccb0] p-5 text-sm text-[#75665a] dark:border-white/10 dark:text-[#a7b5af]">
          No kitchen questions yet. Start the conversation above.
        </p>
      )}
      {renderComments(comments)}
      <CommentDeleteConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          const comment = comments.find((c) => c.id === commentToDelete);
          if (comment) {
            handleDelete(commentToDelete!);
          }
        }}
        itemLabel="comment"
        isDeleting={Boolean(deletingId)}
      />
    </div>
  );
};

export default CommentsList;
