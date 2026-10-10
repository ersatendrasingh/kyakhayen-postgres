import Link from "next/link";
import { ArrowLeft, Image, LayoutDashboard, Video } from "lucide-react";
import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";

import { MethodTitleForm } from "./_components/method-title-form";
import { MethodDescriptionForm } from "./_components/method-description-form";
import { MethodImageForm } from "./_components/method-image-form";
import { MethodVideoForm } from "./_components/method-video-form";
import { MethodActions } from "./_components/method-actions";

const MethodIdPage = async (
  props: {
    params: Promise<{ recipeId: string; methodId: string }>;
  }
) => {
  const params = await props.params;
  const method = await db.recipeMethods.findUnique({
    where: {
      id: params.methodId,
      recipeId: params.recipeId,
    },
  });
  if (!method) {
    return redirect("/");
  }

  const requiredFields = [method.title];
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completedText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!method.isPublished && (
        <Banner
          variant="warning"
          label="This method is unpublished. It will not be visible in the recipe page."
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/admin/recipes/${method.recipeId}`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to recipe setup
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-2xl font-medium">Method Creation</h1>
                <span className="text-sm text-slate-700">
                  Complete all fields to publish a method {completedText}
                </span>
              </div>
              <MethodActions
                disabled={!isComplete}
                recipeId={params.recipeId}
                methodId={params.methodId}
                isPublished={method.isPublished}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 mt-16 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-md font-medium">Customize your method </h2>
              </div>
              <MethodTitleForm
                initialData={method}
                recipeId={method.recipeId}
                methodId={method.id}
              />
              <MethodDescriptionForm
                initialData={method}
                recipeId={method.recipeId}
                methodId={method.id}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={Image} />
              <h2 className="text-md font-medium">Add a method image</h2>
            </div>
            <MethodImageForm
              initialData={method}
              recipeId={method.recipeId}
              methodId={method.id}
            />
            <div className="flex items-center mt-8 gap-x-2">
              <IconBadge icon={Video} />
              <h2 className="text-md font-medium">Add a method video</h2>
            </div>
            <MethodVideoForm
              initialData={method}
              recipeId={method.recipeId}
              methodId={method.id}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MethodIdPage;
