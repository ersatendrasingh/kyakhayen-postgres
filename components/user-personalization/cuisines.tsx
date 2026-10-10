"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Mousewheel, Keyboard } from "swiper/modules";

import { Cuisines as CuisinesType } from "@prisma/client";
import useWindowSize from "@/hooks/use-window-size";
import { cn } from "@/lib/utils";

interface CuisinesProps {
  cuisines: CuisinesType[];
  title: string;
  setIsFormValid: (isValid: boolean) => void;
}

const getSavedCuisines = (): string[] => {
  try {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        return parsedUserData.cuisines || [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error parsing saved cuisines:", error);
    return [];
  }
};

const Cuisines = ({ cuisines, title, setIsFormValid }: CuisinesProps) => {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(() =>
    getSavedCuisines()
  );
  const { width } = useWindowSize();

  useEffect(() => {
    const existingUserData = JSON.parse(
      localStorage.getItem("userData") || "{}"
    );
    const updatedUserData = { ...existingUserData, cuisines: selectedCuisines };
    localStorage.setItem("userData", JSON.stringify(updatedUserData));
    setIsFormValid(selectedCuisines.length > 0);
  }, [selectedCuisines, setIsFormValid]);

  const toggleCuisineSelection = useCallback(
    (cuisineId: string) => {
      if (selectedCuisines.includes(cuisineId)) {
        setSelectedCuisines(selectedCuisines.filter((id) => id !== cuisineId));
      } else {
        setSelectedCuisines([...selectedCuisines, cuisineId]);
      }
    },
    [selectedCuisines]
  );

  const isCuisineSelected = (cuisineId: string) =>
    selectedCuisines.includes(cuisineId);

  const isMobile = width !== undefined && width <= 767;

  return (
    <div>
      <h1 className="text-2xl xl:text-3xl mb-3 font-semibold transition-all duration-1000 ease-in-out transform animate-slide-in text-websecondary">
        {title}
      </h1>
      <div
        className={cn(
          "w-full md:max-w-screen-xl flex items-center justify-center",
          isMobile && "max-w-[360px]"
        )}
      >
        <Swiper
          className="w-full"
          spaceBetween={isMobile ? 0 : 20}
          slidesPerView={isMobile ? 3 : 9}
          navigation={true}
          mousewheel={true}
          keyboard={true}
          modules={[Navigation, Mousewheel, Keyboard]}
        >
          {cuisines.map((cuisine) => (
            <SwiperSlide
              key={cuisine.id}
              onClick={() => toggleCuisineSelection(cuisine.id)}
              className={cn(
                "rounded-full p-2 w-[112px] text-center hover:text-websecondary hover:border-300 transition duration-300 text-sm font-semibold relative cursor-pointer"
              )}
            >
              <div className="relative overflow-hidden group">
                <Image
                  src={
                    cuisine.imageUrl || "/assets/images/default-category.jpg"
                  }
                  alt={cuisine.title || "Category Image"}
                  width={112}
                  height={112}
                  className="rounded-full"
                  loading="lazy" // Enable lazy loading for images
                />
                <span
                  className={cn(
                    "absolute inset-0 bg-black opacity-40 rounded-full transition-opacity duration-300",
                    isCuisineSelected(cuisine.id) &&
                      "bg-red-500 opacity-100 text-white"
                  )}
                ></span>
                <span className="absolute inset-0 flex items-center justify-center text-white py-2 transition-transform duration-300 transform translate-y-0 group-hover:translate-y-1">
                  {cuisine.title}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Cuisines;
