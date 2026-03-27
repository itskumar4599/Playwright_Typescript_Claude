import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — The Parent Class for All Page Objects
 *
 * CONCEPT: Page Object Model (POM)
 * Every page in your application gets its own class.
 * Each class holds:
 *   1. Locators   — HOW to find elements
 *   2. Actions    — WHAT to do with those elements
 *
 * BasePage provides SHARED methods that ALL pages need.
 * Individual pages extend this class (inheritance).
 *
 * Interview Tip: POM is the #1 design pattern asked about.
 * Key benefits: reusability, maintainability, readability.
 * "If the UI changes, you fix one page object, not 20 tests."
 */
export class BasePage {
  // The Playwright Page object — your browser window handle
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a URL
   * Using '/' works because baseURL is set in playwright.config.ts
   */
  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Fill a form field — the most common action in form testing
   * Clears existing value first, then fills with new value
   */
  async fillField(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Click an element safely — waits for it to be visible first
   */
  async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /**
   * Get text content from an element
   */
  async getElementText(locator: Locator): Promise<string | null> {
    await locator.waitFor({ state: 'visible' });
    return await locator.textContent();
  }

  /**
   * Check if an element is visible on the page
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Assert that an element contains specific text
   * Interview Tip: expect() is Playwright's built-in assertion library
   */
  async assertText(locator: Locator, expectedText: string): Promise<void> {
    await expect(locator).toContainText(expectedText);
  }

  /**
   * Assert element is visible
   */
  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert element is hidden
   */
  async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Get the current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get the page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Wait for a specific number of milliseconds
   * Use sparingly — prefer waitFor() methods over fixed waits
   * Interview Tip: Hard-coded waits (sleep) are an anti-pattern.
   * Always explain WHY you'd use one and what the better alternative is.
   */
  async waitFor(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Select a value from a dropdown
   */
  async selectDropdown(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }

  /**
   * Handle cookie consent / popups — common on real websites
   */
  async dismissCookieBanner(cookieButtonSelector: string): Promise<void> {
    try {
      const cookieBtn = this.page.locator(cookieButtonSelector);
      if (await cookieBtn.isVisible({ timeout: 5000 })) {
        await cookieBtn.click();
      }
    } catch {
      // Cookie banner not present — that's fine, continue
    }
  }
}
