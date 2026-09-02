/**
 * Escapes regex metacharacters so user-supplied search text can be used
 * safely inside a MongoDB `$regex` filter (prevents regex-injection/ReDoS
 * from crafted patterns like `(a+)+$`).
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
