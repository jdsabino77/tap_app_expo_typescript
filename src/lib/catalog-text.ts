/**
 * Toggle a token in a comma-separated free-text list (catalog chip pickers).
 * Comparison is case-insensitive; preserves non-matching segments' casing.
 */
export function toggleCommaListItem(current: string, item: string): string {
  const token = item.trim();
  if (!token) {
    return current.trim();
  }
  const parts = current
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const idx = parts.findIndex((p) => p.toLowerCase() === token.toLowerCase());
  if (idx >= 0) {
    parts.splice(idx, 1);
  } else {
    parts.push(token);
  }
  return parts.join(", ");
}
