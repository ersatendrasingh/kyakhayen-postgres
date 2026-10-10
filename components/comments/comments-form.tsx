"use client";

import axios from "axios";
import { ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { commentFormSchema } from "@/schemas";

interface CommentFormProps {
  postId?: string;
  recipeId?: string;
  parentId?: string;
  title?: string;
  onCommentAdded: () => void;
}

export const CommentsForm = ({
  postId,
  recipeId,
  parentId,
  title,
  onCommentAdded,
}: CommentFormProps) => {
  const user = useCurrentUser();

  const form = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      comment: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof commentFormSchema>) => {
    try {
      if (!user) {
        return;
      }
      const data = {
        ...values,
        recipeId: recipeId || null,
        postId: postId || null,
        parentCommentId: parentId || null,
      };

      const response = await axios.post("/api/comments", data);

      if (response.status === 200) {
        form.reset();
        onCommentAdded();
        toast.success("Comment added successfully!", {
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not add your message.";
      console.error("Error:", message);
      toast.error(message, {
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex w-full flex-col items-start justify-start rounded-[1.35rem] border border-[#eee1cf] bg-[#fcf7ed] p-5 dark:border-white/8 dark:bg-[#162e27]">
      <h3 className="text-base font-semibold text-[#322820] dark:text-[#eef2ed]">
        {title ? title : "Start a conversation"}
      </h3>
      {!title && (
        <p className="mt-1 text-sm text-[#75665a] dark:text-[#a7b5af]">
          Have a cooking question or a tip worth sharing?
        </p>
      )}
      {user ? (
        <div className="mt-4 w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          disabled={isSubmitting}
                          {...field}
                          placeholder={title ? "Write your reply..." : "Ask a question or share your kitchen tip..."}
                          className={cn(
                            "h-28 w-full resize-none rounded-xl border-[#e3d2b7] bg-[#fffdf8] p-3 text-sm focus-visible:ring-[#c39043] dark:border-white/10 dark:bg-[#11251f]",
                            title && "h-20"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="h-11 cursor-pointer rounded-full bg-[#b83324] px-5 text-white hover:bg-[#9c2d21]"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : title
                    ? "Submit Reply"
                    : "Post message"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : (
        <div className="mt-5 w-full rounded-2xl border border-[#eadcc8] bg-[#fffdf8] p-4 dark:border-white/10 dark:bg-[#10241e] sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f6e8d2] text-[#b83324] dark:bg-white/8 dark:text-[#dfb36c]">
              <LogIn className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#332820] dark:text-[#eef2ed]">
                Sign in to join the conversation
              </p>
              <p className="mt-1 text-xs leading-5 text-[#75665a] dark:text-[#a7b5af]">
                Ask questions, share tips and keep your replies in one account.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
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
