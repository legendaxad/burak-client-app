/**
 * Minimal, dependency-free JWT payload reader.
 *
 * SECURITY: this does NOT verify the signature. The decoded payload is only used
 * as a local hint (e.g. "is this token already past `exp`?") to avoid pointless
 * requests. The server remains the only authority on whether a token is valid.
 */

export interface JwtClaims {
  exp?: number;
  iat?: number;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  // Decode UTF-8 (non-ASCII nicknames) without relying on TextDecoder, which Hermes may lack.
  const percentEncoded = Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
  return decodeURIComponent(percentEncoded);
}

export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payload: unknown = JSON.parse(base64UrlDecode(parts[1]));
    if (typeof payload !== 'object' || payload === null) return null;
    const { exp, iat } = payload as Record<string, unknown>;
    return {
      exp: typeof exp === 'number' ? exp : undefined,
      iat: typeof iat === 'number' ? iat : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * True when the token is malformed, has no `exp`, or expires within `skewSeconds`.
 * The backend always sets `exp` (6 h), so a token without one is treated as unusable.
 */
export function isJwtExpired(token: string, nowMs: number = Date.now(), skewSeconds = 30): boolean {
  const claims = decodeJwtClaims(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= nowMs + skewSeconds * 1000;
}
