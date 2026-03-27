/**
 * Request Models — TypeScript Interfaces for API Request Bodies
 *
 * API: dummyjson.com — uses camelCase field names.
 *
 * Interview Tip: Interfaces define the CONTRACT between your test
 * and the API. If the API changes a field name, TypeScript will
 * flag every place that uses the old name at compile time — not runtime.
 *
 * interface vs type:
 * - interface: preferred for object shapes, supports declaration merging
 * - type: better for unions, primitives, and computed types
 */

/**
 * POST /users/add — Create a new user
 * dummyjson accepts any fields and echoes them back with a new id
 */
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  username?: string;
}

/**
 * PUT /users/:id — Full update (send ALL fields)
 *
 * Interview Tip: PUT = full replacement.
 * Omitted fields are removed/reset on the server.
 */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
}

/**
 * PATCH /users/:id — Partial update (send ONLY changed fields)
 *
 * Every field is optional because you only send what changed.
 * `Partial<UpdateUserRequest>` is TypeScript shorthand for this.
 */
export interface PatchUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
}
