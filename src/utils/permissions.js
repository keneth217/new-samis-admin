/**
 * Frontend user rights – uses roles from auth store (signin API response).
 * Adjust ROUTE_ROLES to match your backend role names and who can access each route.
 */

// Role names as returned by API (e.g. from /api/auth/signin response.roles)
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  USER: 'ROLE_USER',
  MOD: 'ROLE_MOD', // if backend uses it
};

/**
 * Which roles can access each path.
 * - Empty array = any authenticated user.
 * - Add a path with [ROLES.ADMIN] for admin-only.
 */
export const ROUTE_ROLES = {
  '/': [], // Dashboard – all authenticated
  '/FinanceModule': [],
  '/InvoicesSchool': [],
  '/Receipts': [],
  '/Employees': [],
  '/MessagesToSchools': [],
  '/CallLog': [],
  '/Contacts': [],
  '/ExpensesTracking': [],
  '/ActivationStatus': [],

  // Admin-only (user management & schools)
  '/RegisterUser': [ROLES.ADMIN],
  '/allSchools': [ROLES.ADMIN],
  '/activatedSchools': [ROLES.ADMIN],
  '/expiredSchools': [ROLES.ADMIN],
};

/**
 * Check if user has at least one of the required roles.
 * @param {string[]} userRoles - From useAuthStore().roles
 * @param {string[]} allowedRoles - Required roles (any one is enough)
 * @returns {boolean}
 */
export function hasAnyRole(userRoles, allowedRoles) {
  if (!Array.isArray(userRoles)) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role));
}

/**
 * Check if user can access a route by path.
 * @param {string} path - Route path (e.g. '/RegisterUser')
 * @param {string[]} userRoles - From useAuthStore().roles
 * @returns {boolean}
 */
export function canAccessRoute(path, userRoles) {
  const allowedRoles = ROUTE_ROLES[path];
  if (allowedRoles === undefined) return true; // unknown route, allow
  return hasAnyRole(userRoles, allowedRoles);
}
