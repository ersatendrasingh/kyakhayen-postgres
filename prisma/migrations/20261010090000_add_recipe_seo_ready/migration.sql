ALTER TABLE "Recipes" ADD COLUMN "isSeoReady" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Recipes_isSeoReady_isPublished_idx" ON "Recipes"("isSeoReady", "isPublished");
