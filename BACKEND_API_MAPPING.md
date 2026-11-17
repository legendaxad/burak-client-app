# BURAK Backend — Customer API Mapping

**Source of truth:** `/Users/mac/Desktop/IT/MIT/BURAK` (branch HEAD `435764e`), read file by file, plus read-only `GET` probes against the local server (`http://localhost:3003`) on 2026-11-17.

**Scope:** every route mounted by `src/router.ts` at `/` (the "SPA" router). Routes under `/admin` (`src/router-admin.ts`, EJS + `express-session`) are admin-only and are **not** used by the customer app.

---

## 1. Endpoint table

| Feature | Method | Endpoint | Auth | Request | Response (success) |
|---|---|---|---|---|---|
| Restaurant info | GET | `/member/restaurant` | None | — | `200` single `Member` document with `memberType: "RESTAURANT"` |
| Sign up | POST | `/member/signup` | None | JSON body: `memberNick` (req), `memberPhone` (req), `memberPassword` (req), `memberAddress`, `memberDesc` (optional) | `201` `{ member: Member, accessToken: string }` + `Set-Cookie: accessToken=<jwt>; Max-Age=21600` |
| Log in | POST | `/member/login` | None | JSON body: `memberNick`, `memberPassword` | `200` `{ member: Member, accessToken: string }` + `Set-Cookie: accessToken=<jwt>` |
| Log out | POST | `/member/logout` | **Required** | — | `200` `{ logout: true }` + `Set-Cookie` clearing `accessToken` |
| My profile | GET | `/member/detail` | **Required** | — | `200` `Member` (fresh from DB, only if `memberStatus === "ACTIVE"`) |
| Update profile | POST | `/member/update` | **Required** | `multipart/form-data` (or JSON when no image): `memberNick`, `memberPhone`, `memberAddress`, `memberDesc`, file field `memberImage` | `200` updated `Member` |
| Top members (points leaderboard) | GET | `/member/top-users` | None | — | `200` `Member[]` (max 4, `ACTIVE`, `memberPoint >= 1`, sorted by points desc) |
| Product list / search / filter | GET | `/product/all` | None | Query: `page` (**req**), `limit` (**req**), `order` (**req**), `productCollection` (opt), `search` (opt) | `200` `Product[]` — plain array, **no total count** |
| Product detail (+ view count) | GET | `/product/:id` | Optional | Path: `id` (ObjectId) | `200` `Product`. If authenticated and first view by this member → `productViews` incremented and a `View` record inserted |
| Create order | POST | `/order/create` | **Required** | JSON body: **array** of `{ productId: string, itemQuantity: number, itemPrice: number }` | `201` `Order` document (no items embedded) |
| My orders (history) | GET | `/order/all` | **Required** | Query: `page` (default 1), `limit` (default 10), `orderStatus` (opt: `PAUSE` \| `PROCESS` \| `FINISH` \| `DELETED`) | `200` `OrderWithItems[]` (see §3). **`404` when the page is empty** |
| Change order status | POST | `/order/update` | **Required** | JSON body: `{ orderId: string, orderStatus: OrderStatus }` | `200` updated `Order`. Setting `PROCESS` adds **+1 `memberPoint`** |

There are no other customer-accessible endpoints.

---

## 2. Authentication — how it actually works

| Aspect | Implementation | File |
|---|---|---|
| Token type | JWT signed with `SECRET_TOKEN`, `expiresIn: "6h"` (`AUTH_TIMER = 6`) | `model/Auth.service.ts`, `libs/config.ts` |
| Token payload | The **entire member document** (minus password on login; `memberPassword: ""` on signup) | `Auth.service.createToken` |
| Issued via | Both: `Set-Cookie: accessToken` (`httpOnly: false`, 6 h) **and** the JSON body `accessToken` | `member.controller.signup/login` |
| Verified from | `Authorization: Bearer <jwt>` first, else the `accessToken` cookie (**changed 2026-11-17, Phase 2**: shared helper `libs/utils/auth-token.ts`; before that, cookie only) | `member.controller.verifyAuth/retrieveAuth` |
| Refresh tokens | None. After 6 h the user must log in again | — |
| Expired / bad token | `jwt.verify` throws a plain `Error` → `verifyAuth` answers **`500 {"code":500,"message":"Something went wrong!"}`**, not 401 | `verifyAuth` catch block |
| Missing token | `401 {"code":401,"message":"You are not authenticated!Please login first."}` (verified live) | `verifyAuth` |
| Optional auth | `retrieveAuth` (product detail) silently continues as anonymous on missing/invalid token | — |
| Logout | Server only clears the cookie. JWT is stateless and stays valid until expiry | `memberController.logout` |

### Implication for React Native

React Native has no browser cookie semantics. Android (OkHttp) and iOS (`NSURLSession`) each keep their own native cookie jar, which:
- stores the `Set-Cookie` from login automatically and keeps sending it, even after the app "logs out" locally;
- cannot be cleared from JS without a native cookie module (not in Expo Go).

Because the token is also returned in the body, the mobile client can:
1. Read `accessToken` from the login/signup response.
2. Store it in **Expo SecureStore** (Keychain / Keystore).
3. Send it on every request as a manual header `Cookie: accessToken=<jwt>`.
4. Decode `exp` locally to detect expiry, because the server answers 500 (not 401) for expired tokens.

**Decision (Phase 2): Option B was approved and implemented.** The mobile app sends `Authorization: Bearer <jwt>` and disables native cookies (`withCredentials: false`). Cookie auth for web clients is unchanged. Backend tests: `npm test` in the backend repo (17 cases covering both methods).

---

## 3. Data contracts (as returned by the API)

All ids are ObjectId strings. Timestamps are ISO strings, **except seeded products, whose `createdAt`/`updatedAt` come back as `{"$date": "<ISO>"}` objects** (verified live for all 11 products). The client must accept both.

```ts
type MemberType   = 'ADMIN' | 'USER' | 'RESTAURANT';
type MemberStatus = 'ACTIVE' | 'BLOCK' | 'DELETE';

interface Member {
  _id: string;
  memberType: MemberType;
  memberStatus: MemberStatus;
  memberNick: string;          // unique
  memberPhone: string;         // unique
  memberAddress?: string;      // schema field name (the TS type in the backend misspells it "memberAdress"; the schema wins)
  memberDesc?: string;
  memberImage?: string;        // relative path, e.g. "uploads/members/<uuid>.jpg"
  memberPoint: number;         // default 0
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

type ProductCollection = 'DISH' | 'SALAD' | 'DESERT' | 'DRINK' | 'OTHER'; // enum value is "DESERT" (sic)
type ProductSize   = 'SMALL' | 'NORMAL' | 'LARGE' | 'SET';
type ProductVolume = 0.5 | 1 | 1.2 | 1.5 | 2;           // litres, meaningful for DRINK
type ProductStatus = 'PAUSE' | 'PROCESS' | 'DELETE';    // only PROCESS is returned to customers

interface Product {
  _id: string;
  productStatus: ProductStatus;
  productCollection: ProductCollection | string;  // see data issue D2
  productName: string;
  productPrice: number;
  productLeftCount: number;
  productSize: ProductSize;
  productVolume: number;
  productDesc?: string;
  productImages: string[];     // relative paths "uploads/products/<uuid>.<ext>"; may be empty
  productViews: number;
  createdAt: string | { $date: string };
  updatedAt: string | { $date: string };
}

type OrderStatus = 'PAUSE' | 'PROCESS' | 'FINISH' | 'DELETED';

interface Order {
  _id: string;
  memberId: string;
  orderTotal: number;          // items + delivery (the backend TS type misspells it "orderToatl"; the schema field is orderTotal)
  orderDelivery: number;       // 5 if items total < 100, else 0
  orderStatus: OrderStatus;    // new orders start as PAUSE
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  _id: string;
  orderId: string;
  productId: string;
  itemQuantity: number;
  itemPrice: number;           // unit price as sent by the client at creation time
  createdAt: string;
  updatedAt: string;
}

// GET /order/all aggregation result
interface OrderWithItems extends Order {
  orderItems: OrderItem[];     // field name is "orderItems" (backend TS type says "orderItem")
  productData: Product[];      // distinct products referenced by orderItems; join on _id === productId
}

// Every handled error
interface ApiError { code: number; message: string; }
```

### Image URLs
`productImages[i]` and `memberImage` are relative file paths. Full URL = `${API_BASE_URL}/${path}` (served by `express.static` at `/uploads`). Uploads are stored on local disk by Multer with a UUID filename.

### Product list parameters
| Param | Behaviour |
|---|---|
| `page`, `limit` | Must be numbers. Missing → `NaN` in `$skip`/`$limit` → `500`. Always send both. |
| `order` | Any field name. `productPrice` sorts **ascending**; every other field sorts **descending**. Useful values: `createdAt` (newest), `productViews` (most popular), `productPrice` (cheapest). Must always be sent. |
| `productCollection` | Exact match. Not validated. |
| `search` | Case-insensitive **unescaped** regex on `productName`. Input like `(` returns `500` (verified). The client must escape regex metacharacters. |
| Pagination end | No total count. "Has more" = `result.length === limit`. |

### Order list pagination
Sorted by `updatedAt` desc. When `page` goes past the last order (or the member has no orders) the server throws `404 {"message":"No data found!"}`. For this endpoint only, the client maps `404 + "No data found!"` to "empty page". Any other error is surfaced.

---

## 4. Error catalogue

| HTTP | `message` | When |
|---|---|---|
| 400 | `You ara inserting already used nick or phone!` | Signup with duplicate nick/phone (any create failure maps here) |
| 404 | `No member with that nickname!` | Login, unknown nick |
| 403 | `You have been blocked by Restaurant , please contact with authors` | Login, `BLOCK` member |
| 401 | `Wrong password!` | Login |
| 401 | `You are not authenticated!Please login first.` | Protected route without cookie |
| 500 | `Something went wrong!` | Expired/invalid JWT on protected route; bad query params; regex errors; any unexpected failure |
| 404 | `No data found!` | Product not found / not `PROCESS`; empty order page; inactive member on `/member/detail` |
| 304 | `Update failed!` | `/member/update` or `/order/update` matched nothing (304 responses have **no body**) |
| 400 | `Create failed!` | Order creation failed |

---

## 5. Business rules the client must respect

1. **Order creation trusts client prices.** `orderTotal = Σ(itemPrice × itemQuantity) + delivery`. The server does not look up product prices, stock, or status. The client must send `itemPrice = productPrice` from a **fresh** server read, and validate stock (`productLeftCount`) and availability before checkout.
2. **Delivery fee**: `amount < 100 ? 5 : 0`. Live prices are 4,000–25,000 (KRW-like), so in practice delivery is always 0. The client may show this as an estimate only; the authoritative value is `orderDelivery` in the response.
3. **No stock decrement** on order creation.
4. **Non-atomic creation.** The order document is created first, then items one by one. A failed item insert leaves an order with missing items.
5. **Status lifecycle** (only enforced by convention; the server accepts any value from the owner):
   - `PAUSE` (new, awaiting customer confirmation) → `PROCESS` (customer confirms, **+1 point**) → `FINISH` (customer confirms receipt)
   - `PAUSE` → `DELETED` (customer cancels)
   The client will only offer these transitions.
6. **Points**: only `+1` per order moved to `PROCESS`. Read from `/member/detail`; the JWT payload copy goes stale.
7. **Signup/login identifiers**: login is by `memberNick` (not phone). Nick and phone are both unique.

---

## 6. Missing capabilities (documented, not faked)

| Wanted by the app spec | Backend support | Proposed handling |
|---|---|---|
| Favorites | **None** | Device-local list (AsyncStorage, non-sensitive), clearly labelled "Saved on this device" |
| Recently viewed | `View` records exist but **no read endpoint** | Device-local list of product ids, or omit |
| Order detail by id | **None** | Read from the `/order/all` query cache; deep-link opens the list first if not cached |
| Featured products | No "featured" flag | Use real sort orders: "Most popular" (`productViews`) and "New" (`createdAt`) |
| Product total count | None | Infinite scroll with `length === limit` heuristic |
| Delivery address on order | Order has **no address field** | Show the profile `memberAddress` at checkout; editing it goes through `/member/update`. No multi-address book |
| Payment | None | No payment UI. "Confirm order" moves `PAUSE → PROCESS` exactly as the backend allows |
| Change password | `/member/update` would store it **unhashed** (breaks login) | Not offered. Client never sends `memberPassword` to update |
| Delivery tracking / ETA | None | Status badge only |
| Coupons, tips, extras, notes | None | Removed from the app |
| Token refresh | None | Re-login after 6 h, detected client-side from JWT `exp` |

---

## 7. Backend defects found (not modified — for your backlog)

| # | Severity | Issue | Where |
|---|---|---|---|
| B1 | **High (security)** | `/member/update` passes `req.body` straight to `findByIdAndUpdate`: a customer can set their own `memberPoint`, `memberType` (`ADMIN`), or `memberStatus` | `Member.service.updateMember` |
| B2 | **High (security)** | `/member/signup` accepts `memberType`/`memberPoint` from the body | `Member.service.signup` |
| B3 | **High (integrity)** | Order totals are computed from client-supplied `itemPrice` | `Order.service.createOrder` |
| B4 | High | Customer can set any order status, including `FINISH`, and farm points by toggling `PROCESS` | `Order.service.updateOrder` |
| B5 | High (availability) | `/member/restaurant` has no try/catch: if no restaurant exists the async rejection is unhandled, and on Node ≥15 that crashes the process | `memberController.getRestaurant` |
| B6 | Medium | Unescaped user regex in product search → 500 (ReDoS risk) | `Product.service.getProducts` |
| B7 | Medium | Expired/invalid JWT returns 500 instead of 401 | `verifyAuth` |
| B8 | Medium | `/member/update` with `memberPassword` stores plaintext | `updateMember` |
| B9 | Medium (privacy) | `/member/top-users` is public and returns full member docs including `memberPhone` | `getTopUsers` |
| B10 | Low | Empty order page returns 404 instead of `[]` | `getMyOrders` |
| B11 | Low | Missing `page`/`limit`/`order` → 500 instead of defaults | `getProducts` |
| B12 | Low | `express-session` with `saveUninitialized: true` creates a Mongo session document for every API request, including mobile ones | `app.ts` |
| B13 | Low | No CORS middleware (only matters for Expo web) | `app.ts` |

### Data issues (live database)
| # | Issue | Impact |
|---|---|---|
| D1 | All 11 products have `createdAt`/`updatedAt` stored as `{ "$date": ... }` objects (an Extended-JSON import stored literally) | Client date parsing must tolerate it. `order=createdAt` sorting is unreliable |
| D2 | 2 products have `productCollection: "DESSERT"`; the enum value is `"DESERT"` | Filtering with the enum value `DESERT` does not return those 2 products. Recommend fixing the data to `"DESERT"` |
| D3 | All 11 products have `productImages: []` | Client must render a branded placeholder |
| D4 | Restaurant `memberImage` points to a file not in `uploads/members/` | Image fallback needed |
