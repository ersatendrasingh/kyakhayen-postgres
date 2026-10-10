"use client";

import { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Container from "@/components/container";
import RecipeCard from "@/components/recipes/recipe-card";
import { RecipeWithCategory } from "@/types/recipe";

import { getPopularRecipes } from "@/actions/get-popular-recipes";

const PopularRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeWithCategory[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [allLoaded, setAllLoaded] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const fetchMoreRecipes = async () => {
    try {
      setLoading(true);
      const response = await getPopularRecipes({ page: currentPage + 1 });
      const newRecipes = response.recipes;

      if (!response.hasMore) {
        setAllLoaded(true);
      }

      setRecipes((prevRecipes) => [...prevRecipes, ...newRecipes]);
      setCurrentPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching more recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await getPopularRecipes({ page: 1 });
        const initialRecipes = response.recipes;

        setRecipes(initialRecipes);
        setCurrentPage(1);

        if (!response.hasMore || initialRecipes.length === 0) {
          setAllLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching initial recipes:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center pt-12 pb-10 mt-10 mb-10 bg-[#f9f9ff]">
      <Container>
        <h3 className="text-3xl font-bold text-center text-websecondary mb-10">
          Popular Recipes For You
        </h3>
        {initialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col space-y-3 p-4 border rounded-lg min-w-[300px]"
              >
                <Skeleton className="h-32 w-full rounded-xl bg-gray-200" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {recipes.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="m-4"
                >
                  <RecipeCard recipe={recipe} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <div className="flex justify-center mt-6">
          {!initialLoading && !loading && !allLoaded && (
            <Button
              onClick={fetchMoreRecipes}
              className="bg-websecondary text-white font-semibold py-2 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
              Load More Recipes
            </Button>
          )}
          {loading && <ClipLoader color="#E63946" />}
        </div>
      </Container>
    </div>
  );
};

export default PopularRecipes;
