/**
 * Privilege strings must match what `POST /auth/list_priviledges` returns.
 * Signup sends `priviledges` filtered to the server catalog when available.
 *
 * Current backend catalog (examples):
 * - "save school", "edit school", "manage administration", "activate school", ...
 */

// Keep these aligned to the backend list_priviledges strings.
const KNOWN_PRIVILEDGES = [
  "save school",
  "register school",
  "edit school",
  "manage administration",
  "activate school",
  "activate schools",
  "edit activation",
  "edit activate",
  "save invoice",
  "save receipt",
  "view invoices",
  "view receipts",
  "view schools",
  "send message",
  "make call",
  "view all call logs",
  "listen to recordings",
  "manage users",
];

// For admin we recommend "all catalog privileges", not a hard-coded list.
const BY_USERTYPE = {
  admin: null,
  customer_care: [
    "view invoices",
    "view receipts",
    "send message",
    "make call",
    "view all call logs",
    "activate schools",
    "register school",
    "edit activate",
  ],
  support: [
    "save school",
    "edit school",
    "activate school",
    "edit activation",
    "make call",
    "view all call logs",
    "listen to recordings",
  ],
  marketer: [
    "send message",
    "make call",
    "view all call logs",
    "view invoices",
    "view receipts",
  ],
  installer: [
    "make call",
  ],
  account: [
    "save invoice",
    "save receipt",
    "view invoices",
    "view receipts",
    "view schools",
  ],
  mod: [
    "save school",
    "edit school",
    "manage administration",
    "activate school",
    "edit activation",
    "save invoice",
    "save receipt",
    "view invoices",
    "view receipts",
    "send message",
    "make call",
    "view all call logs",
    "listen to recordings",
  ],
  users: ["view invoices", "view receipts", "view schools"],
  user: ["view invoices", "view receipts", "view schools"],
};

/**
 * @param {import('axios').AxiosInstance} api
 * @returns {Promise<string[]>}
 */
export async function fetchPrivilegeCatalog(api) {
  try {
    const { data } = await api.post("/auth/list_priviledges", {});
    if (Array.isArray(data)) return data.map(String);
    if (Array.isArray(data?.priviledges)) return data.priviledges.map(String);
    if (Array.isArray(data?.privileges)) return data.privileges.map(String);
    if (Array.isArray(data?.data)) return data.data.map(String);
    return [];
  } catch {
    return [];
  }
}

/**
 * @param {string} usertype
 * @param {string[]} serverCatalog from list_priviledges; empty = send intended set as-is
 * @returns {string[]}
 */
export function privilegesForUsertype(usertype, serverCatalog) {
  const type = String(usertype || "").trim().toLowerCase();
  const intended = Object.prototype.hasOwnProperty.call(BY_USERTYPE, type)
    ? BY_USERTYPE[type]
    : BY_USERTYPE.users;
  const catalog =
    Array.isArray(serverCatalog) && serverCatalog.length > 0
      ? new Set(serverCatalog.map(String))
      : null;
  // If backend catalog is available:
  // - admin gets the full catalog
  // - others get the intersection (to avoid sending invalid privileges)
  if (catalog) {
    if (type === "admin") return Array.from(catalog);
    const target = Array.isArray(intended) ? intended : [];
    return target.filter((p) => catalog.has(p));
  }

  // Fallback when catalog fetch failed:
  if (type === "admin") return [...KNOWN_PRIVILEDGES];
  return [...(Array.isArray(intended) ? intended : [])];
}

export { KNOWN_PRIVILEDGES, BY_USERTYPE };
