import { Review } from "@prisma/client";
import type { PublicCommentUser } from "@/types/comment";

export interface ReviewWithRelations extends Review {
  user?: PublicCommentUser | null;
  recipe?: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}
