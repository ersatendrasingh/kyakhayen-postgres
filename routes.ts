/**
 * An array of routes that are not accessible to the public
 * These routes will require authentication
 * @type {string[]}
 */
export const protectedRoutes = ["/success"];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/";

/**
 * The prefix for Recipe routes
 * Routes that start with this prefix are used for Recipe management purposes
 * @type {string}
 */
export const recipePrefix = "/recipes/";

/**
 * The prefix for Article routes
 * Routes that start with this prefix are used for Article management purposes
 * @type {string}
 */
export const articlePrefix = "/blog/";

/**
 * The prefix for Admin Dashboard routes
 * Routes that start with this prefix are used for Admin Dashboard purposes
 * @type {string}
 */
export const adminRoutePrefix = "/admin";

/**
 * The prefix for User Dashboard routes
 * Routes that start with this prefix are used for User Dashboard purposes
 * @type {string}
 */
export const userRoutePrefix = "/user";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/user/dashboard";

/**
 * Determines whether a given route is valid
 * @param {string} pathname - The path to check
 * @returns {boolean} True if the route is valid, false otherwise
 */
export const isValidRoute = (pathname: string) => {
  const exactRoutes = [...protectedRoutes, ...authRoutes];
  const prefixes = [
    apiAuthPrefix,
    recipePrefix,
    articlePrefix,
    adminRoutePrefix,
    userRoutePrefix,
  ];

  // Check for exact matches
  if (exactRoutes.includes(pathname)) {
    return true;
  }

  // Check if the pathname starts with any of the prefixes
  return prefixes.some((prefix) => pathname.startsWith(prefix));
};
