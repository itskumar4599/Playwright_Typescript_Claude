/**
 * Auth Request Models — dummyjson.com
 *
 * dummyjson uses `username` + `password` for login (not email).
 *
 * Interview Tip: This is a common API design difference.
 * Some APIs use email, others use username.
 * Keeping this in a model means you only update ONE place if it changes.
 *
 * Test credentials (built into dummyjson, always available):
 *   username: "emilys"
 *   password: "emilyspass"
 */

export interface LoginRequest {
  username: string;
  password: string;
  expiresInMins?: number;   // optional — how long the token should last
}
