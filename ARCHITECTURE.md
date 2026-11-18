# BURAK Customer App — Architecture

Expo SDK 58 · React Native 0.88 · React 19 · TypeScript (strict) · Expo Router 58 (typed routes, React Compiler).

Backend contract: [BACKEND_API_MAPPING.md](./BACKEND_API_MAPPING.md). Investigation and plan: [PHASE_0_REPORT.md](./PHASE_0_REPORT.md).

---

## 1. Folder structure

```
src/
  app/                         Expo Router routes ONLY: thin files that re-export feature screens
    _layout.tsx                Providers + session gate (Stack.Protected) + root ErrorBoundary
    index.tsx                  Unguarded "/" entry: redirects to /home or /welcome by session status
    (auth)/                    Public: welcome, login, register
    (tabs)/                    Protected: home, menu, cart, orders, profile
    products/[id].tsx          Protected: product detail (+ add to cart)
    checkout.tsx               Protected: review + place order
    orders/[id].tsx            Protected: order detail + workflow actions
    profile/edit.tsx           Protected: edit profile + photo upload

  features/                    Each feature owns its API calls, hooks, screens and rules
    auth/
      services/auth-api.ts         login(), signup(), logout(), getCurrentMember()
      services/session-service.ts  restore / begin / end session, signOut, API bridge
      hooks/                       useLogin, useSignup, useLogout, useCurrentMember, useSessionBootstrap
      validation/auth-schemas.ts   Zod schemas (React Hook Form)
      screens/ components/ utils/ types.ts query-keys.ts
    products/
      services/product-api.ts      getProducts(), searchProducts(), getProductsByCollection(), getProductById()
      hooks/use-products.ts        useProductList (infinite), useProductSection, useProduct
      constants/collections.ts     Category filters, labels, sort options
      components/                  ProductCard (the only card), ProductImage, StockBadge, CollectionFilterBar
      screens/                     MenuScreen, ProductDetailScreen
      utils/ types.ts query-keys.ts
    home/                      Home screen composed from products + auth hooks (no own API)
    cart/
      utils/cart-logic.ts          Pure cart operations (merge, clamp to stock, sanitize)
      utils/cart-lines.ts          Join with LIVE product data, summary, checkout validation, order payload
      hooks/use-cart-lines.ts      useQueries over productDetailQuery per cart item
      components/                  AddToCartPanel, CartButton, CartLineRow
      screens/cart-screen.tsx
    checkout/
      hooks/use-place-order.ts     Re-fetch → validate → create order → clear ordered items (guarded)
      screens/ utils/
    orders/
      services/order-api.ts        createOrder(), getMyOrders() (404 → empty), updateOrderStatus()
      hooks/use-orders.ts          useOrderList (infinite, status filter), useOrder (cache-first scan)
      hooks/use-order-action.ts    performOrderAction(): single-flight + fresh status check
      utils/order-status.ts        Status labels + the customer workflow table
      components/ screens/ types.ts query-keys.ts
    profile/
      services/profile-api.ts      updateProfile() (JSON, or multipart with memberImage), field whitelist
      hooks/use-profile.ts         useUpdateProfile (progress, cache update), pickProfileImage()
      utils/image-validation.ts    JPEG/PNG/WEBP, ≤ 5 MB
      components/ screens/ validation/

  components/                  Feature-agnostic UI, theme-aware, no business logic
    common/   AppText, Icon, BrandMark, Skeleton, EmptyState/ErrorState/LoadingView, InlineAlert
    buttons/  Button, IconButton
    inputs/   TextField (password toggle), SearchBar/SearchEntry, Chip
    layouts/  Screen (safe area + keyboard), PageHeader, SectionHeader

  services/
    api/      client.ts (the single Axios instance), interceptors.ts, endpoints.ts, errors.ts
    query/    query-client.ts (TanStack Query defaults + retry policy)
    storage/  token-storage.ts (Expo SecureStore)
  store/auth/session-store.ts  Zustand: session status + token (client state only)
  store/cart/cart-store.ts     Zustand + AsyncStorage persist: { ownerId, items: [{productId, quantity}] }
  providers/app-providers.tsx  Gesture root, SafeArea, Theme, QueryClient, AppState→focus
  theme/       tokens.ts (palette, spacing, radius, typography, sizes), themes.ts (light/dark), makeStyles
  config/env.ts                Validated EXPO_PUBLIC_API_URL
  hooks/ utils/ types/         Generic helpers and shared backend contracts (Member, BackendDate…)
  test-utils/                  Test-only helpers
  __integration__/             Tests that run against a live backend
```

Routes live under `src/app/`, so providers live in `src/providers/` and not in `src/app/providers/` (Expo Router would treat that folder as routes).

## 2. Dependency rules

```
app/ (routes) ──▶ features/*/screens ──▶ features/*/hooks ──▶ features/*/services ──▶ services/api
                         │                        │
                         └──▶ components/ ◀───────┘          store/  ◀── features/auth/services
```

- Screens never import Axios or `services/api/client` directly. They use feature hooks.
- `services/api` does not import the session store. The auth feature registers an **AuthBridge** (`getToken`, `onSessionInvalid`) at startup, which avoids a circular dependency.
- `components/` never imports from `features/`.
- Features may use another feature's public hooks (`home` uses `products` and `auth`). They never call another feature's API service.

## 3. State

| Kind | Where | Examples |
|---|---|---|
| Server state | TanStack Query | `['member','me']`, `['products','list',filters]`, `['products','section',order,limit]`, `['products','detail',id]`, `['orders','list',status]`, `['orders','detail',id]` |
| Client state | Zustand (`store/`) | Session status and token; cart selections (persisted to AsyncStorage) |
| Credentials | Expo SecureStore | JWT (`burak.session.accessToken`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) |
| Form state | React Hook Form + Zod | Login, Register |

Product data is never copied into Zustand.

## 4. Authentication flow

1. **Startup:** `useSessionBootstrap` registers the API bridge and reads the token from SecureStore (no network). A missing, malformed or locally expired token → `anonymous`. Otherwise → `authenticated`. The splash screen stays up until this finishes, so the wrong stack never flashes.
2. **Routing:** `Stack.Protected guard={authenticated}` wraps `(tabs)` and `products/[id]`. `guard={!authenticated}` wraps `(auth)`. Flipping the session status is the only navigation needed after login or logout, so there are no manual redirects and no redirect loops.
3. **Requests:** the interceptor adds `Authorization: Bearer <jwt>`, except on `/member/login` and `/member/signup`. `withCredentials: false` keeps the native cookie jar out of the picture.
4. **Server validation:** `useCurrentMember` (`GET /member/detail`) runs once after restore. A 404 there means the account is no longer ACTIVE, so the session ends with reason `inactive`.
5. **Expiry (no refresh endpoint exists):**
   - The JWT `exp` claim is checked locally before every request and whenever the app returns to the foreground. An expired token is not sent, and the session ends with `expired`.
   - A **401** on a request that carried the token ends the session (`unauthorized`).
   - A **500** never ends the session. The backend returns 500 for *any* rejected token and for unrelated failures, so it is ambiguous. The local `exp` check covers expiry.
   - The decoded payload is used only as a timing hint. It is never trusted as proof of identity.
6. **Logout:** `signOut()` is deduplicated. It calls `POST /member/logout` (best effort), then `endSession`: the state flips first so guards unmount protected screens, then the Query cache is cleared and the token is deleted.

## 5. Products

- `GET /product/all` always receives `page`, `limit` and `order` (missing values crash the backend). The search term is regex-escaped (defect B6).
- Infinite scroll uses `hasMore = page.length === limit`, because the API returns no total count.
- **DESERT vs DESSERT (D2):** the Desserts filter queries both stored values for the same page and merges the results without duplicates. Every product appears exactly once; only the order at page boundaries can differ slightly from a single backend sort. Unknown category values are labelled with their raw name instead of being hidden. Delete the alias in `constants/collections.ts` once the data is fixed.
- **Images:** `resolveMediaUrl` joins Multer paths (`uploads/products/…`) to the API base URL. Missing paths and load errors render a neutral "No photo yet" placeholder. No photos are bundled or invented.
- **Detail:** shows cached list data instantly (`placeholderData`), then fetches `GET /product/:id`, which records the member's first view server-side.
- **Home sections** use real sort orders only: "Most popular" (`productViews`) and "New on the menu" (`createdAt`). There are no fake banners, offers or featured flags.

## 6. Cart, checkout, orders, profile (Phases 4–6)

The backend is used **as-is (read-only)**. Where it trusts the client, the app adds its own safeguards; these are client-side only and are listed as backend limitations in BACKEND_API_MAPPING.md §8.

**Cart**
- Stores only `productId` and `quantity`. Prices, availability and stock always come from `GET /product/:id` (`productDetailQuery`, shared with the product screens).
- Quantities are clamped to `[1, min(productLeftCount, 99)]`, and there's one line per product. Persisted data is sanitized on rehydrate.
- `ownerId` binds the saved cart to a member. Logout empties it; signing in as a different member starts empty; an expired session keeps it for the same member.

**Checkout** (`usePlaceOrder`)
1. Re-fetches every product (`staleTime: 0`).
2. Blocks on unavailable products, insufficient stock, or a price that changed since the customer reviewed it.
3. Sends `[{ productId, itemQuantity, itemPrice }]` priced from that fresh data, because the backend trusts `itemPrice`.
4. Removes the ordered items only after the server confirms.

Repeated taps are ignored. A network failure during create shows "status unknown, check My orders" instead of retrying blindly, since the outcome can't be known. The delivery fee is shown as an estimate (it mirrors the backend rule); the confirmed total is the server's `orderTotal`.

**Orders**
- History uses `GET /order/all`, with an optional status filter and infinite scroll. The backend's 404 for an empty page becomes an empty list.
- There's no single-order endpoint: detail shows cached data, then confirms by paging `/order/all`.
- Customer actions follow the existing BURAK workflow: Confirm (PAUSE→PROCESS, the backend adds +1 point), Cancel (PAUSE→DELETED), Received (PROCESS→FINISH).
- `/order/update` accepts any status and adds a point on *every* PROCESS. So `performOrderAction` allows one request per order at a time, and re-reads the status from the server before sending.

**Profile**
- Fields come from `GET /member/detail`.
- Edits go to `POST /member/update`: JSON for text, multipart (`memberImage`) when a photo is included, with upload progress.
- The service only ever sends `memberNick`, `memberPhone`, `memberAddress` and `memberDesc` (plus the file). The backend would otherwise accept `memberType`, `memberStatus` or `memberPoint`.
- Images must be JPEG, PNG or WEBP and at most 5 MB, checked client-side because Multer has no filter.

## 7. Theming and platform

- `ThemeProvider` follows the OS scheme (`app.json` → `userInterfaceStyle: automatic`). Components get styles from `makeStyles((theme) => …)` and never hard-code colors. The light theme keeps the BURAK ink / cream / gold identity; the dark theme mirrors it.
- `Screen` applies safe-area edges, an optional `KeyboardAvoidingView` (`padding` on iOS, `height` on Android) and a 760 pt max content width for tablets.
- Touch targets are ≥ 44 pt. Icons use SF Symbols on iOS and Material Symbols on Android. Skeletons respect "reduce motion".
- Release builds block plain `http://` on both platforms, so production needs an HTTPS `EXPO_PUBLIC_API_URL`.

## 8. Configuration

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL. Validated at startup. Set in `.env.local` (git-ignored); see `.env.example` |

Price display is configured in one place (`utils/format-price.ts`, KRW `₩`, pending product-owner confirmation).

## 9. Testing

| Command | Scope |
|---|---|
| `npm test` | Unit tests (Jest + jest-expo + Testing Library): utils, API client and interceptors, retry policy, session service (persistence, restart, expiry, dedupe), auth API and validation, product service, image fallback |
| `EXPO_PUBLIC_API_URL=http://localhost:3003 npm run test:integration` | Runs the app's real services against a live backend: auth, products, checkout/order creation, order history and workflow (points, duplicates, member isolation), profile edit and photo upload, cache isolation. Creates `qa_*` test members (and their orders) per run |
| `npm run typecheck`, `npm run lint` | `tsc --noEmit`, `expo lint` |

## 10. Adding a feature

1. Add the endpoint to `services/api/endpoints.ts`, but only if the backend implements it.
2. Create `features/<name>/{types.ts, services/, query-keys.ts, hooks/, components/, screens/}`.
3. Add a thin route file under `src/app/`, inside the right `Stack.Protected` group.
4. Put pure business rules (pricing, status transitions) in `utils/` with unit tests.
