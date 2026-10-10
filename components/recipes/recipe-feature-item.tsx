"use client";

import Image from "next/image";

interface RecipeFeatureItemProps {
  title: string;
  icon?: React.ReactNode;
  values?: string | number;
  imageUrl?: string;
  unit?: string;
}

const RecipeFeatureItem = ({
  title,
  values,
  icon: Icon,
  imageUrl,
  unit,
}: RecipeFeatureItemProps) => {
  return (
    <div className="flex mx-2 my-4 pb-2 border-b-2 border-dotted border-gray-200 items-center justify-between">
      <div className="w-1/3">
        <span className="flex font-bold text-black">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={title}
              width={25}
              height={25}
              className="mr-2"
            />
          )}
          {Icon && Icon}
          {title}
        </span>
      </div>
      <div className="w-2/3 text-end">
        <span className="text-black font-semibold text-sm">
          {values}
          <span className="text-sm ml-2">{unit}</span>
        </span>
      </div>
    </div>
  );
};

export default RecipeFeatureItem;
