# BURAK Customer

The customer mobile app for the BURAK restaurant, built with Expo SDK 58, React Native and TypeScript. It talks to the existing BURAK backend (Express + MongoDB); it has no mock data.

**Status:** Phase 1 (foundation), Phase 2 (authentication) and Phase 3 (products) are complete. Cart, checkout, orders and profile editing are Phases 4–6.

## Getting started

1. Start the BURAK backend (separate repository) on port 3003.
2. Configure the API URL:
   ```bash
   cp .env.example .env.local   # then set EXPO_PUBLIC_API_URL for your target
   ```
   Use `http://localhost:3003` for the iOS simulator, `http://10.0.2.2:3003` for the Android emulator, or your computer's LAN IP for a physical device.
3. Install and run:
   ```bash
   npm install
   npx expo start
   ```
   `expo-secure-store` is included in Expo Go. A development build (`npx expo run:android` / `run:ios`) also works.

## Scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | `expo lint` |
| `npm test` | Unit tests |
| `EXPO_PUBLIC_API_URL=http://localhost:3003 npm run test:integration` | Tests against a live backend (creates a `qa_mobile_*` member) |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md): structure, auth flow, state, conventions
- [BACKEND_API_MAPPING.md](./BACKEND_API_MAPPING.md): every customer endpoint, contracts, known backend defects
- [PHASE_0_REPORT.md](./PHASE_0_REPORT.md): investigation and roadmap

## Image credits

See [assets/images/burak/CREDITS.md](./assets/images/burak/CREDITS.md). Product photos come from the backend only.
