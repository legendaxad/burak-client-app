/**
 * The backend builds `new RegExp(search, "i")` from raw user input (defect B6), so
 * characters such as "(" produce a 500. Escaping keeps the search literal.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
