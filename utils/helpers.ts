import { Page, expect } from '@playwright/test';

/**
 * Helpers / Utility Functions
 *
 * These are reusable functions that don't belong to any single page.
 * Helpers keep your Page Objects and tests clean.
 *
 * Interview Tip: "Separation of Concerns" — page objects handle
 * locators + actions, helpers handle cross-cutting utilities.
 */

/**
 * Wait for a page to fully load (network idle state)
 * Useful for SPAs (Single Page Applications)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Take a named screenshot — helpful for manual verification & reports
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Verify page title contains expected text
 * Interview Tip: Always use soft assertions where failure shouldn't
 * stop the test, and hard assertions where it must stop.
 */
export async function verifyPageTitle(page: Page, expectedTitle: string): Promise<void> {
  await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
}

/**
 * Verify current URL contains a path segment
 */
export async function verifyUrl(page: Page, expectedUrlPart: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(expectedUrlPart, 'i'));
}

/**
 * Pause execution — only use during debugging, never in real tests
 * Equivalent to a breakpoint
 */
export async function debugPause(page: Page): Promise<void> {
  await page.pause();
}

/**
 * Clear a field and type a value
 * Useful when fill() doesn't trigger certain JavaScript events
 */
export async function clearAndType(page: Page, selector: string, value: string): Promise<void> {
  await page.locator(selector).clear();
  await page.locator(selector).type(value, { delay: 50 });
}

/**
 * Scroll element into view before interacting
 * Prevents "Element not visible" errors on long pages
 */
export async function scrollAndClick(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.click();
}
