"use client";

import { Check, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Preview } from "@/components/preview";
import { cn } from "@/lib/utils";
import type { RecipeMethods as RecipeMethodType } from "@prisma/client";

interface RecipeMethodsProps {
  recipeMethods: RecipeMethodType[];
}

const RecipeMethods = ({ recipeMethods }: RecipeMethodsProps) => {
  const [checkedMethods, setCheckedMethods] = useState<string[]>([]);

  const toggleMethod = (methodId: string) => {
    setCheckedMethods((current) =>
      current.includes(methodId)
        ? current.filter((id) => id !== methodId)
        : [...current, methodId],
    );
  };

  if (recipeMethods.length === 0) {
    return (
      <p className="rounded-2xl bg-[#fbf5ea] p-6 text-center text-sm text-[#75685c] dark:bg-[#162e27] dark:text-[#b1bdb7]">
        Cooking instructions will be added shortly.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {recipeMethods.map((method, index) => {
        const done = checkedMethods.includes(method.id);
        return (
          <li
            id={`recipe-step-${method.id}`}
            key={method.id}
            className={cn(
              "relative flex gap-4 rounded-[1.4rem] border p-4 transition sm:p-5",
              done
                ? "border-[#c9dbc5] bg-[#eff5ea] dark:border-[#34594b] dark:bg-[#153229]"
                : "border-[#eee2d1] bg-[#fffdf9] dark:border-white/8 dark:bg-[#132a23]",
            )}
          >
            <button
              type="button"
              aria-label={done ? "Mark step incomplete" : "Mark step complete"}
              onClick={() => toggleMethod(method.id)}
              className={cn(
                "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition",
                done
                  ? "bg-[#388552] text-white"
                  : "bg-[#f3e4cc] text-[#90632d] dark:bg-[#1b3b31] dark:text-[#dfb76c]",
              )}
            >
              {done ? <Check className="size-5" /> : index + 1}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3
                  className={cn(
                    "text-base font-semibold text-[#30261e] sm:text-lg dark:text-[#eef2ec]",
                    done && "line-through opacity-65",
                  )}
                >
                  {method.title}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleMethod(method.id)}
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#877362] transition hover:text-[#388552] dark:text-[#9fb0a8]"
                >
                  <CheckCircle2 className="size-4" />
                  {done ? "Completed" : "Mark done"}
                </button>
              </div>
              {method.description && (
                <Preview
                  value={method.description}
                  className={cn(
                    "recipe-rich-content mt-3 text-sm leading-7 text-[#63564b] dark:text-[#b2c0b9]",
                    done && "line-through opacity-60",
                  )}
                />
              )}
              {(method.imageUrl || method.videoUrl) && (
                <div
                  className={cn(
                    "mt-4 grid gap-3",
                    method.imageUrl && method.videoUrl && "sm:grid-cols-2",
                  )}
                >
                  {method.imageUrl && (
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-[#eadbc7] dark:border-white/10">
                      <Image
                        src={method.imageUrl}
                        alt={method.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  {method.videoUrl && (
                    <video
                      className="aspect-video w-full rounded-xl border border-[#eadbc7] bg-[#17130f] object-cover dark:border-white/10"
                      controls
                      playsInline
                      preload="metadata"
                    >
                      <source src={method.videoUrl} />
                    </video>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default RecipeMethods;
