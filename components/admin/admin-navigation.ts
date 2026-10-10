import {
  BadgeCent,
  BadgeDollarSign,
  BellRing,
  CookingPot,
  Clapperboard,
  LayoutDashboard,
  MessageSquareCode,
  Newspaper,
  Images,
  ReceiptIndianRupee,
  Salad,
  Settings2,
  SmartphoneNfc,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: Array<{
    title: string;
    href: string;
  }>;
};

export type AdminNavigationGroup = {
  label: string;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Recipes",
        href: "/admin/recipes",
        icon: CookingPot,
        children: [
          { title: "All Recipes", href: "/admin/recipes" },
          { title: "Categories", href: "/admin/recipes/categories" },
          { title: "Cooking Methods", href: "/admin/recipes/cooking-methods" },
          { title: "Body Types", href: "/admin/recipes/body-types" },
          { title: "Cuisines", href: "/admin/recipes/cuisines" },
          { title: "Allergies", href: "/admin/recipes/allergies" },
          { title: "Meal Times", href: "/admin/recipes/meal-time" },
          { title: "Nutrients", href: "/admin/recipes/nutrients" },
          { title: "Diet Types", href: "/admin/recipes/diet-types" },
          { title: "Recipe Types", href: "/admin/recipes/recipe-types" },
        ],
      },
      {
        title: "Ingredients",
        href: "/admin/ingredients",
        icon: Salad,
        children: [
          { title: "Ingredients Catalog", href: "/admin/ingredients" },
          { title: "Categories", href: "/admin/ingredients/categories" },
          { title: "Measurement Units", href: "/admin/ingredients/units" },
          { title: "Preparation Forms", href: "/admin/ingredients/forms" },
        ],
      },
      {
        title: "Articles",
        href: "/admin/articles",
        icon: Newspaper,
        children: [
          { title: "All Articles", href: "/admin/articles" },
          { title: "Categories", href: "/admin/articles/categories" },
          { title: "Tags", href: "/admin/articles/tags" },
        ],
      },
      {
        title: "Media Library",
        href: "/admin/media",
        icon: Images,
      },
      {
        title: "Content Pipeline",
        href: "/admin/content-pipeline",
        icon: Clapperboard,
        children: [
          { title: "Creator Studio", href: "/admin/content-pipeline" },
          { title: "Automation", href: "/admin/content-pipeline/automation" },
        ],
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        icon: ReceiptIndianRupee,
      },
      {
        title: "Coupons",
        href: "/admin/coupons",
        icon: BadgeCent,
      },
      {
        title: "Subscription Plans",
        href: "/admin/subscription-plans",
        icon: BadgeDollarSign,
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        title: "Community",
        href: "/admin/community",
        icon: MessageSquareCode,
      },
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Contact Queries",
        href: "/admin/contact-queries",
        icon: SmartphoneNfc,
      },
      {
        title: "Notifications",
        href: "/admin/notifications",
        icon: BellRing,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Site Settings",
        href: "/admin/site-settings",
        icon: Settings2,
      },
    ],
  },
];
