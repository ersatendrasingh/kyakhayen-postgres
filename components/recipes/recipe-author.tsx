"use client";

import { formatDate } from "@/lib/formatDate";
import { CalendarDays } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

interface RecipeAuthorProps {
  authorName: string;
  authorPhoto: StaticImageData;
  lastUpdateDate: Date;
}

const RecipeAuthor = ({
  authorName,
  authorPhoto,
  lastUpdateDate,
}: RecipeAuthorProps) => {
  return (
    <div className="flex items-center justify-center md:justify-start md:my-4">
      <Image
        src={authorPhoto}
        alt="Author's Profile Photo"
        className="w-6 h-6 -mt-1 rounded-full border-2 border-white mr-2"
      />
      <p className="text-md -mt-2">
        <span className="text-gray-500">By </span>
        <Link href="/" className="text-red-700">
          {authorName}
        </Link>
      </p>
      <div className="flex items-center ml-4 mb-2 md:mb-0 ">
        <CalendarDays className="w-4 h-4 mr-1" />
        <p className="text-md">
          <span className="text-gray-500">{formatDate(lastUpdateDate)}</span>
        </p>
      </div>
    </div>
  );
};

export default RecipeAuthor;
