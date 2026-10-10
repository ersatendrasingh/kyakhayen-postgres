export const socialLinks = [
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/mailtokyakhayen",
    ariaLabel: "Kya Khayen on Facebook",
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/kyakhayen/",
    ariaLabel: "Kya Khayen on Instagram",
  },
  {
    key: "x",
    label: "X",
    href: "https://x.com/kyakhayen",
    ariaLabel: "Kya Khayen on X",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    href: "https://in.pinterest.com/mailtokyakhayen/",
    ariaLabel: "Kya Khayen on Pinterest",
  },
  {
    key: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@kyakhayen",
    ariaLabel: "Kya Khayen on YouTube",
  },
] as const;

export type SocialPlatform = (typeof socialLinks)[number]["key"];

export const socialSameAs = socialLinks.map((link) => link.href);
