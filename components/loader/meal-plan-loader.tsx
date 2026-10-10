import { Loader } from "lucide-react";

interface MealPlanLoaderProps {
  isLoading: boolean;
}

const MealPlanLoader = ({ isLoading }: MealPlanLoaderProps) => {
  return (
    <div
      aria-busy={isLoading}
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 ${
        isLoading ? "" : "hidden"
      }`}
    >
      <div className="absolute inset-0 bg-[#160f0a]/60 backdrop-blur-md" />
      <div className="z-10 flex max-w-sm flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-[#10241e]">
        <Loader className="size-6 animate-spin text-primary" />
        <p className="mt-3 text-sm font-semibold leading-6 text-websecondary dark:text-[#dfb36c]">
          Your meal plan is being generated. Please wait...
        </p>
      </div>
    </div>
  );
};

export default MealPlanLoader;
