import { expect } from '@playwright/test';
import { ApiResponse } from '../api/clients/BaseApiClient';

/**
 * API Test Helpers — Reusable Assertion & Utility Functions
 *
 * CONCEPT: Keep assertions DRY (Don't Repeat Yourself).
 * These helpers wrap common assertion patterns so tests stay readable.
 *
 * Interview Tip: "How do you do schema validation in API testing?"
 * ─────────────────────────────────────────────────────────────────
 * Level 1 (Basic):    Check status code — expect(res.status).toBe(200)
 * Level 2 (Moderate): Check field existence — expect(res.body.id).toBeDefined()
 * Level 3 (Advanced): Check data types — expect(typeof res.body.id).toBe('number')
 * Level 4 (Expert):   Use JSON Schema / zod for full contract validation
 *
 * For interviews: mention you've used all levels depending on coverage needs.
 */

// ── Status Code Assertions ──────────────────────────────────────

/**
 * Assert HTTP 200 OK — Resource retrieved successfully
 */
export function assertOk<T>(response: ApiResponse<T>): void {
  expect(response.status, `Expected 200 OK but got ${response.status}`).toBe(200);
  expect(response.ok).toBe(true);
}

/**
 * Assert HTTP 201 Created — Resource created successfully
 * Interview Tip: POST should return 201, not 200.
 * A 200 on a create is technically wrong (though common in bad APIs).
 */
export function assertCreated<T>(response: ApiResponse<T>): void {
  expect(response.status, `Expected 201 Created but got ${response.status}`).toBe(201);
}

/**
 * Assert HTTP 204 No Content — Operation succeeded, no body returned
 * Used for DELETE and some PUT/PATCH operations.
 */
export function assertNoContent<T>(response: ApiResponse<T>): void {
  expect(response.status, `Expected 204 No Content but got ${response.status}`).toBe(204);
}

/**
 * Assert HTTP 400 Bad Request — Client sent invalid data
 */
export function assertBadRequest<T>(response: ApiResponse<T>): void {
  expect(response.status, `Expected 400 Bad Request but got ${response.status}`).toBe(400);
}

/**
 * Assert HTTP 401 Unauthorized — Missing or invalid credentials
 *
 * Interview Tip: 401 vs 403?
 * 401 = "Who are you?" — not authenticated (no/bad token)
 * 403 = "I know who you are, but you can't do this" — not authorized
 */
export function assertUnauthorized<T>(response: ApiResponse<T>): void {
  expect(response.status, `Expected 401 Unauthorized but got ${response.status}`).toBe(401);
}

/**
 * Assert HTTP 404 Not Found — Resource doesn't exist
 */
export function assertNotFound<T>(response: ApiResponse<T>): void {
  expect(response.status, `Expected 404 Not Found but got ${response.status}`).toBe(404);
}

/**
 * Assert any specific status code
 */
export function assertStatus<T>(response: ApiResponse<T>, expectedStatus: number): void {
  expect(
    response.status,
    `Expected ${expectedStatus} but got ${response.status}`
  ).toBe(expectedStatus);
}

// ── Response Body Assertions ────────────────────────────────────

/**
 * Assert that a field exists and is not null/undefined
 */
export function assertFieldExists(body: Record<string, unknown>, field: string): void {
  expect(body[field], `Field '${field}' should exist but was ${body[field]}`).toBeDefined();
}

/**
 * Assert a field is a specific type
 * Covers the "schema validation" question in interviews.
 */
export function assertFieldType(
  body: Record<string, unknown>,
  field: string,
  expectedType: 'string' | 'number' | 'boolean' | 'object'
): void {
  expect(
    typeof body[field],
    `Field '${field}' should be type '${expectedType}' but was '${typeof body[field]}'`
  ).toBe(expectedType);
}

/**
 * Assert response contains a valid ISO 8601 timestamp
 * e.g. "2024-01-15T10:30:00.000Z"
 *
 * Interview Tip: Always verify timestamp fields are valid ISO strings —
 * many bugs hide in timestamp formatting.
 */
export function assertTimestamp(value: string, fieldName: string): void {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  expect(
    isoRegex.test(value),
    `Field '${fieldName}' should be a valid ISO timestamp but got: ${value}`
  ).toBe(true);
}

/**
 * Assert pagination metadata is correct
 * Interview Tip: Pagination bugs are extremely common in APIs.
 * Always verify page, per_page, total, and total_pages are consistent.
 */
export function assertPagination(
  body: { page: number; per_page: number; total: number; total_pages: number; data: unknown[] },
  expectedPage: number,
  expectedPerPage: number
): void {
  expect(body.page).toBe(expectedPage);
  expect(body.per_page).toBe(expectedPerPage);
  expect(body.total).toBeGreaterThan(0);
  expect(body.total_pages).toBeGreaterThanOrEqual(1);
  expect(body.data.length).toBeLessThanOrEqual(expectedPerPage);
}

/**
 * Assert the response headers contain a specific content-type
 * Interview Tip: Always check Content-Type header on API responses.
 * If you expect JSON but get HTML (e.g. 500 error page), your test
 * should fail with a clear message rather than a cryptic parse error.
 */
export function assertContentType(response: ApiResponse<unknown>, expectedType: string = 'application/json'): void {
  const contentType = response.headers['content-type'] ?? '';
  expect(
    contentType,
    `Expected Content-Type to include '${expectedType}'`
  ).toContain(expectedType);
}

/**
 * Assert response time is within acceptable limits
 * This wraps timing for performance assertions.
 *
 * Interview Tip: Non-functional testing — performance thresholds
 * can be added to API tests to catch regressions early.
 */
export function assertResponseTimeWithin(startTime: number, maxMs: number): void {
  const elapsed = Date.now() - startTime;
  expect(
    elapsed,
    `Response took ${elapsed}ms — expected under ${maxMs}ms`
  ).toBeLessThan(maxMs);
}
