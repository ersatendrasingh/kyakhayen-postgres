"use client";

import { Preview } from "@/components/preview";
import { PostWithCategory } from "@/types/article";

interface ArticleDetailsProps {
  article: PostWithCategory;
}

const ArticleDetails = ({ article }: ArticleDetailsProps) => {
  return (
    <div className="w-full text-start items-start bg-white rounded-md shadow-sm p-4 mb-4">
      {article.content && (
        <>
          <Preview value={article.content} />
        </>
      )}
    </div>
  );
};

export default ArticleDetails;
