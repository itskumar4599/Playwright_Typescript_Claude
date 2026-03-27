/**
 * Auth Response Models — dummyjson.com
 *
 * dummyjson login returns both the token AND the full user profile
 * in one response. This is a common pattern (JWT + user info combined).
 *
 * Interview Tip: dummyjson returns TWO tokens:
 * accessToken  — short-lived, used in Authorization header
 * refreshToken — long-lived, used to get a new accessToken when it expires
 *
 * This is the OAuth2 / JWT refresh flow — very common in production APIs.
 */

// ── POST /auth/login — Success Response ─────────────────────────
export interface LoginResponse {
  accessToken: string;      // Bearer token — send in Authorization header
  refreshToken: string;     // Use to get new accessToken when it expires
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

// ── GET /auth/me — Authenticated User Profile ───────────────────
// Same shape as LoginResponse (user profile returned)
export type AuthMeResponse = Omit<LoginResponse, 'accessToken' | 'refreshToken'>;

// ── Error Response (400 / 401) ───────────────────────────────────
export interface AuthErrorResponse {
  message: string;    // e.g. "Invalid credentials"
  name?: string;      // e.g. "ValidationError"
}
