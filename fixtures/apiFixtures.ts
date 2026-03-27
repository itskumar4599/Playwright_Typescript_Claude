import { test as base } from '@playwright/test';
import { ReqresApiClient } from '../api/clients/ReqresApiClient';
import { LoginResponse } from '../api/models/response/AuthResponse';

/**
 * Custom Playwright Fixtures
 *
 * CONCEPT: Fixtures are Playwright's dependency injection system.
 * They replace beforeEach/afterEach with composable, reusable setup.
 *
 * WHY Fixtures over beforeEach? (Interview Answer)
 * ─────────────────────────────────────────────────────────────────
 * 1. Composable — mix and match per test (use only what you need)
 * 2. Lazy — only instantiated when a test actually uses the fixture
 * 3. Scoped — 'test' (per test) or 'worker' (shared across tests)
 * 4. Co-located cleanup — teardown is in the same place as setup
 *
 * Fixture Scopes:
 * ─────────────────────────────────────────────────────────────────
 * scope: 'test'   → Fresh instance per test (default — safest, fully isolated)
 * scope: 'worker' → ONE instance shared across ALL tests in a worker
 *                   Use for expensive setup: DB seed, browser login session
 *
 * Interview Tip: "What's the difference between beforeEach and a fixture?"
 * beforeEach is imperative (runs in order, shared state risks).
 * Fixtures are declarative (tests say WHAT they need, not HOW to set it up).
 *
 * dummyjson test credentials:
 *   username: "emilys" | password: "emilyspass"
 */

interface ApiFixtures {
  apiClient: ReqresApiClient;
  authenticatedApiClient: ReqresApiClient;
}

export const test = base.extend<ApiFixtures>({

  /**
   * apiClient — unauthenticated API client
   * Available as { apiClient } in any test importing from this file.
   */
  apiClient: async ({ request }, use) => {
    const client = new ReqresApiClient(request);
    await use(client);
    // Playwright auto-disposes the request context — no manual cleanup needed
  },

  /**
   * authenticatedApiClient — pre-logged-in API client
   * Calls login, gets token, sets Authorization header automatically.
   *
   * Interview Tip: Fixture COMPOSITION.
   * This fixture handles login so EVERY test using it starts authenticated.
   * Tests stay clean — no login boilerplate.
   */
  authenticatedApiClient: async ({ request }, use) => {
    const client = new ReqresApiClient(request);

    // Perform login with dummyjson test credentials
    const loginResponse = await client.login({
      username: 'emilys',
      password: 'emilyspass',
    });

    // Set Bearer token if login succeeded
    if (loginResponse.status === 200 && 'accessToken' in loginResponse.body) {
      client.setAuthToken((loginResponse.body as LoginResponse).accessToken);
    }

    await use(client);

    client.clearAuthToken();
  },
});

export { expect } from '@playwright/test';
