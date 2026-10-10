"use client";

import { Badge } from "../ui/badge";

interface RecipeFeatureItemsProps {
  title: string;
  icon?: React.ReactNode;
  values?: string[]; // Updated type to string array
}

const RecipeFeatureItems = ({
  title,
  values,
  icon: Icon,
}: RecipeFeatureItemsProps) => {
  return (
    <div className="flex mx-2 my-4 pb-2 border-b-2 border-dotted border-gray-200 items-center justify-between">
      <div className="w-1/3">
        <span className="flex font-bold text-black">
          {Icon}
          {title}
        </span>
      </div>
      <div className="w-2/3 text-end">
        <span className="text-black">
          {values && values.length > 0 ? (
            values.map((value, index) => (
              <Badge
                key={index} // Using 'index' as the key since it's dynamic data
                variant="default"
                className="mx-1 bg-websecondary text-white"
              >
                {value}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-foreground italic">
              No {title.toLowerCase()}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default RecipeFeatureItems;
