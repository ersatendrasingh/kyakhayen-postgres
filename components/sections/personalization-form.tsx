"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import type {
  Allergies as AllergiesType,
  Cuisines as CuisinesType,
  RecipeCategories,
  RecipeDifficulty,
} from "@prisma/client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { collectPersonalizationData } from "@/hooks/use-user-personalization";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";
import MealPlanLoader from "@/components/loader/meal-plan-loader";
import Cuisines from "@/components/user-personalization/cuisines";
import Allergies from "@/components/user-personalization/allergies";
import CookingSkills from "@/components/user-personalization/cooking-skills";
import FoodPreferences from "@/components/user-personalization/food-preferences";
import { ProgressBar } from "@/components/sections/progress-bar";

interface BannerProps {
  banner: {
    id: number;
    title: string;
    spanTxt: string;
    btnTxt: string;
    image: string;
  };
  className?: string;
  cuisines: CuisinesType[];
  allergies: AllergiesType[];
  cookingSkills: RecipeDifficulty[];
  foodPreferences: RecipeCategories[];
}

const getSavedStep = (): number => {
  try {
    const savedStep =
      typeof window !== "undefined" ? localStorage.getItem("currentStep") : null;
    const step = savedStep ? JSON.parse(savedStep) : 1;
    return step >= 1 && step <= 4 ? step : 1;
  } catch {
    return 1;
  }
};

export default function PersonalizationForm({
  banner,
  className,
  cuisines,
  allergies,
  cookingSkills,
  foodPreferences,
}: BannerProps) {
  const [step, setStep] = useState(getSavedStep);
  const [direction, setDirection] = useState("next");
  const [isFormValid, setIsFormValid] = useState(false);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const cuisinesRef = useRef<HTMLDivElement>(null);
  const foodPreferenceRef = useRef<HTMLDivElement>(null);
  const allergiesRef = useRef<HTMLDivElement>(null);
  const cookingSkillsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const stepCount = 4;

  useEffect(() => {
    localStorage.setItem("currentStep", JSON.stringify(step));
  }, [step]);

  const nextStep = () => {
    if (!isFormValid) return;
    setDirection("next");
    setIsFormValid(false);
    setStep((previousStep) => previousStep + 1);
  };

  const prevStep = () => {
    setDirection("prev");
    setIsFormValid(false);
    setStep((previousStep) => previousStep - 1);
  };

  const handleDoneButtonClick = async () => {
    if (!user) {
      localStorage.setItem("needsPersonalizationUpdate", "true");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname || "")}`);
      return;
    }

    try {
      setMealPlanLoading(true);
      const response = await axios.patch(
        "/api/user/personalization",
        collectPersonalizationData()
      );
      if (response.status === 200) {
        localStorage.setItem("personalization", "true");
        localStorage.removeItem("userData");
        localStorage.removeItem("currentStep");
        if (response.data.isPersonalised) router.push("/meal-plan");
      }
    } catch (error) {
      console.error("Failed to save recipe preferences:", error);
    } finally {
      setMealPlanLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center overflow-hidden",
        className
      )}
    >
      <div className="relative w-full py-12 flex-shrink-0">
        <Image
          src={banner.image}
          alt="Personalization Banner"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {mealPlanLoading && <MealPlanLoader isLoading={mealPlanLoading} />}

        <Container>
          <div className="w-full justify-center h-[50px] items-center flex">
            <ProgressBar step={step} totalSteps={stepCount} />
          </div>
          <div className="w-full flex flex-col items-center justify-center text-center">
            <div className="w-full md:w-[700px] flex flex-col items-center justify-center relative h-[300px]">
              <span className="text-sm md:text-md font-medium p-2 rounded-full text-black">
                Choose preferences for recipes that fit your kitchen
              </span>
              <TransitionGroup className="w-full h-full relative">
                {step === 1 && (
                  <CSSTransition key="cuisines" nodeRef={cuisinesRef} timeout={500} classNames={`slide-${direction}`} unmountOnExit>
                    <div ref={cuisinesRef} className="absolute w-full h-full flex items-center justify-center">
                      <Cuisines cuisines={cuisines} title="What are your favourite cuisines?" setIsFormValid={setIsFormValid} />
                    </div>
                  </CSSTransition>
                )}
                {step === 2 && (
                  <CSSTransition key="foodPreferences" nodeRef={foodPreferenceRef} timeout={500} classNames={`slide-${direction}`} unmountOnExit>
                    <div ref={foodPreferenceRef} className="absolute w-full h-full flex items-center justify-center">
                      <FoodPreferences title="What kind of food do you prefer?" foodPreferences={foodPreferences} setIsFormValid={setIsFormValid} />
                    </div>
                  </CSSTransition>
                )}
                {step === 3 && (
                  <CSSTransition key="allergies" nodeRef={allergiesRef} timeout={500} classNames={`slide-${direction}`} unmountOnExit>
                    <div ref={allergiesRef} className="absolute w-full h-full flex items-center justify-center">
                      <Allergies title="Which ingredients should we avoid?" allergies={allergies} setIsFormValid={setIsFormValid} />
                    </div>
                  </CSSTransition>
                )}
                {step === 4 && (
                  <CSSTransition key="cookingSkills" nodeRef={cookingSkillsRef} timeout={500} classNames={`slide-${direction}`} unmountOnExit>
                    <div ref={cookingSkillsRef} className="absolute w-full h-full flex items-center justify-center">
                      <CookingSkills title="How comfortable are you with cooking?" cookingSkills={cookingSkills} setIsFormValid={setIsFormValid} />
                    </div>
                  </CSSTransition>
                )}
              </TransitionGroup>
            </div>
            <div className="w-full flex items-center justify-center mt-5 space-x-4 z-10">
              {step > 1 && (
                <Button
                  variant="outline"
                  size="main"
                  onClick={prevStep}
                  disabled={mealPlanLoading}
                >
                  Back
                </Button>
              )}
              {step === stepCount ? (
                <Button
                  variant="main"
                  size="main"
                  disabled={!isFormValid || mealPlanLoading}
                  onClick={handleDoneButtonClick}
                >
                  Done
                </Button>
              ) : (
                <Button
                  variant="main"
                  size="main"
                  disabled={!isFormValid || mealPlanLoading}
                  onClick={nextStep}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
