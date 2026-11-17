/** Error body produced by the backend `Errors` class: `res.status(code).json({ code, message })`. */
export interface ApiErrorBody {
  code: number;
  message: string;
}

/**
 * Timestamps are ISO strings, except documents imported with Extended JSON
 * (all seeded products today), which come back as `{ "$date": "<ISO>" }`.
 * See BACKEND_API_MAPPING.md, data issue D1.
 */
export type BackendDate = string | { $date: string };

export interface PageParams {
  page: number;
  limit: number;
}
