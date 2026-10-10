// types.ts
import { Comment } from "@prisma/client";

export type PublicCommentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export interface CommentWithRelations extends Comment {
  user?: PublicCommentUser | null;
  recipe?: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  Post?: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}
