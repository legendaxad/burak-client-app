import { env } from '@/config/env';

/**
 * The backend stores Multer `file.path` values such as `uploads/products/<uuid>.png`
 * and serves them statically at `/uploads`. Returns null for empty paths, so callers
 * render a placeholder instead of requesting a broken URL.
 */
export function resolveMediaUrl(path: string | null | undefined, baseUrl: string = env.apiBaseUrl): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Normalise Windows separators in case uploads were made from a Windows host.
  const normalised = trimmed.replace(/\\/g, '/').replace(/^\.?\/+/, '');
  return `${baseUrl}/${normalised}`;
}
