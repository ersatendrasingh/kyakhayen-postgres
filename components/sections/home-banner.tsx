"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import PersonalizationForm from "@/components/sections/personalization-form";
import HeroBannerCard from "@/components/sections/hero-banner-card";
import {
  Allergies as AllergiesType,
  Cuisines as CuisinesType,
  RecipeCategories,
  RecipeDifficulty,
} from "@prisma/client";
import { collectPersonalizationData } from "@/hooks/use-user-personalization";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import OverlayLoader from "../loader/overlay-loader";

type Banner = {
  id: number;
  title: string;
  spanTxt: string;
  btnTxt: string;
  image: string;
  href?: string;
  points?: string[];
};
interface HomeBannerProps {
  banner: Banner;
  banners: Banner[];
  featureBanners: Banner[];
  className?: string;
  cuisines: CuisinesType[];
  allergies: AllergiesType[];
  cookingSkills: RecipeDifficulty[];
  foodPreferences: RecipeCategories[];
}

const HomeBanner = ({
  banner,
  banners,
  featureBanners,
  cuisines,
  allergies,
  cookingSkills,
  foodPreferences,
}: HomeBannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [userSession, setUserSession] = useState<Session | null>(null);
  useEffect(() => {
    const getSessionData = async () => {
      const session = await getSession();
      if (session) {
        setUserSession(session);
      }
    };

    getSessionData();
  }, []);
  const user = useCurrentUser();
  useEffect(() => {
    const updatePersonalizationData = async () => {
      const personalizationData = collectPersonalizationData();
      if (personalizationData) {
        try {
          //setIsLoading(true);
          const response = await axios.patch(
            "/api/user/personalization",
            personalizationData
          );
          if (response.status === 200) {
            localStorage.setItem("personalization", "true");
            localStorage.removeItem("userData");
            localStorage.removeItem("currentStep");
            localStorage.removeItem("needsPersonalizationUpdate");
            if (response.data.isPersonalised) {
              router.push("/meal-plan");
            }
          }
        } catch (error) {
          console.error("Failed to update personalization data:", error);
        } finally {
          setIsLoading(false); // Set loading state false when API call finishes
        }
      }
    };
    if (userSession) {
      const isNeedToUpdate = localStorage.getItem("needsPersonalizationUpdate");
      if (isNeedToUpdate) {
        updatePersonalizationData();
      }
    }
  }, [userSession, router]);

  return (
    <div className="relative">
      {isLoading && <OverlayLoader isLoading={isLoading} />}
      {user && user?.isPersonalised ? (
        <HeroBannerCard
          banner={banner}
          banners={banners}
          featureBanners={featureBanners}
        />
      ) : (
        <PersonalizationForm
          banner={banner}
          cuisines={cuisines}
          allergies={allergies}
          cookingSkills={cookingSkills}
          foodPreferences={foodPreferences}
        />
      )}
    </div>
  );
};

export default HomeBanner;
