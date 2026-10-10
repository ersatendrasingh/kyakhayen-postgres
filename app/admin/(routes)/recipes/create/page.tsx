import { redirect } from "next/navigation";

const RecipeCreateRedirectPage = () => {
  redirect("/admin/recipes");
};

export default RecipeCreateRedirectPage;
