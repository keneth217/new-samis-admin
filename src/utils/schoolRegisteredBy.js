/**
 * Normalize registrant fields from school/activation API rows (camelCase, snake_case, legacy).
 */
export function normalizeRegisteredById(row) {
  if (!row || typeof row !== 'object') return null;
  const v =
    row.registeredByID ??
    row.registeredById ??
    row.registered_by_id ??
    row.registrantId ??
    row.registrantID;
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isNaN(n) && String(n) === s) return n;
  return v;
}

export function normalizeRegisteredByName(row) {
  if (!row || typeof row !== 'object') return null;
  const n =
    row.registeredByName ??
    row.registered_by_name ??
    row.registrantName;
  if (n === null || n === undefined) return null;
  const t = String(n).trim();
  return t === '' ? null : t;
}

export function normalizeHandledById(row) {
  if (!row || typeof row !== 'object') return null;
  const v =
    row.handledByID ??
    row.handledById ??
    row.handled_by_id ??
    row.lastHandledByID ??
    row.lastHandledById ??
    row.updatedByID ??
    row.updatedById ??
    row.updated_by_id;
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isNaN(n) && String(n) === s) return n;
  return v;
}

export function normalizeHandledByName(row) {
  if (!row || typeof row !== 'object') return null;
  const n =
    row.handledByName ??
    row.handled_by_name ??
    row.lastHandledByName ??
    row.updatedByName ??
    row.updated_by_name;
  if (n === null || n === undefined) return null;
  const t = String(n).trim();
  return t === '' ? null : t;
}
