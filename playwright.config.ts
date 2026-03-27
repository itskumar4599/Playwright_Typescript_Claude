import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration File
 *
 * This is the central config for all Playwright tests.
 * Think of it like a master settings file — browsers, timeouts,
 * base URLs, and reporting all live here.
 *
 * Interview Tip: Always mention that you keep environment-specific
 * values (like baseURL) in config, not hardcoded in tests.
 */
export default defineConfig({
  // Directory where test files are located
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests (useful on flaky network-dependent tests)
  retries: process.env.CI ? 2 : 1,

  // Number of parallel workers
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration — generates HTML report after test run
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']  // shows test names inline while running
  ],

  // Shared settings for all tests (like a global "before" config)
  use: {
    // Base URL — allows using relative paths like page.goto('/')
    baseURL: 'https://www.pfizerforall.com',

    // Capture screenshot only on test failure
    screenshot: 'only-on-failure',

    // Record video only on test failure (great for debugging)
    video: 'retain-on-failure',

    // Capture trace on first retry — helps diagnose flaky tests
    trace: 'on-first-retry',

    // Global timeout for each action (click, fill, etc.)
    actionTimeout: 15000,

    // Wait for navigation to complete after actions
    navigationTimeout: 30000,

    // Run tests in headless mode by default
    headless: false,

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Define which browsers/contexts to run tests on
  projects: [
    // ── UI Projects ──────────────────────────────────────────
    {
      name: 'chromium',
      testMatch: '**/tests/*.spec.ts',   // Only UI tests (not api subfolder)
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: '**/tests/*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },

    {
      name: 'webkit',
      testMatch: '**/tests/*.spec.ts',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing — great for interview discussions!
    {
      name: 'Mobile Chrome',
      testMatch: '**/tests/*.spec.ts',
      use: { ...devices['Pixel 5'] },
    },

    // ── API Project ───────────────────────────────────────────
    // Interview Tip: API tests don't need a browser context.
    // Using a separate project isolates API tests from UI tests
    // so you can run them independently: --project=api
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',  // Only API test files
      use: {
        // No browser — API tests use Playwright's request context only
        baseURL: 'https://reqres.in',
        // API tests don't need screenshots or videos
        screenshot: 'off',
        video: 'off',
        // Keep trace for debugging failed API tests
        trace: 'on-first-retry',
      },
    },
  ],

  // Global timeout for each test (60 seconds)
  timeout: 60000,
});
