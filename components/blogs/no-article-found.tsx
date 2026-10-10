"use client";

import Link from "next/link";
import { Button } from "../ui/button";

interface NoArticleFoundProps {
  keyparam?: string | undefined;
}

export const NoArticleFound = ({ keyparam }: NoArticleFoundProps) => {
  return (
    <div className="flex justify-center items-center h-[400px]">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">No Article Found</h2>
        <p className="text-gray-600 mb-4">
          Sorry, there are no article available for your search &quot;{keyparam}
          &quot;.
        </p>
        <Link href={`/blog`}>
          <Button variant="link">View All Articles</Button>
        </Link>
      </div>
    </div>
  );
};
