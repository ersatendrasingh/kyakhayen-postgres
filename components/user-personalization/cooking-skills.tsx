"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Mousewheel, Keyboard } from "swiper/modules";

import { cn } from "@/lib/utils";
import { RecipeDifficulty } from "@prisma/client";

import useWindowSize from "@/hooks/use-window-size";

interface CookingSkillsProps {
  cookingSkills: RecipeDifficulty[];
  title: string;
  setIsFormValid: (isValid: boolean) => void;
}
const getSavedCookingSkills = (): string | null => {
  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      return parsedUserData.cookingSkill || null;
    }
    return null;
  } catch (error) {
    console.error("Error parsing saved cooking skills:", error);
    return null;
  }
};

const CookingSkills = ({
  cookingSkills,
  title,
  setIsFormValid,
}: CookingSkillsProps) => {
  const [selectedCookingSkill, setSelectedCookingSkill] = useState<
    string | null
  >(() => getSavedCookingSkills());
  const { width } = useWindowSize();
  useEffect(() => {
    const existingUserData = JSON.parse(
      localStorage.getItem("userData") || "{}"
    );

    const updatedUserData = {
      ...existingUserData,
      cookingSkill: selectedCookingSkill,
    };

    localStorage.setItem("userData", JSON.stringify(updatedUserData));
    setIsFormValid(!!selectedCookingSkill);
  }, [selectedCookingSkill, setIsFormValid]);
  const toggleCookingSkillSelection = (cookingSkillId: string) => {
    if (selectedCookingSkill === cookingSkillId) {
      setSelectedCookingSkill(null);
    } else {
      setSelectedCookingSkill(cookingSkillId);
    }
  };
  const isCookingSkillSelected = (cookingSkillId: string) =>
    selectedCookingSkill === cookingSkillId;

  const isMobile = width !== undefined && width <= 767;
  return (
    <div>
      <h1 className="text-2xl  xl:text-3xl mb-3 font-semibold transition-all duration-1000 ease-in-out transform animate-slide-in text-websecondary">
        {title}
      </h1>

      <div
        className={cn(
          "w-full  md:w-[425px] flex items-center justify-center mx-auto",
          isMobile && "w-[280px]"
        )}
      >
        <Swiper
          className="w-full "
          spaceBetween={20}
          slidesPerView={isMobile ? 2 : 3}
          navigation={true}
          mousewheel={true}
          keyboard={true}
          modules={[Navigation, Mousewheel, Keyboard]}
        >
          {cookingSkills.map((cookingSkill) => (
            <SwiperSlide
              key={cookingSkill.id}
              onClick={() => toggleCookingSkillSelection(cookingSkill.id)}
              className={cn(
                "rounded-full p-2 text-center w-[112px] hover:text-websecondary hover:border-300 transition duration-300 text-sm font-semibold relative cursor-pointer"
              )}
            >
              <div className="relative overflow-hidden group">
                <Image
                  src={
                    cookingSkill.imageUrl ||
                    "/assets/images/default-category.jpg"
                  }
                  alt={cookingSkill.title || "Cooking Skill Image"}
                  width={112}
                  height={112}
                  className="rounded-full"
                />
                <span
                  className={cn(
                    "absolute inset-0 bg-black opacity-40 rounded-full transition-opacity duration-300",
                    isCookingSkillSelected(cookingSkill.id) &&
                      "bg-red-500 opacity-100 text-white"
                  )}
                ></span>
                <span className="absolute inset-0  flex items-center justify-center text-white  py-2 transition-transform duration-300 transform translate-y-0 group-hover:translate-y-1">
                  {cookingSkill.title}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default CookingSkills;
