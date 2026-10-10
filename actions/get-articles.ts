"use server";

import { db } from "@/lib/db";

import { PostWithCategory } from "@/types/article";

type GetArticles = {
  title?: string;
  searchSlug?: string;
  searchType?: string;
};

export const getArticles = async ({
  title,
  searchSlug,
  searchType,
}: GetArticles): Promise<PostWithCategory[]> => {
  try {
    return await db.post.findMany({
      where: {
        isPublished: true,
        ...(title ? { title: { contains: title } } : {}),
        ...(searchType === "category" && searchSlug
          ? {
              PostCategory: {
                some: { category: { slug: searchSlug, isPublished: true } },
              },
            }
          : {}),
        ...(searchType === "tag" && searchSlug
          ? {
              PostTag: {
                some: { tag: { slug: searchSlug, isPublished: true } },
              },
            }
          : {}),
      },
      include: {
        PostCategory: {
          include: {
            category: true,
          },
        },
        PostTag: {
          include: {
            tag: true,
          },
        },
        articleComments: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } catch (error) {
    console.error("[GET_ARTICLES]", error);
    return [];
  }
};
