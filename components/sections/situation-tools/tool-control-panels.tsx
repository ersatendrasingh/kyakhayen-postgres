import {
  budgetPresetOptions,
  foodTypeOptions,
  guestPlanOptions,
  mealFocusOptions,
} from "@/components/sections/situation-tools/constants";
import { ButtonChip, ControlBlock, IngredientPicker, NumberStepper } from "@/components/sections/situation-tools/controls";
import type { IngredientSuggestion } from "@/components/sections/situation-tools/types";

export function IngredientsToolControls({
  ingredientInput,
  setIngredientInput,
  selectedIngredients,
  ingredientLabels,
  ingredientSuggestions,
  isIngredientSuggestionLoading,
  isIngredientPickerOpen,
  setIsIngredientPickerOpen,
  addIngredientValue,
  removeIngredient,
}: {
  ingredientInput: string;
  setIngredientInput: (value: string) => void;
  selectedIngredients: string[];
  ingredientLabels: Record<string, string>;
  ingredientSuggestions: IngredientSuggestion[];
  isIngredientSuggestionLoading: boolean;
  isIngredientPickerOpen: boolean;
  setIsIngredientPickerOpen: (open: boolean) => void;
  addIngredientValue: (value: string, label?: string) => void;
  removeIngredient: (value: string) => void;
}) {
  return (
    <IngredientPicker
      title="Ingredients at home"
      input={ingredientInput}
      setInput={setIngredientInput}
      selected={selectedIngredients}
      labels={ingredientLabels}
      suggestions={ingredientSuggestions}
      isLoading={isIngredientSuggestionLoading}
      isOpen={isIngredientPickerOpen}
      setOpen={setIsIngredientPickerOpen}
      placeholder="Search paneer, rice, palak..."
      addValue={addIngredientValue}
      removeValue={removeIngredient}
    />
  );
}

export function DailyMenuControls({
  mealFocus,
  setMealFocus,
  resetPage,
}: {
  mealFocus: string;
  setMealFocus: (value: string) => void;
  resetPage: () => void;
}) {
  return (
    <ControlBlock title="Meal focus">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {mealFocusOptions.map((option) => (
          <ButtonChip
            key={option.id}
            active={mealFocus === option.id}
            onClick={() => {
              setMealFocus(option.id);
              resetPage();
            }}
          >
            {option.label}
          </ButtonChip>
        ))}
      </div>
    </ControlBlock>
  );
}

export function GuestPlannerControls({
  guestCount,
  setGuestCount,
  guestPlan,
  setGuestPlan,
  resetPage,
}: {
  guestCount: number;
  setGuestCount: (value: number) => void;
  guestPlan: string;
  setGuestPlan: (value: string) => void;
  resetPage: () => void;
}) {
  return (
    <>
      <NumberStepper
        title="Guest count"
        value={guestCount}
        setValue={(value) => {
          setGuestCount(value);
          resetPage();
        }}
        min={1}
        max={50}
        step={1}
        suffix="guests"
      />
      <ControlBlock title="Serving style">
        <div className="grid grid-cols-3 gap-2">
          {guestPlanOptions.map((option) => (
            <ButtonChip
              key={option.id}
              active={guestPlan === option.id}
              onClick={() => {
                setGuestPlan(option.id);
                resetPage();
              }}
            >
              {option.label}
            </ButtonChip>
          ))}
        </div>
      </ControlBlock>
    </>
  );
}

export function BudgetControls({
  budget,
  setBudget,
  resetPage,
}: {
  budget: number;
  setBudget: (value: number) => void;
  resetPage: () => void;
}) {
  return (
    <>
      <NumberStepper
        title="Budget mode"
        value={budget}
        setValue={(value) => {
          setBudget(value);
          resetPage();
        }}
        min={50}
        max={2000}
        step={25}
        prefix="Rs"
      />
      <ControlBlock title="Quick budgets">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {budgetPresetOptions.map((amount) => (
            <ButtonChip
              key={amount}
              active={budget === amount}
              onClick={() => {
                setBudget(amount);
                resetPage();
              }}
            >
              Rs {amount}
            </ButtonChip>
          ))}
        </div>
      </ControlBlock>
    </>
  );
}

export function MomsModeControls() {
  return (
    <ControlBlock title="Kids focus">
      <div className="rounded-lg border border-[#ead9c3] bg-[#fffaf1] px-3 py-3 text-sm font-semibold leading-6 text-[#47352a] dark:border-white/10 dark:bg-white/[0.055] dark:text-white/72">
        Simple family recipes that usually work well for kids.
      </div>
    </ControlBlock>
  );
}

export function FoodTypeControls({
  foodType,
  setFoodType,
  resetPage,
}: {
  foodType: string;
  setFoodType: (value: string) => void;
  resetPage: () => void;
}) {
  return (
    <ControlBlock title="Food type">
      <div className="grid grid-cols-3 gap-2">
        {foodTypeOptions.map((option) => (
          <ButtonChip
            key={option.id}
            active={foodType === option.id}
            onClick={() => {
              setFoodType(option.id);
              resetPage();
            }}
          >
            {option.label}
          </ButtonChip>
        ))}
      </div>
    </ControlBlock>
  );
}
