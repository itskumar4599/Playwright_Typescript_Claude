/**
 * API Test Suite: Authentication Endpoints
 * API: https://dummyjson.com/docs/auth
 *
 * Covers:
 * ✅ POST /auth/login  — valid credentials → 200 + accessToken + refreshToken
 * ✅ POST /auth/login  — invalid password  → 400 + error message
 * ✅ POST /auth/login  — missing password  → 400 + error message
 * ✅ GET  /auth/me     — with valid token   → 200 + user profile
 * ✅ GET  /auth/me     — without token      → 401 Unauthorized
 * ✅ Token refresh flow (accessToken + refreshToken concept)
 * ✅ Data-driven negative login tests
 *
 * Test credentials (built into dummyjson):
 *   username: "emilys" | password: "emilyspass"
 */

import { test, expect } from '../../fixtures/apiFixtures';
import { assertOk, assertBadRequest, assertUnauthorized } from '../../utils/apiHelpers';
import { LoginResponse, AuthErrorResponse } from '../../api/models/response/AuthResponse';

test.describe('Authentication API', () => {

  // ─────────────────────────────────────────────────────────────
  // LOGIN — Happy Path
  // ─────────────────────────────────────────────────────────────

  test('TC_AUTH_001 — POST /auth/login with valid credentials returns tokens and user profile', async ({ apiClient }) => {
    /**
     * Login happy path — the most critical auth test.
     *
     * dummyjson returns BOTH the token AND user profile in one response.
     * This is common in modern APIs (avoids a second GET /me call).
     *
     * Interview Tip: Verify:
     * 1. Status 200
     * 2. accessToken exists and is a non-empty string
     * 3. refreshToken exists (proves JWT refresh flow is present)
     * 4. User profile fields are populated (id, username, email)
     */
    const response = await apiClient.login({
      username: 'emilys',
      password: 'emilyspass',
    });

    assertOk(response);

    const body = response.body as LoginResponse;

    // accessToken — used in Authorization: Bearer <token>
    expect(body.accessToken).toBeDefined();
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    // refreshToken — used to get a new accessToken when it expires
    expect(body.refreshToken).toBeDefined();
    expect(body.refreshToken.length).toBeGreaterThan(0);

    // User profile returned alongside token
    expect(body.id).toBeGreaterThan(0);
    expect(body.username).toBe('emilys');
    expect(body.email).toContain('@');
    expect(body.firstName).toBeTruthy();

    console.log(`Logged in as: ${body.firstName} ${body.lastName} (${body.email})`);
    console.log(`Token (first 30 chars): ${body.accessToken.substring(0, 30)}...`);
  });

  // ─────────────────────────────────────────────────────────────
  // LOGIN → USE TOKEN (End-to-End Auth Flow)
  // ─────────────────────────────────────────────────────────────

  test('TC_AUTH_002 — Login → set token → GET /auth/me returns authenticated profile', async ({ apiClient }) => {
    /**
     * This is the full authentication E2E flow:
     *
     * Step 1: POST /auth/login → get accessToken
     * Step 2: Set Authorization: Bearer <token> header
     * Step 3: GET /auth/me → server verifies token → returns profile
     * Step 4: Assert profile matches the login credentials
     *
     * Interview Tip: This test proves your auth flow works end-to-end.
     * It's the API equivalent of UI's "login → navigate to protected page."
     * Every API test suite should have this as a smoke test.
     */

    // Step 1: Login
    const loginRes = await apiClient.login({ username: 'emilys', password: 'emilyspass' });
    assertOk(loginRes);

    const { accessToken, username } = loginRes.body as LoginResponse;

    // Step 2: Set token on all subsequent requests
    apiClient.setAuthToken(accessToken);

    // Step 3: Call protected endpoint
    const meRes = await apiClient.getAuthenticatedUser();
    assertOk(meRes);

    // Step 4: Profile should match who logged in
    expect(meRes.body.username).toBe(username);
    expect(meRes.body.email).toContain('@');
    expect(meRes.body.firstName).toBeTruthy();

    console.log(`/auth/me confirms user: ${meRes.body.firstName} ${meRes.body.lastName}`);
  });

  test('TC_AUTH_003 — GET /auth/me without token returns 401 Unauthorized', async ({ apiClient }) => {
    /**
     * Security test — protected endpoint rejects unauthenticated requests.
     *
     * Interview Tip: 401 vs 403:
     * 401 Unauthorized = "Who are you?" — no/invalid token
     * 403 Forbidden    = "I know who you are, but you can't access this"
     *
     * /auth/me with no token → 401 (identity unknown)
     * /auth/me with valid token but wrong role → 403 (identity known, permission denied)
     *
     * This is a critical security test. If this returns 200 without a token,
     * you have a major security vulnerability.
     */

    // Explicitly ensure no auth token is set
    apiClient.clearAuthToken();

    const response = await apiClient.getAuthenticatedUser();

    assertUnauthorized(response);

    console.log(`Correctly rejected with: ${response.status}`);
  });

  // ─────────────────────────────────────────────────────────────
  // LOGIN — Negative Tests
  // ─────────────────────────────────────────────────────────────

  test('TC_AUTH_004 — POST /auth/login with wrong password returns 400', async ({ apiClient }) => {
    /**
     * Invalid credentials test.
     *
     * Interview Tip: What HTTP status for wrong password?
     * 400 Bad Request — the request is syntactically valid but logically wrong
     * NOT 401 — that's for missing/expired tokens on protected endpoints
     *
     * Some APIs use 401 here — both are valid. Know the distinction.
     */
    const response = await apiClient.login({
      username: 'emilys',
      password: 'wrong_password_123',
    });

    assertBadRequest(response);

    const body = response.body as unknown as AuthErrorResponse;
    expect(body.message).toBeDefined();
    expect(body.message.toLowerCase()).toContain('invalid');

    console.log(`Error: "${body.message}"`);
  });

  test('TC_AUTH_005 — POST /auth/login with non-existent username returns 400', async ({ apiClient }) => {
    const response = await apiClient.login({
      username: 'ghostuser_xyz_999',
      password: 'anypassword',
    });

    assertBadRequest(response);

    const body = response.body as unknown as AuthErrorResponse;
    expect(body.message).toBeDefined();

    console.log(`Error for unknown user: "${body.message}"`);
  });

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATED CLIENT FIXTURE
  // ─────────────────────────────────────────────────────────────

  test('TC_AUTH_006 — Authenticated fixture auto-injects token before test', async ({ authenticatedApiClient }) => {
    /**
     * This test uses the `authenticatedApiClient` FIXTURE.
     *
     * The fixture (in fixtures/apiFixtures.ts) automatically:
     * 1. Calls POST /auth/login
     * 2. Extracts the accessToken
     * 3. Sets Authorization: Bearer <token>
     * 4. Hands the ready-to-use client to this test
     *
     * The test itself has ZERO auth setup code — it's all in the fixture.
     * This is Playwright Fixtures at their best.
     *
     * Interview Tip: "Describe how you handle authenticated API tests."
     * Answer: "I use a custom Playwright fixture that logs in once and
     * injects the authenticated client via dependency injection.
     * Tests declare their need for auth — the fixture fulfills it."
     */
    const response = await authenticatedApiClient.getAuthenticatedUser();

    assertOk(response);
    expect(response.body.username).toBe('emilys');
    expect(response.body.firstName).toBeTruthy();

    console.log(`Fixture auto-auth works: ${response.body.firstName} ${response.body.lastName}`);
  });

  // ─────────────────────────────────────────────────────────────
  // DATA-DRIVEN NEGATIVE TESTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Multiple invalid credential scenarios tested with a single loop.
   *
   * Interview Tip: "How do you avoid copy-paste test code?"
   * Answer: Data-driven tests — define the data set, loop through it.
   * Same test logic, different inputs. One place to maintain.
   */
  const invalidCredentials = [
    { username: '',        password: 'emilyspass', scenario: 'empty username' },
    { username: 'emilys',  password: '',            scenario: 'empty password' },
    { username: 'x'.repeat(200), password: 'pass', scenario: 'extremely long username' },
  ];

  for (const creds of invalidCredentials) {
    test(`TC_AUTH_007 — Login rejects: ${creds.scenario}`, async ({ apiClient }) => {
      const response = await apiClient.login({
        username: creds.username,
        password: creds.password,
      });

      // All invalid inputs must result in failure (non-200)
      expect(
        response.ok,
        `Login should fail for scenario: "${creds.scenario}" but got ${response.status}`
      ).toBe(false);

      console.log(`"${creds.scenario}" → ${response.status}`);
    });
  }
});
