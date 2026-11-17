/**
 * Every customer endpoint exposed by the BURAK backend (`src/router.ts`).
 * Do not add paths that the backend does not implement. See BACKEND_API_MAPPING.md.
 */
export const endpoints = {
  member: {
    restaurant: '/member/restaurant',
    signup: '/member/signup',
    login: '/member/login',
    logout: '/member/logout',
    detail: '/member/detail',
    update: '/member/update',
    topUsers: '/member/top-users',
  },
  product: {
    all: '/product/all',
    byId: (id: string) => `/product/${encodeURIComponent(id)}`,
  },
  order: {
    create: '/order/create',
    all: '/order/all',
    update: '/order/update',
  },
} as const;
