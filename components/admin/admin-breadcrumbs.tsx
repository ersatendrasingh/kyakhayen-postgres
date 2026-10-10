"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  recipes: "Recipes",
  categories: "Categories",
  "cooking-methods": "Cooking Methods",
  "body-types": "Body Types",
  cuisines: "Cuisines",
  allergies: "Allergies",
  "meal-time": "Meal Times",
  nutrients: "Nutrients",
  "diet-types": "Diet Types",
  "recipe-types": "Recipe Types",
  ingredients: "Ingredients",
  forms: "Preparation Forms",
  units: "Measurement Units",
  articles: "Articles",
  tags: "Tags",
  coupons: "Coupons",
  orders: "Orders",
  "subscription-plans": "Subscription Plans",
  comments: "Comments",
  reviews: "Reviews",
  community: "Community",
  notifications: "Notifications",
  users: "Users",
  "contact-queries": "Contact Queries",
  create: "Create",
  "content-pipeline": "Content Pipeline",
  automation: "Automation",
};

function formatSegment(segment: string) {
  return labels[segment] ?? "Details";
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href =
            index === 0
              ? "/admin/dashboard"
              : `/${segments.slice(0, index + 1).join("/")}`;
          const last = index === segments.length - 1;

          return (
            <Fragment key={`${href}-${segment}`}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{formatSegment(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
