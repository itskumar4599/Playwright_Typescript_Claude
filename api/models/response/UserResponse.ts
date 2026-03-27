/**
 * Response Models — dummyjson.com User Shapes
 *
 * Interview Tip: "How do you ensure type safety on API responses?"
 * 1. Define interfaces that mirror the API contract
 * 2. Cast `response.json()` to the interface
 * 3. Assert field existence and types in tests
 * 4. (Advanced) Use `zod` for runtime schema validation
 *
 * dummyjson uses camelCase throughout (unlike reqres which used snake_case).
 * This is the more modern REST convention.
 */

// ── Core User Object ────────────────────────────────────────────
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  maidenName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  username: string;
  image: string;
}

// ── GET /users — List Users Response ────────────────────────────
// dummyjson uses skip/limit pagination (offset-based)
// vs reqres which used page/per_page (page-based)
//
// Interview Tip: Two pagination styles exist in the wild:
// Page-based:   ?page=2&per_page=10  → used by GitHub, reqres
// Offset-based: ?skip=10&limit=10    → used by dummyjson, many SQL APIs
// Cursor-based: ?cursor=abc123       → used by Twitter/X, Stripe (most scalable)
export interface ListUsersResponse {
  users: User[];
  total: number;      // total users in the database
  skip: number;       // how many were skipped (offset)
  limit: number;      // max records per page
}

// ── GET /users/:id — Single User Response ───────────────────────
// dummyjson returns the user object directly (no wrapper)
export type SingleUserResponse = User;

// ── POST /users/add — Create User Response ───────────────────────
// dummyjson echoes back the sent fields + assigns id: 209
export interface CreateUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: unknown;   // allow extra fields the API might echo back
}

// ── PUT/PATCH /users/:id — Update User Response ─────────────────
// dummyjson returns the full updated user object
export type UpdateUserResponse = User;

// ── DELETE /users/:id — Delete Response ─────────────────────────
// dummyjson returns the user object with isDeleted:true
// NOTE: Status is 200, NOT 204 — important difference from reqres!
export interface DeleteUserResponse extends User {
  isDeleted: boolean;
  deletedOn: string;    // ISO timestamp of when it was deleted
}
