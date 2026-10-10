"use client";

import { cn } from "@/lib/utils";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Mousewheel, Keyboard } from "swiper/modules";

import { RecipeCategories as FoodPreferencesType } from "@prisma/client";
import useWindowSize from "@/hooks/use-window-size";

interface FoodPreferencesProps {
  foodPreferences: FoodPreferencesType[];
  title: string;
  setIsFormValid: (isValid: boolean) => void;
}

const getSavedFoodPreference = (): string | null => {
  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      return parsedUserData.foodPreference || null;
    }
    return null;
  } catch (error) {
    console.error("Error parsing saved food preference:", error);
    return null;
  }
};
const FoodPreferences = ({
  foodPreferences,
  title,
  setIsFormValid,
}: FoodPreferencesProps) => {
  const [selectedFoodPreference, setSelectedFoodPreference] = useState<
    string | null
  >(() => getSavedFoodPreference());
  const { width } = useWindowSize();

  useEffect(() => {
    const existingUserData = JSON.parse(
      localStorage.getItem("userData") || "{}"
    );

    const updatedUserData = {
      ...existingUserData,
      foodPreference: selectedFoodPreference,
    };

    localStorage.setItem("userData", JSON.stringify(updatedUserData));
    setIsFormValid(!!selectedFoodPreference); // Update validation status
  }, [selectedFoodPreference, setIsFormValid]);

  const toggleFoodPreferenceSelection = (foodPreferenceId: string) => {
    if (selectedFoodPreference === foodPreferenceId) {
      setSelectedFoodPreference(null);
    } else {
      setSelectedFoodPreference(foodPreferenceId);
    }
  };

  const isFoodPreferenceSelected = (foodPreferenceId: string) =>
    selectedFoodPreference === foodPreferenceId;

  const isMobile = width !== undefined && width <= 767;
  return (
    <div>
      <h1 className="text-2xl xl:text-3xl mb-3 font-semibold transition-all duration-1000 ease-in-out transform animate-slide-in text-websecondary">
        {title}
      </h1>

      <div
        className={cn(
          "w-full  md:w-[700px] flex items-center justify-center",
          isMobile && "max-w-[360px]"
        )}
      >
        <Swiper
          className="w-full"
          spaceBetween={isMobile ? 0 : 20}
          slidesPerView={isMobile ? 3 : 5}
          navigation={true}
          mousewheel={true}
          keyboard={true}
          modules={[Navigation, Mousewheel, Keyboard]}
        >
          {foodPreferences.map((foodPreference) => (
            <SwiperSlide
              key={foodPreference.id}
              onClick={() => toggleFoodPreferenceSelection(foodPreference.id)}
              className={cn(
                "rounded-full p-2 text-center w-[112px] hover:text-websecondary hover:border-300 transition duration-300 text-sm font-semibold relative cursor-pointer"
              )}
            >
              <div className="relative overflow-hidden group">
                <Image
                  src={
                    foodPreference.imageUrl ||
                    "/assets/images/default-category.jpg"
                  }
                  alt={foodPreference.name || "Category Image"}
                  width={112}
                  height={112}
                  className="rounded-full"
                />
                <span
                  className={cn(
                    "absolute inset-0 bg-black opacity-40 rounded-full transition-opacity duration-300",
                    isFoodPreferenceSelected(foodPreference.id) &&
                      "bg-red-500 opacity-100 text-white"
                  )}
                ></span>
                <span className="absolute inset-0 flex items-center justify-center text-white py-2 transition-transform duration-300 transform translate-y-0 group-hover:translate-y-1">
                  {foodPreference.name}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FoodPreferences;
