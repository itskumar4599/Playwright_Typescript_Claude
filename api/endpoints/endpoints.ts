/**
 * API Endpoints — Centralized URL Constants
 *
 * API Under Test: https://dummyjson.com
 * Free, no API key required, full CRUD + Auth support.
 *
 * Interview Tip: Never hardcode endpoint strings inside tests.
 * Store all paths here as named constants.
 * If /users changes to /v2/users — fix it in ONE place.
 */

export namespace Endpoints {

  // ── User Endpoints ──────────────────────────────────────────
  export const USERS = '/users';
  export const USER_BY_ID = (id: number) => `/users/${id}`;
  export const CREATE_USER = '/users/add';          // dummyjson uses /users/add for POST

  // ── Auth Endpoints ──────────────────────────────────────────
  export const LOGIN = '/auth/login';
  export const AUTH_ME = '/auth/me';                // GET — requires Bearer token

  // ── Product Endpoints (bonus resource on dummyjson) ─────────
  export const PRODUCTS = '/products';
  export const PRODUCT_BY_ID = (id: number) => `/products/${id}`;
}

/**
 * Query Parameter Keys
 */
export const QueryParams = {
  LIMIT: 'limit',
  SKIP: 'skip',         // dummyjson uses skip/limit (not page/per_page)
  SELECT: 'select',     // select specific fields: ?select=firstName,email
  DELAY: 'delay',
} as const;
