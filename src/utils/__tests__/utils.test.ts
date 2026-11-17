import { resolveApiBaseUrl } from '@/config/env';
import { expiredTestToken, makeTestJwt, nowSeconds, validTestToken } from '@/test-utils/jwt';

import { parseBackendDate } from '../backend-date';
import { escapeRegex } from '../escape-regex';
import { formatPrice } from '../format-price';
import { decodeJwtClaims, isJwtExpired } from '../jwt';
import { resolveMediaUrl } from '../media-url';

describe('resolveApiBaseUrl', () => {
  it('strips trailing slashes', () => {
    expect(resolveApiBaseUrl('http://10.0.2.2:3003//')).toBe('http://10.0.2.2:3003');
  });
  it('rejects a missing value with an actionable message', () => {
    expect(() => resolveApiBaseUrl(undefined)).toThrow(/EXPO_PUBLIC_API_URL is not set/);
  });
  it('rejects non-http values', () => {
    expect(() => resolveApiBaseUrl('localhost:3003')).toThrow(/http\(s\) URL/);
  });
});

describe('jwt', () => {
  it('decodes exp and iat', () => {
    expect(decodeJwtClaims(makeTestJwt({ exp: 123, iat: 100 }))).toEqual({ exp: 123, iat: 100 });
  });
  it('decodes UTF-8 payloads (non-ASCII nicknames)', () => {
    expect(decodeJwtClaims(makeTestJwt({ memberNick: 'Burak Çelik ☕', exp: 5 }))?.exp).toBe(5);
  });
  it('returns null for malformed tokens', () => {
    expect(decodeJwtClaims('not-a-jwt')).toBeNull();
    expect(decodeJwtClaims('a.%%%.c')).toBeNull();
  });
  it('treats valid, expired, near-expiry and exp-less tokens correctly', () => {
    expect(isJwtExpired(validTestToken())).toBe(false);
    expect(isJwtExpired(expiredTestToken())).toBe(true);
    expect(isJwtExpired(makeTestJwt({ exp: nowSeconds() + 10 }))).toBe(true); // inside 30 s skew
    expect(isJwtExpired(makeTestJwt({ memberNick: 'x' }))).toBe(true);
    expect(isJwtExpired('garbage')).toBe(true);
  });
});

describe('parseBackendDate', () => {
  it('parses ISO strings and Extended-JSON $date objects (D1)', () => {
    expect(parseBackendDate('2026-11-01T12:00:00.000Z')?.toISOString()).toBe('2026-11-01T12:00:00.000Z');
    expect(parseBackendDate({ $date: '2026-10-28T11:30:00.000Z' })?.toISOString()).toBe('2026-10-28T11:30:00.000Z');
  });
  it('returns null for empty or invalid input', () => {
    expect(parseBackendDate(undefined)).toBeNull();
    expect(parseBackendDate('not a date')).toBeNull();
  });
});

describe('resolveMediaUrl', () => {
  it('joins Multer paths to the API base URL', () => {
    expect(resolveMediaUrl('uploads/products/a.png', 'http://host:3003')).toBe('http://host:3003/uploads/products/a.png');
    expect(resolveMediaUrl('./uploads\\members\\b.jpg', 'http://host')).toBe('http://host/uploads/members/b.jpg');
  });
  it('keeps absolute URLs and returns null for empty paths', () => {
    expect(resolveMediaUrl('https://cdn.example/x.png', 'http://host')).toBe('https://cdn.example/x.png');
    expect(resolveMediaUrl('', 'http://host')).toBeNull();
    expect(resolveMediaUrl(undefined, 'http://host')).toBeNull();
  });
});

describe('formatPrice', () => {
  it('formats whole won with grouping', () => {
    expect(formatPrice(6500)).toBe('₩6,500');
    expect(formatPrice(25000)).toBe('₩25,000');
    expect(formatPrice(1234567.6)).toBe('₩1,234,568');
    expect(formatPrice(0)).toBe('₩0');
  });
  it('does not print NaN', () => {
    expect(formatPrice(Number.NaN)).toBe('₩–');
  });
});

describe('escapeRegex', () => {
  it('escapes metacharacters so the backend regex matches literally', () => {
    expect(escapeRegex('(')).toBe('\\(');
    expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
    expect(new RegExp(escapeRegex('[x]+(y)?'), 'i').test('[X]+(Y)?')).toBe(true);
  });
});
