# Phase 0 — Investigation Report & Architecture Proposal

Companion to [BACKEND_API_MAPPING.md](./BACKEND_API_MAPPING.md), which holds the endpoint table, contracts, error catalogue and backend defects.

---

## 1. Current state of this app

| Area | Finding |
|---|---|
| Stack | Expo SDK 58, React Native 0.88, React 19.3, Expo Router (typed routes, React Compiler on), strict TS. `tsc --noEmit` and `expo lint` pass. |
| Data | **100% mock.** `src/data/*` fixtures + `src/services/mockApi.ts` (AsyncStorage). No HTTP layer and no backend calls. |
| State | One 636-line `AppContext` holds catalogue, cart, orders, profile, favorites, addresses, coupons and settings. |
| UI | A coherent design language (ink/cream/gold tokens in `src/theme/colors.ts`), but all shared components sit in one 1,049-line `src/components/app-ui.tsx`. |
| Domain model | Invented: categories (`Grill`, `Soup`…), ratings, prep time, extras, coupons, tips, payment methods, address book, statuses (`Preparing`, `Ready`…). **None of these exist in the backend.** |
| Auth | `login.tsx` is a local profile form; there is no signup, token, or session. |
| Missing deps | TanStack Query, Zustand, Axios, RHF, Zod, SecureStore, test runner. |

**Assessment:** the visual layer (tokens, screen layouts, card designs, tab bar) is worth keeping. The data, state and domain layers must be replaced, because they model a different backend. Finishing the app therefore means **re-platforming onto the real contract**, not polishing the mocks.

### What will be kept / changed / removed
| Keep (refactor) | Replace | Remove (no backend support) |
|---|---|---|
| Design tokens, the BURAK brand, hero image | `AppContext` → TanStack Query + small Zustand stores | `src/data/*` mock fixtures, `mockApi.ts` |
| Screen layouts for home, menu, product, cart, orders and profile | `types/models.ts` → contract types from the mapping | Coupons, tips, extras, special instructions |
| Tab bar, cards, stepper, badges, empty/error states (split into small files) | `login.tsx` → real login + register | Address book screen (`addresses.tsx`), payment-method choice |
| Help / About (static; restaurant info from `/member/restaurant`) | Order statuses → `PAUSE/PROCESS/FINISH/DELETED` | Ratings, prep times, ETA, Unsplash menu photos (products use backend images) |

---

## 2. Authentication decision (needs your input)

The backend only reads the JWT from the `accessToken` **cookie** (see mapping §2). Two workable options:

**Option A — no backend change (default if you do not choose)**
- Store `accessToken` from the response body in SecureStore.
- Send `Cookie: accessToken=<jwt>` manually from an Axios request interceptor.
- Risk: the native cookie jar also stores the server's `Set-Cookie` and may keep sending it after a local logout or override the manual header on iOS. Mitigation: always call `POST /member/logout` (its `Set-Cookie` clears the jar), and verify both platforms in Phase 2. If verification fails, we fall back to B.

**Option B — minimal backend adjustment (recommended)**
- In `verifyAuth` and `retrieveAuth`, accept `Authorization: Bearer <jwt>` before falling back to the cookie (about 4 lines; web/admin behaviour unchanged).
- The mobile client sends a standard Bearer header and never depends on native cookie behaviour.

In both options:
- The token lives only in **SecureStore**. AsyncStorage never holds it.
- The client decodes the JWT `exp` claim and treats the session as expired before the server's misleading 500 (defect B7).
- On logout the client calls `/member/logout` (best effort), deletes the token, and clears the Query cache and per-user stores.

---

## 3. Proposed architecture

```
src/
  app/                                  # Expo Router routes only (thin: compose feature screens)
    _layout.tsx                         # providers: QueryClient, SafeArea, Gesture, theme; session gate
    (auth)/_layout.tsx  welcome.tsx  login.tsx  register.tsx
    (tabs)/_layout.tsx  index.tsx  menu.tsx  cart.tsx  orders.tsx  profile.tsx
    products/[id].tsx
    orders/[id].tsx
    checkout.tsx  order-confirmation.tsx  profile-edit.tsx  favorites.tsx  help.tsx  about.tsx

  features/
    auth/      api/ hooks/ screens/ components/ validation/ types.ts
    products/  api/ hooks/ screens/ components/ types.ts  utils/ (image url, regex escape, date parse)
    home/      screens/ components/
    cart/      store/ (Zustand + AsyncStorage persist) utils/ (pure pricing) screens/ components/
    checkout/  hooks/ (validate cart against server, create order) validation/ screens/
    orders/    api/ hooks/ screens/ components/ utils/ (status transitions)
    profile/   api/ hooks/ screens/ components/ validation/
    favorites/ store/ (local, per member) screens/

  services/
    api/        client.ts  endpoints.ts  interceptors.ts  errors.ts (ApiError normalisation)
    storage/    secure-token.ts (SecureStore)  async-storage.ts
  store/        session.ts (Zustand: token + member snapshot + status)
  components/   common/ buttons/ inputs/ layouts/ feedback/ (skeleton, empty, error)
  theme/        tokens.ts  light.ts  dark.ts  useTheme.ts
  config/       env.ts (validated EXPO_PUBLIC_API_URL)
  types/        api.ts (shared ApiError, pagination)
```

**Rules**
- Server state (products, member, orders, restaurant) lives in TanStack Query. Client state (session, cart, favorites) lives in small Zustand stores. No global context.
- Only `features/*/api` call Axios, and only via `services/api/client.ts`.
- Pricing, cart validation and status-transition rules are pure functions in `utils/`, so they are unit-testable.
- Query keys come from one factory per feature.

**Dependencies to add** (via `npx expo install`): `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `expo-secure-store`, `expo-image-picker` (profile photo, which the backend supports). Dev: `jest-expo`, `jest`, `@testing-library/react-native`, `@types/jest`.

**Config**
- `EXPO_PUBLIC_API_URL` in `.env.local` (git-ignored) plus a committed `.env.example`. Use `10.0.2.2` for the Android emulator and the LAN IP for physical devices.
- Release builds block plain `http://` (Android cleartext, iOS ATS). Production needs an HTTPS backend URL. A dev-only cleartext exception can be added via config plugin if you want to test release builds against a LAN server.
- `app.json` `userInterfaceStyle` changes from `light` to `automatic` for the dark-mode architecture.

---

## 4. Implementation plan

| Phase | Deliverables | Tests |
|---|---|---|
| **1 Foundation** | Dependencies, env config, Axios client and interceptors, error normalisation, QueryClient, theme tokens (light/dark), shared components split out of `app-ui.tsx`, route skeleton, mock layer deleted | API client: base URL, auth header injection, error mapping |
| **2 Auth** | Welcome, login, register (RHF + Zod), SecureStore session, expiry detection, session gate, logout. Verified against the local backend on iOS and Android | Auth service, session persistence, expiry |
| **3 Products** | Home (hero, collections, Most popular, New), menu with collection filter, debounced search with regex escaping, infinite scroll, product detail, image placeholder | Product service params, regex escape, date parser |
| **4 Cart & checkout** | Persisted cart store, quantity limits by `productLeftCount`, subtotal and delivery estimate, server re-validation of each item, `POST /order/create`, confirmation | Cart maths, checkout validation, order payload |
| **5 Orders** | History tabs by status with pagination (404 → empty), order detail, status actions (cancel, confirm, received) with confirmations | Status transitions, 404 handling |
| **6 Profile** | Member detail, points, edit profile (+ photo upload), local favorites, logout | Profile form validation |
| **7 Release** | Platform QA, EAS profiles (`development`, `preview` APK, `production` AAB/iOS) | Full suite |

Each phase ends with a summary, the changed files, test results and open issues, then waits for your approval.

---

## 5. Decisions needed before Phase 1

1. **Auth:** Option A (no backend change) or Option B (add a Bearer-header fallback to the backend)?
2. **Order status actions:** offer the customer *Cancel* (`PAUSE→DELETED`), *Confirm order* (`PAUSE→PROCESS`, +1 point) and *Mark as received* (`PROCESS→FINISH`)? This mirrors the existing BURAK web flow; there is no payment step.
3. **Currency:** prices are 4,000–25,000. Display as Korean won (`₩`, no decimals)?
4. **Data fix D2:** may the 2 products stored as `"DESSERT"` be corrected to `"DESERT"` in the database? Otherwise the dessert filter misses them. I will not touch the database without approval.
5. **Removing features with no backend support** (address book, coupons, tips, extras, payment method): confirm removal.
