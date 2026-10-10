"use client";

import Image from "next/image";
import { useInView } from "react-intersection-observer";
import Link from "next/link";

import { PostWithCategory } from "@/types/article";
import { articleHref } from "@/lib/seo";

interface ArticleCardProps {
  article: PostWithCategory;
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <div
      ref={ref}
      className={`max-w-sm min-h-[348px] rounded-md overflow-hidden shadow-lg transform transition-transform hover:shadow-xl hover:-translate-y-1 ${
        inView ? "animate-slide-up" : ""
      }`}
    >
      <Link href={articleHref(article)}>
        <div className="h-full flex flex-col">
          <div className="relative">
            <Image
              className="w-full"
              src={article.imageUrl || "/meta-images/recipe-page.jpg"}
              alt={article.title || "Article Image"}
              width={300}
              height={200}
            />
          </div>
          <div className="px-3 py-4">
            <div className="flex items-start mb-2"></div>
            <div className="font-bold text-xl mb-2">{article.title}</div>
            <p className="text-gray-700 text-base mb-2">
              {article.PostCategory && article.PostCategory.length > 0 && (
                <>
                  {article.PostCategory.map((category, index) => (
                    <span
                      key={category.category.id}
                      className="text-sm text-foreground"
                    >
                      {category.category.title}
                      {index < article.PostCategory!.length - 1 && ", "}
                    </span>
                  ))}
                </>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArticleCard;
