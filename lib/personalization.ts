type PersonalizationCandidate = {
  foodPreferenceId?: string | null;
  cookingSkillId?: string | null;
  userCuisines?: unknown[] | null;
};

export function isPersonalizationComplete(
  user: PersonalizationCandidate | null | undefined,
): boolean {
  return Boolean(
    user?.foodPreferenceId &&
      user.cookingSkillId &&
      Array.isArray(user.userCuisines) &&
      user.userCuisines.length > 0,
  );
}
