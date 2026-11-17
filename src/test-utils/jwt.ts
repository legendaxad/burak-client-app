/// <reference types="node" />
// Test-only helper (Node's Buffer). Never import from app code.

/** Builds an UNSIGNED JWT-shaped string for tests of client-side expiry checks only. */
export function makeTestJwt(claims: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.test-signature`;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);
export const validTestToken = (extra: Record<string, unknown> = {}) =>
  makeTestJwt({ _id: 'member-1', memberNick: 'tester', exp: nowSeconds() + 3600, ...extra });
export const expiredTestToken = () => makeTestJwt({ _id: 'member-1', exp: nowSeconds() - 60 });
