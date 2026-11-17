/**
 * Runtime configuration. Values come from EXPO_PUBLIC_* variables, which Expo
 * inlines at build time. They are public by design: never put secrets here.
 */

export function resolveApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set the BURAK backend URL.',
    );
  }
  if (!/^https?:\/\/[^\s/]+/i.test(trimmed)) {
    throw new Error(`EXPO_PUBLIC_API_URL must be an http(s) URL, received "${trimmed}".`);
  }
  return trimmed.replace(/\/+$/, '');
}

// Must be referenced as a static `process.env.EXPO_PUBLIC_*` expression so Expo can inline it.
export const env = {
  apiBaseUrl: resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL),
} as const;
