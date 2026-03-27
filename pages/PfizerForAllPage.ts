import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { UserDetails } from '../utils/testData';

/**
 * PfizerForAllPage — Page Object for https://www.pfizerforall.com/
 *
 * This class represents the Pfizer For All website.
 * It extends BasePage, inheriting all shared methods.
 *
 * STRUCTURE of a Page Object:
 * 1. LOCATORS  — defined as class properties using Playwright's locator API
 * 2. ACTIONS   — methods that combine locators with BasePage actions
 * 3. NO ASSERTIONS in Page Objects (keep them in tests — separation of concerns)
 *
 * Interview Tip: Always use data-testid attributes when available.
 * If not, prefer role-based locators (getByRole, getByLabel) over CSS/XPath.
 * Playwright recommends: getByRole > getByLabel > getByText > CSS > XPath
 */
export class PfizerForAllPage extends BasePage {

  // ─────────────────────────────────────────────
  // LOCATORS — How to find elements on the page
  // ─────────────────────────────────────────────

  // Navigation / Header
  readonly pageHeading: Locator;
  readonly navMenu: Locator;

  // Cookie / Privacy Banner (common on healthcare sites)
  readonly cookieAcceptButton: Locator;

  // Contact / Registration Form fields
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  // Success / Error messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  // "Get Started" or CTA button on homepage
  readonly getStartedButton: Locator;

  constructor(page: Page) {
    // Call parent constructor — passes page to BasePage
    super(page);

    // ─────────────────────────────────────────────────────────────
    // Initializing Locators
    //
    // Playwright Locator Strategy (Best to Worst):
    // 1. getByRole()   — matches accessibility roles (most resilient)
    // 2. getByLabel()  — matches form labels (great for inputs)
    // 3. getByText()   — matches visible text
    // 4. getByPlaceholder() — matches placeholder text
    // 5. locator('css') — CSS selectors (fragile if class names change)
    // 6. locator('xpath') — use as last resort
    // ─────────────────────────────────────────────────────────────

    this.pageHeading = page.getByRole('heading', { level: 1 });
    this.navMenu = page.locator('nav');

    // Cookie banner — common selector patterns for GDPR banners
    this.cookieAcceptButton = page.locator(
      'button:has-text("Accept"), button:has-text("Accept All"), #onetrust-accept-btn-handler'
    );

    // Form fields — using multiple strategies for resilience
    // getByLabel() is preferred as it matches the <label> element text
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.emailInput = page.getByLabel(/email/i);

    // Submit button
    this.submitButton = page.getByRole('button', { name: /submit|send|continue/i });

    // Result messages
    this.successMessage = page.locator('[class*="success"], [class*="confirmation"], [class*="thank"]');
    this.errorMessage = page.locator('[class*="error"], [class*="alert"], [role="alert"]');

    // Call-to-action button on homepage
    this.getStartedButton = page.getByRole('link', { name: /get started|learn more|find out/i });
  }

  // ─────────────────────────────────────────────
  // ACTIONS — What to do on this page
  // ─────────────────────────────────────────────

  /**
   * Navigate to the Pfizer For All homepage
   */
  async goToHomePage(): Promise<void> {
    await this.navigate('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Handle cookie consent popup if it appears
   * Interview Tip: Always handle popups in before hooks or at the
   * start of the test so they don't interfere with actual test steps
   */
  async handleCookieConsent(): Promise<void> {
    await this.dismissCookieBanner(
      'button:has-text("Accept"), #onetrust-accept-btn-handler, button:has-text("Accept All")'
    );
  }

  /**
   * Fill in the First Name field
   */
  async enterFirstName(firstName: string): Promise<void> {
    await this.fillField(this.firstNameInput, firstName);
  }

  /**
   * Fill in the Last Name field
   */
  async enterLastName(lastName: string): Promise<void> {
    await this.fillField(this.lastNameInput, lastName);
  }

  /**
   * Fill in the Email field
   */
  async enterEmail(email: string): Promise<void> {
    await this.fillField(this.emailInput, email);
  }

  /**
   * Fill ALL user detail fields in one call
   * Interview Tip: Combining related actions into one method
   * keeps the test step clean and readable.
   *
   * Before: 3 separate calls in the test
   * After:  1 clean call — page.fillUserDetails(user)
   */
  async fillUserDetails(user: UserDetails): Promise<void> {
    await this.enterFirstName(user.firstName);
    await this.enterLastName(user.lastName);
    await this.enterEmail(user.email);
  }

  /**
   * Click the Submit button
   */
  async clickSubmit(): Promise<void> {
    await this.clickElement(this.submitButton);
  }

  /**
   * Complete the full form submission flow
   * This is a "high-level action" that combines multiple steps
   */
  async submitContactForm(user: UserDetails): Promise<void> {
    await this.fillUserDetails(user);
    await this.clickSubmit();
  }

  /**
   * Click the Get Started / CTA button on homepage
   */
  async clickGetStarted(): Promise<void> {
    await this.clickElement(this.getStartedButton);
  }

  /**
   * Get the page heading text
   */
  async getHeadingText(): Promise<string | null> {
    return await this.getElementText(this.pageHeading);
  }

  /**
   * Verify the homepage loaded correctly
   */
  async verifyHomepageLoaded(): Promise<void> {
    await this.assertVisible(this.pageHeading);
  }

  /**
   * Check if the success message is visible after form submission
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.successMessage);
  }

  /**
   * Check if an error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }
}
