import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { Poppins } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/cart-context";
import { UserCountryProvider } from "@/context/user-country-context";
import InstallPrompt from "@/components/install-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import { buildSeoMetadata, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const meta = {
  title: "Kya Khayen | Easy Recipes, Meal Ideas and Meal Plans",
  description:
    "Discover easy recipes, healthy meal ideas, vegetarian and vegan dishes, breakfast inspiration, dinner recipes and weekly meal plans.",
  image: DEFAULT_OG_IMAGE,
};

const GTM_ID =
  process.env.NEXT_PUBLIC_GTM_ID ||
  process.env.GOOGLE_TAG_MANAGER_ID ||
  "GTM-N99FLD9B";

export const metadata: Metadata = {
  ...buildSeoMetadata({
    title: meta.title,
    description: meta.description,
    path: "/",
    image: meta.image,
    imageAlt: "Kya Khayen recipe and meal planning homepage",
    keywords: [
      "easy recipes",
      "healthy recipes",
      "meal ideas",
      "weekly meal plan",
      "meal planning",
      "vegetarian recipes",
      "vegan recipes",
      "breakfast recipes",
      "dinner ideas",
      "Kya Khayen",
    ],
  }),
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/pwa/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#10231c",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-svh" suppressHydrationWarning>
      <body
        className={`${poppins.variable} min-h-svh bg-[#fcf8f0] antialiased dark:bg-[#091712]`}
      >
        <Script id="gtm" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
            (function(w,d,s,l,i){
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
        <noscript>
          <iframe
            title="Google Tag Manager"
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConfettiProvider />
            <Toaster position="bottom-right" />
            <InstallPrompt />
            <NextTopLoader
              color="var(--primary)"
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={false}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
            />
            <UserCountryProvider>
              <CartProvider>{children}</CartProvider>
            </UserCountryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
