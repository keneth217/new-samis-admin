/**
 * Frontend access control:
 * - Roles: comes from `/auth/signin` response.roles
 * - Priviledges: stored per user (from `/auth/list_users` or derived fallback)
 *
 * NOTE: Backend may return roles as `["admin"]` or as `["ROLE_ADMIN"]` depending on implementation.
 * This file normalizes both styles.
 */

export const ROLE_ALIASES = {
  ADMIN: ["ROLE_ADMIN", "ADMIN", "admin"],
  MOD: ["ROLE_MOD", "MOD", "mod"],
  USER: ["ROLE_USER", "USER", "user"],
};

/** Lowercase slug without `ROLE_` prefix; legacy `moderator` is treated as `mod`. */
export function roleCanonicalSlug(role) {
  const b = String(role).trim().replace(/^ROLE_/i, "").toLowerCase();
  if (!b) return "";
  if (b === "moderator") return "mod";
  return b;
}

export const PRIVS = {
  SAVE_SCHOOL: "save school",
  EDIT_SCHOOL: "edit school",
  MANAGE_ADMINISTRATION: "manage administration",
  ACTIVATE_SCHOOL: "activate school",
  EDIT_ACTIVATION: "edit activation",
  SAVE_INVOICE: "save invoice",
  SAVE_RECEIPT: "save receipt",
  VIEW_INVOICES: "view invoices",
  VIEW_RECEIPTS: "view receipts",
  SEND_MESSAGE: "send message",
  MAKE_CALL: "make call",
  VIEW_ALL_CALL_LOGS: "view all call logs",
  LISTEN_TO_RECORDINGS: "listen to recordings",
  MANAGE_USERS: "manage users",
};

/**
 * Which roles can access each path.
 * - Empty array = any authenticated user.
 * - Add a path with [ROLES.ADMIN] for admin-only.
 */
export const ROUTE_ROLES = {
  '/': [], // Dashboard – all authenticated
  // Finance module: admin/mod only (users blocked)
  '/FinanceModule': [...ROLE_ALIASES.ADMIN, ...ROLE_ALIASES.MOD],
  '/InvoicesSchool': [],
  '/Receipts': [],
  '/Employees': [],
  '/MessagesToSchools': [],
  '/CallLog': [],
  // Contacts: admin/mod only (users blocked)
  '/Contacts': [...ROLE_ALIASES.ADMIN, ...ROLE_ALIASES.MOD],
  '/ExpensesTracking': [],
  '/ActivationStatus': [],

  // You can keep hard admin-only routes here if desired.
  // We'll primarily gate via privileges below so MOD != USER in the UI.
  '/RegisterUser': [...ROLE_ALIASES.ADMIN], // admin-only
};

/**
 * Privilege-based access by route.
 * - Any listed privilege grants access (OR logic).
 * - Admin role always bypasses this.
 */
export const ROUTE_PRIVILEDGES = {
  // User management is admin-only via ROUTE_ROLES above
  '/allSchools': [PRIVS.SAVE_SCHOOL, PRIVS.EDIT_SCHOOL],
  '/activatedSchools': [PRIVS.ACTIVATE_SCHOOL, PRIVS.EDIT_ACTIVATION],
  '/expiredSchools': [PRIVS.ACTIVATE_SCHOOL, PRIVS.EDIT_ACTIVATION],
  '/MessagesToSchools': [PRIVS.SEND_MESSAGE],
  '/CallLog': [PRIVS.VIEW_ALL_CALL_LOGS, PRIVS.LISTEN_TO_RECORDINGS, PRIVS.MAKE_CALL],
  // Allow access if user can at least view; saving is enforced by the API anyway
  '/InvoicesSchool': [PRIVS.VIEW_INVOICES],
  '/Receipts': [PRIVS.VIEW_RECEIPTS],
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
  const userSlugs = new Set(userRoles.map((r) => roleCanonicalSlug(r)).filter(Boolean));
  return allowedRoles.some((role) => {
    const a = roleCanonicalSlug(role);
    return a && userSlugs.has(a);
  });
}

export function hasRoleAlias(userRoles, aliasKey) {
  const target = { ADMIN: "admin", MOD: "mod", USER: "user" }[aliasKey];
  if (!target || !Array.isArray(userRoles)) return false;
  return userRoles.some((r) => roleCanonicalSlug(r) === target);
}

export function hasAnyPriviledge(userPriviledges, allowedPriviledges) {
  if (!allowedPriviledges || allowedPriviledges.length === 0) return true;
  if (!Array.isArray(userPriviledges)) return false;
  const norm = new Set(userPriviledges.map((p) => String(p).trim().toLowerCase()));
  return allowedPriviledges.some((p) => norm.has(String(p).trim().toLowerCase()));
}

/**
 * Check if user can access a route by path.
 * @param {string} path - Route path (e.g. '/RegisterUser')
 * @param {string[]} userRoles - From useAuthStore().roles
 * @param {string[]} userPriviledges - From useAuthStore().priviledges
 * @returns {boolean}
 */
export function canAccessRoute(path, userRoles, userPriviledges = []) {
  // Admin bypass (support both `ROLE_ADMIN` and `admin`)
  if (hasRoleAlias(userRoles, "ADMIN")) return true;

  const allowedRoles = ROUTE_ROLES[path];
  if (allowedRoles !== undefined && !hasAnyRole(userRoles, allowedRoles)) {
    return false;
  }

  const allowedPrivs = ROUTE_PRIVILEDGES[path];
  if (allowedPrivs !== undefined) {
    return hasAnyPriviledge(userPriviledges, allowedPrivs);
  }

  return true; // unknown route, allow
}
