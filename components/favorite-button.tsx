"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Bookmark, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  recipeId: string;
  classNames?: string;
  initialIsFavorited?: boolean;
  variant?: "icon" | "save" | "card";
  actionId?: string;
}

const FavoriteButton = ({
  recipeId,
  classNames,
  initialIsFavorited = false,
  variant = "icon",
  actionId,
}: FavoriteButtonProps) => {
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);
  const isFavorited = favoriteOverride ?? initialIsFavorited;
  const [isLoading, setIsLoading] = useState(false);

  const user = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!actionId) return;

    window.dispatchEvent(
      new CustomEvent("recipe-favorite-state", {
        detail: { isFavorited },
      }),
    );
  }, [actionId, isFavorited]);

  const handleFavorite = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.post("/api/favorites", {
        recipeId,
      });

      if (response.status === 200) {
        setFavoriteOverride(true);
        setIsLoading(false);
        toast.success("Saved to your collection", {
          duration: 5000,
        });
      } else {
        toast.error("Something went wrong", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong", {
        duration: 5000,
      });
    }
  };

  const handleUnfavorite = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.delete(`/api/favorites/${recipeId}`);

      if (response.status === 200) {
        setFavoriteOverride(false);
        setIsLoading(false);
        toast.success("Removed from your collection", {
          duration: 5000,
        });
      } else {
        toast.error("Something went wrong", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong", {
        duration: 5000,
      });
    }
  };

  return (
    <div className={classNames}>
      <button
        id={actionId}
        data-favorited={isFavorited}
        type="button"
        onClick={isFavorited ? handleUnfavorite : handleFavorite}
        title={isFavorited ? "Remove from collection" : "Save to collection"}
        className={cn(
          "cursor-pointer transition",
          variant === "save" &&
            "inline-flex h-12 items-center gap-2.5 rounded-full border border-[#ead7b9] bg-[#fff8ea] px-5 text-sm font-semibold text-[#37291f] shadow-sm hover:border-[#d9bd85] hover:bg-white dark:border-white/10 dark:bg-[#173128] dark:text-[#edf2ec]",
          variant === "card" &&
            "flex size-10 items-center justify-center rounded-full border border-white/55 bg-[#fffdf8]/94 text-[#49392d] shadow-[0_8px_20px_-12px_rgba(31,21,15,0.72)] backdrop-blur transition hover:border-[#d8b16c] hover:bg-white hover:text-[#b53325] dark:border-white/12 dark:bg-[#10251e]/94 dark:text-[#eef3ed] dark:hover:border-[#dfb267]",
        )}
      >
        {variant === "save" ? (
          <>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-[#af7736]" />
            ) : (
              <Bookmark
                className={cn(
                  "size-[18px] text-[#af7736]",
                  isFavorited && "fill-[#af7736]",
                )}
              />
            )}
            {isFavorited ? "In collection" : "Save to collection"}
          </>
        ) : variant === "card" ? (
          isLoading ? (
            <Loader2 className="size-[18px] animate-spin text-[#b48338]" />
          ) : (
            <Bookmark
              className={cn(
                "size-[18px]",
                isFavorited && "fill-[#b53325] text-[#b53325]",
              )}
            />
          )
        ) : (
          <div className="flex items-center rounded-b-3xl bg-card px-1 py-1 shadow-sm">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="size-4 animate-spin text-primary" />
              </div>
            ) : (
              <Heart
                className={cn(
                  "text-primary",
                  isFavorited ? "fill-primary" : "fill-secondary",
                )}
                size={20}
              />
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default FavoriteButton;
