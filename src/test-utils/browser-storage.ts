/** Test-only helpers to simulate browser storage conditions for web code paths. */

export function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

type WindowStub = { localStorage?: Storage } | undefined;

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

/** Installs a `window` global; pass `undefined` to simulate SSR / no browser. */
export function setWindow(stub: WindowStub | (() => never)): void {
  if (stub === undefined) {
    // Shadow any existing window with undefined so `typeof window === 'undefined'`.
    Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true, writable: true });
    return;
  }
  if (typeof stub === 'function') {
    // A window whose localStorage getter throws (blocked storage / Safari private mode).
    Object.defineProperty(globalThis, 'window', {
      value: Object.defineProperty({}, 'localStorage', { get: stub }),
      configurable: true,
      writable: true,
    });
    return;
  }
  Object.defineProperty(globalThis, 'window', { value: stub, configurable: true, writable: true });
}

export function restoreWindow(): void {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
}
