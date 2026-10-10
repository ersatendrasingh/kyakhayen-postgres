"use client";

import { cn } from "@/lib/utils";

import guestAuthor from "@/public/assets/images/guest-user.webp";

import Image from "next/image";

import ArticleBreadcum from "@/components/blogs/article-breadcum";
import ArticleAuthor from "@/components/blogs/article-author";
import { PostWithCategory } from "@/types/article";
import SocialShare from "../social-share";
import { absoluteUrl, articleHref } from "@/lib/seo";

interface ArticleBannerCardProps {
  article: PostWithCategory;
  className?: string;
}
const ArticleBannerCard = ({ article, className }: ArticleBannerCardProps) => {
  const articleUrl = absoluteUrl(articleHref(article));
  return (
    <div className={cn("w-full flex items-center", className)}>
      <div className="flex justify-between items-start flex-col lg:flex-row rounded-md">
        <div className="w-full text-start items-start bg-white rounded-md shadow-sm p-4">
          <div className="relative w-full h-full">
            <Image
              src={article.imageUrl || "/placeholder.jpg"}
              alt={article.title || "Course Image"}
              width={950}
              height={600}
              className="rounded-md"
            />
          </div>
          <ArticleBreadcum currentArticle={article.title} />
          <h2 className="text-2xl lg:text-4xl font-bold mb-4 text-center lg:text-left">
            {article.title}
          </h2>
          <ArticleAuthor
            authorName="Kyakhayen?"
            authorPhoto={guestAuthor}
            lastUpdateDate={article.updatedAt}
          />

          {/* <RecipeRatingDetails
            rating={4.8}
            reviews={1560}
            totalViewsCount={2365}
          /> */}
          <div className="mt-4 flex flex-col items-center lg:items-start">
            <h3 className="text-xl font-bold">Share this article</h3>
            <SocialShare
              url={articleUrl}
              title={article.title}
              description={article.content!}
              imageUrl={article.imageUrl!}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleBannerCard;
