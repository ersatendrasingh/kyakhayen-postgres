interface UserData {
  cuisines?: string;
  allergies?: string;
  cookingSkill?: string;
  foodPreference?: string;
}

export const collectPersonalizationData = () => {
  const userData = localStorage.getItem("userData");
  let parsedUserData: UserData = {};

  if (userData) {
    try {
      parsedUserData = JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  return {
    cuisines: parsedUserData.cuisines || {},
    allergies: parsedUserData.allergies || "",
    foodPreferences: parsedUserData.foodPreference || "",
    cookingSkill: parsedUserData.cookingSkill || "",
  };
};
