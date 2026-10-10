import NextAuth from "next-auth";
import authConfig from "@/auth.config";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  protectedRoutes,
  recipePrefix,
  articlePrefix,
  isValidRoute,
  adminRoutePrefix,
  userRoutePrefix,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host")?.toLowerCase();
  const isLoggedIn = !!req.auth;

  if (host === "kyakhayen.com") {
    const canonicalUrl = nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.hostname = "www.kyakhayen.com";
    return Response.redirect(canonicalUrl, 308);
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isRecipeRoute = nextUrl.pathname.startsWith(recipePrefix);
  const isArticleRoute = nextUrl.pathname.startsWith(articlePrefix);
  const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = nextUrl.pathname.startsWith(adminRoutePrefix);
  const isUserRoute = nextUrl.pathname.startsWith(userRoutePrefix);

  if (!isValidRoute(nextUrl.pathname)) {
    return null;
  }

  if (isApiAuthRoute) return null;
  if (isRecipeRoute) return null;
  if (isArticleRoute) return null;
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }
  if (
    (!isLoggedIn && isProtectedRoute) ||
    (!isLoggedIn && isAdminRoute) ||
    (!isLoggedIn && isUserRoute)
  ) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  return null;
});

// Don't invoke the authentication proxy for static assets.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
