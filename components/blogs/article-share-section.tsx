"use client";

import SocialShare from "@/components/social-share";
import { PostWithCategory } from "@/types/article";
import { absoluteUrl, articleHref, seoDescription } from "@/lib/seo";

interface ArticleShareSectionProps {
  article: PostWithCategory;
}

const ArticleShareSection = ({ article }: ArticleShareSectionProps) => {
  const articleUrl = absoluteUrl(articleHref(article));
  return (
    <div className="w-full flex flex-col items-start justify-start bg-white rounded-md p-4 shadow-sm transition mb-10">
      <h3 className="text-2xl font-bold">Share this article</h3>
      <SocialShare
        url={articleUrl}
        title={article.title}
        description={seoDescription(article.metaDescription, article.content)}
        imageUrl={article.imageUrl || ""}
      />
    </div>
  );
};

export default ArticleShareSection;
