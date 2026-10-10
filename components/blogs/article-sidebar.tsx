"use client";

import { Category } from "@prisma/client";

import ArticleSidebarWidget from "./article-sidebar-widget";

interface ArticleSidebarProps {
  categories: Category[];
}

const ArticleSidebar = ({ categories }: ArticleSidebarProps) => {
  return (
    <div className="w-full py-10 lg:py-8 mb-7 md:mb-2 xl:mb-2">
      <ArticleSidebarWidget
        title="Categories"
        widgetItems={categories}
        type="category"
      />
    </div>
  );
};

export default ArticleSidebar;
