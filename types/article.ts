import { ArticleTag, Category, Post, PostCategory, PostTag } from "@prisma/client";
import { CommentWithRelations } from "./comment";

export type PostWithCategory = Post & {
  PostCategory: (PostCategory & {
    category: Category;
  })[];
  PostTag: (PostTag & {
    tag: ArticleTag;
  })[];
  articleComments: CommentWithRelations[];
};
