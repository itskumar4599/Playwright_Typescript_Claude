/**
 * API Test Suite: User Endpoints — Full CRUD
 * API: https://dummyjson.com/docs/users
 *
 * Covers:
 * ✅ GET  /users           — list with offset pagination
 * ✅ GET  /users/:id       — single user (found + 404)
 * ✅ POST /users/add       — create → verify 201 + body
 * ✅ PUT  /users/:id       — full update
 * ✅ PATCH /users/:id      — partial update
 * ✅ DELETE /users/:id     — delete → verify isDeleted: true
 * ✅ E2E: Create → Read → Update → Delete lifecycle
 * ✅ Parallel calls via Promise.all
 * ✅ Response time assertion (non-functional testing)
 */

import { test, expect } from '../../fixtures/apiFixtures';
import {
  assertOk,
  assertCreated,
  assertNotFound,
  assertTimestamp,
  assertResponseTimeWithin,
  assertFieldType,
} from '../../utils/apiHelpers';

test.describe('User API — CRUD Operations', () => {

  // ─────────────────────────────────────────────────────────────
  // GET — List Users
  // ─────────────────────────────────────────────────────────────

  test('TC_API_001 — GET /users returns list with correct pagination structure', async ({ apiClient }) => {
    /**
     * Verify:
     * 1. Status 200
     * 2. Pagination fields: total, skip, limit
     * 3. users array contains objects with expected shape
     * 4. Field types are correct (schema validation)
     *
     * Interview Tip: dummyjson uses offset-based pagination (skip/limit).
     * reqres used page-based (page/per_page). Know both for interviews.
     */
    const startTime = Date.now();

    const response = await apiClient.getUsers(5, 0); // limit=5, skip=0

    assertOk(response);
    assertResponseTimeWithin(startTime, 5000);

    // Pagination structure
    expect(response.body.users).toBeDefined();
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.skip).toBe(0);
    expect(response.body.limit).toBe(5);
    expect(response.body.users.length).toBeLessThanOrEqual(5);

    // Shape of first user
    const first = response.body.users[0];
    expect(first.id).toBeDefined();
    expect(first.firstName).toBeTruthy();
    expect(first.lastName).toBeTruthy();
    expect(first.email).toContain('@');

    // Type-level schema check
    assertFieldType(first as unknown as Record<string, unknown>, 'id', 'number');
    assertFieldType(first as unknown as Record<string, unknown>, 'firstName', 'string');

    console.log(`Total users in DB: ${response.body.total}, returned: ${response.body.users.length}`);
  });

  test('TC_API_002 — GET /users with skip returns different records than first page', async ({ apiClient }) => {
    /**
     * Offset pagination test — skip=0 and skip=5 should return different users.
     *
     * Interview Tip: Parallel API calls with Promise.all
     * Instead of calling them sequentially (2 × 500ms = 1000ms),
     * we call them simultaneously (max(500ms, 500ms) = 500ms).
     * Use when calls are INDEPENDENT — neither result depends on the other.
     */
    const [page1, page2] = await Promise.all([
      apiClient.getUsers(5, 0),   // first 5 users
      apiClient.getUsers(5, 5),   // next 5 users (skip the first 5)
    ]);

    assertOk(page1);
    assertOk(page2);

    const page1Ids = page1.body.users.map(u => u.id);
    const page2Ids = page2.body.users.map(u => u.id);

    // No IDs should overlap between the two pages
    const overlap = page1Ids.some(id => page2Ids.includes(id));
    expect(overlap, 'Page 1 and Page 2 user IDs should not overlap').toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // GET — Single User
  // ─────────────────────────────────────────────────────────────

  test('TC_API_003 — GET /users/:id returns correct user for valid ID', async ({ apiClient }) => {
    const userId = 1;

    const response = await apiClient.getUserById(userId);

    assertOk(response);

    // dummyjson returns the user object directly (no wrapper)
    expect(response.body.id).toBe(userId);
    expect(response.body.firstName).toBeTruthy();
    expect(response.body.lastName).toBeTruthy();
    expect(response.body.email).toContain('@');
    expect(response.body.username).toBeTruthy();

    console.log(`User: ${response.body.firstName} ${response.body.lastName} (${response.body.email})`);
  });

  test('TC_API_004 — GET /users/:id returns 404 for non-existent user', async ({ apiClient }) => {
    /**
     * Negative test — always test the "not found" case.
     *
     * Interview Tip: A well-designed API returns 404 for missing resources.
     * A badly-designed one might return 200 with null body — that's a bug.
     */
    const response = await apiClient.getUserById(9999);

    assertNotFound(response);
  });

  // ─────────────────────────────────────────────────────────────
  // POST — Create User
  // ─────────────────────────────────────────────────────────────

  test('TC_API_005 — POST /users/add creates user and returns 201 with assigned ID', async ({ apiClient }) => {
    /**
     * Key assertions for CREATE:
     * 1. Status 201 (not 200!) — Created
     * 2. Response echoes sent data
     * 3. Server assigned a new unique id
     *
     * Interview Tip: POST should return 201 Created, not 200 OK.
     * If you see 200 on a create operation, that's technically wrong REST.
     */
    const newUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      age: 30,
    };

    const response = await apiClient.createUser(newUser);

    assertCreated(response);

    expect(response.body.firstName).toBe(newUser.firstName);
    expect(response.body.lastName).toBe(newUser.lastName);
    expect(response.body.email).toBe(newUser.email);

    // Server must assign an ID
    expect(response.body.id).toBeDefined();
    expect(typeof response.body.id).toBe('number');

    console.log(`Created user ID: ${response.body.id}`);
  });

  test('TC_API_006 — POST /users/add — parallel creates both succeed with 201', async ({ apiClient }) => {
    /**
     * POST is NOT idempotent — calling it N times is valid and each call succeeds.
     *
     * NOTE: dummyjson is a read-only mock API — it always returns id=209
     * for any created user (doesn't actually persist data).
     * In a real API, each POST would return a unique ID.
     *
     * Interview Tip: Explain this limitation when discussing mock APIs.
     * "dummyjson simulates responses — real persistence would assign unique IDs.
     * I'd verify unique IDs against a real database or a real API endpoint."
     *
     * What we CAN verify here: both calls succeed, both return 201 and
     * the correct request data is echoed back — which tests the API contract.
     */
    const userData = { firstName: 'Test', lastName: 'User', email: 'test@example.com', age: 25 };

    const [res1, res2] = await Promise.all([
      apiClient.createUser(userData),
      apiClient.createUser(userData),
    ]);

    assertCreated(res1);
    assertCreated(res2);

    // Both responses should echo back the sent data
    expect(res1.body.firstName).toBe(userData.firstName);
    expect(res2.body.firstName).toBe(userData.firstName);
    expect(res1.body.email).toBe(userData.email);
    expect(res2.body.email).toBe(userData.email);

    console.log(`Both POSTs returned 201 — API handles concurrent creates correctly`);
  });

  // ─────────────────────────────────────────────────────────────
  // PUT — Full Update
  // ─────────────────────────────────────────────────────────────

  test('TC_API_007 — PUT /users/:id fully updates a user', async ({ apiClient }) => {
    /**
     * PUT replaces ALL fields on the resource.
     * The response is the full updated user object.
     */
    const response = await apiClient.updateUser(1, {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@updated.com',
      age: 28,
    });

    assertOk(response);

    expect(response.body.firstName).toBe('Jane');
    expect(response.body.lastName).toBe('Smith');
    expect(response.body.email).toBe('jane.smith@updated.com');
    expect(response.body.age).toBe(28);
  });

  // ─────────────────────────────────────────────────────────────
  // PATCH — Partial Update
  // ─────────────────────────────────────────────────────────────

  test('TC_API_008 — PATCH /users/:id updates only the specified fields', async ({ apiClient }) => {
    /**
     * PATCH sends only the fields you want to change.
     * Other fields remain untouched on the server.
     *
     * Interview Tip: PATCH is safer than PUT for partial updates
     * because you can't accidentally wipe a field by forgetting to include it.
     */
    const response = await apiClient.patchUser(1, {
      email: 'patched.email@example.com', // only changing email
    });

    assertOk(response);
    expect(response.body.email).toBe('patched.email@example.com');

    // Other fields should still be present
    expect(response.body.firstName).toBeTruthy();
    expect(response.body.id).toBe(1);
  });

  // ─────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────

  test('TC_API_009 — DELETE /users/:id returns 200 with isDeleted:true', async ({ apiClient }) => {
    /**
     * dummyjson DELETE returns 200 + { isDeleted: true, deletedOn: "..." }
     * This differs from reqres which returned 204 No Content.
     *
     * Interview Tip: Both are valid REST. The choice depends on whether
     * the client needs confirmation data after deletion.
     * 204 = "it's gone, I have nothing to tell you"
     * 200 = "it's gone, here's the deletion receipt"
     */
    const response = await apiClient.deleteUser(1);

    assertOk(response);

    expect(response.body.isDeleted).toBe(true);
    expect(response.body.deletedOn).toBeDefined();
    assertTimestamp(response.body.deletedOn, 'deletedOn');

    console.log(`User deleted on: ${response.body.deletedOn}`);
  });

  // ─────────────────────────────────────────────────────────────
  // E2E: Full Lifecycle — Create → Read → Update → Delete
  // ─────────────────────────────────────────────────────────────

  test('TC_API_010 — E2E: Full user lifecycle (Create → Read → Update → Delete)', async ({ apiClient }) => {
    /**
     * End-to-End API Test — chains multiple dependent calls.
     *
     * Interview Tip: This is the most impressive API test to discuss.
     * "I chain API calls where each step depends on the previous one.
     * This mirrors real user journeys through the system."
     *
     * NOTE: dummyjson doesn't persist mutations (simulated),
     * so the "Read after Create" uses a known existing user (id=1).
     * In a real app with real persistence, you'd read the created id.
     */

    // ── 1. CREATE ────────────────────────────────────────────
    const createRes = await apiClient.createUser({
      firstName: 'Alice',
      lastName: 'Tester',
      email: 'alice.tester@qa.com',
      age: 27,
    });
    assertCreated(createRes);
    expect(createRes.body.id).toBeGreaterThan(0);
    console.log(`✓ CREATE → ID: ${createRes.body.id}`);

    // ── 2. READ (using a known user since dummyjson is read-only) ─
    const readRes = await apiClient.getUserById(1);
    assertOk(readRes);
    expect(readRes.body.id).toBe(1);
    console.log(`✓ READ → ${readRes.body.firstName} ${readRes.body.lastName}`);

    // ── 3. UPDATE ────────────────────────────────────────────
    const updateRes = await apiClient.patchUser(1, { email: 'updated@e2e.com' });
    assertOk(updateRes);
    expect(updateRes.body.email).toBe('updated@e2e.com');
    console.log(`✓ UPDATE → email: ${updateRes.body.email}`);

    // ── 4. DELETE ────────────────────────────────────────────
    const deleteRes = await apiClient.deleteUser(1);
    assertOk(deleteRes);
    expect(deleteRes.body.isDeleted).toBe(true);
    console.log(`✓ DELETE → isDeleted: ${deleteRes.body.isDeleted}`);
  });

  // ─────────────────────────────────────────────────────────────
  // Response Time — Non-Functional Testing
  // ─────────────────────────────────────────────────────────────

  test('TC_API_011 — GET /users responds within performance threshold', async ({ apiClient }) => {
    /**
     * Non-functional / Performance test in the API suite.
     *
     * Interview Tip: "What non-functional tests do you include in API suites?"
     * - Response time thresholds (this test)
     * - Payload size checks (is the response too large?)
     * - Rate limiting behaviour (429 Too Many Requests)
     *
     * These are often overlooked but show QA maturity.
     */
    const startTime = Date.now();
    const response = await apiClient.getUsers(10, 0);

    assertOk(response);
    assertResponseTimeWithin(startTime, 3000);  // must respond within 3 seconds

    console.log(`Response time: ${Date.now() - startTime}ms`);
  });
});
