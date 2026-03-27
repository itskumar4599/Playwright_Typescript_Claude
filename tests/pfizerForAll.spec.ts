import { test, expect } from '@playwright/test';
import { PfizerForAllPage } from '../pages/PfizerForAllPage';
import { primaryUser, testUsers, invalidUser } from '../utils/testData';
import { takeScreenshot, verifyPageTitle } from '../utils/helpers';

/**
 * Test Suite: Pfizer For All — Contact Form
 *
 * STRUCTURE of a Playwright Test File:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  test.describe()  → Groups related tests (like a class)     │
 * │  test.beforeEach() → Runs BEFORE every test in the group    │
 * │  test.afterEach()  → Runs AFTER every test (cleanup)        │
 * │  test()            → Individual test case                   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Interview Tip: describe() = Test Suite, test() = Test Case.
 * Think of describe as a folder, test as a file inside it.
 */

test.describe('Pfizer For All - Homepage and Contact Form', () => {

  // ─────────────────────────────────────────────
  // Page Object instance — shared across all tests
  // ─────────────────────────────────────────────
  let pfizerPage: PfizerForAllPage;

  /**
   * beforeEach Hook
   * Runs before EVERY test in this describe block.
   * Use it for: navigation, login, clearing state.
   *
   * Interview Tip: "Why beforeEach and not beforeAll?"
   * beforeEach gives each test a FRESH browser state — tests
   * are isolated and don't share data/cookies from each other.
   * This prevents test pollution (one test failing another).
   */
  test.beforeEach(async ({ page }) => {
    // Create a new page object for each test
    pfizerPage = new PfizerForAllPage(page);

    // Navigate to the homepage before each test
    await pfizerPage.goToHomePage();

    // Handle cookie/privacy consent if it appears
    await pfizerPage.handleCookieConsent();
  });

  /**
   * afterEach Hook
   * Runs after EVERY test — good for cleanup and screenshots.
   * Note: Playwright auto-takes screenshots on failure if configured,
   * but this shows you how to do it manually.
   */
  test.afterEach(async ({ page }, testInfo) => {
    // Take a screenshot if the test FAILED
    if (testInfo.status === 'failed') {
      await takeScreenshot(page, `FAILED-${testInfo.title.replace(/\s+/g, '_')}`);
    }
  });

  // ─────────────────────────────────────────────────────────
  // TEST CASE 1: Verify the homepage loads correctly
  // ─────────────────────────────────────────────────────────
  test('TC001 - Verify Pfizer For All homepage loads', async ({ page }) => {
    /**
     * What we're testing: Basic smoke test — does the page load?
     * Interview Tip: Always have a smoke test. It's the quickest
     * signal that the environment is working before running deeper tests.
     */

    // Verify the page title contains "Pfizer"
    await verifyPageTitle(page, 'Pfizer');

    // Verify the main heading is visible
    await pfizerPage.verifyHomepageLoaded();

    // Assert the URL is correct
    expect(page.url()).toContain('pfizerforall.com');

    console.log('Page Title:', await pfizerPage.getPageTitle());
    console.log('Page URL:', pfizerPage.getCurrentUrl());
  });

  // ─────────────────────────────────────────────────────────
  // TEST CASE 2: Fill the contact form with valid user data
  // ─────────────────────────────────────────────────────────
  test('TC002 - Fill contact form with First Name, Last Name, and Email', async ({ page }) => {
    /**
     * MAIN TEST CASE
     *
     * What we're testing: Enter user details into the contact form.
     * Data: John | Doe | John.XYZ@abc.com
     *
     * Steps:
     * 1. Navigate to the form (done in beforeEach)
     * 2. Enter First Name
     * 3. Enter Last Name
     * 4. Enter Email
     * 5. Verify each field has the correct value
     */

    // ── Step: Enter First Name ──────────────────────────────
    await pfizerPage.enterFirstName(primaryUser.firstName);

    // Assert the field has the correct value after filling
    await expect(pfizerPage.firstNameInput).toHaveValue(primaryUser.firstName);

    // ── Step: Enter Last Name ───────────────────────────────
    await pfizerPage.enterLastName(primaryUser.lastName);

    await expect(pfizerPage.lastNameInput).toHaveValue(primaryUser.lastName);

    // ── Step: Enter Email ────────────────────────────────────
    await pfizerPage.enterEmail(primaryUser.email);

    await expect(pfizerPage.emailInput).toHaveValue(primaryUser.email);

    // ── Screenshot for verification ──────────────────────────
    await takeScreenshot(page, 'TC002-form-filled');

    console.log(`Form filled with: ${primaryUser.firstName} ${primaryUser.lastName} - ${primaryUser.email}`);
  });

  // ─────────────────────────────────────────────────────────
  // TEST CASE 3: Fill form using the combined helper method
  // ─────────────────────────────────────────────────────────
  test('TC003 - Fill all user details using fillUserDetails method', async ({ page }) => {
    /**
     * Same as TC002 but uses the higher-level page object method.
     * Interview Tip: This shows the BENEFIT of POM — one method
     * call instead of three. If the form adds a "Middle Name" field,
     * you only update PfizerForAllPage, not every test.
     */

    // Fill all fields in ONE call
    await pfizerPage.fillUserDetails(primaryUser);

    // Verify all fields
    await expect(pfizerPage.firstNameInput).toHaveValue('John');
    await expect(pfizerPage.lastNameInput).toHaveValue('Doe');
    await expect(pfizerPage.emailInput).toHaveValue('John.XYZ@abc.com');

    await takeScreenshot(page, 'TC003-all-fields-filled');
  });

  // ─────────────────────────────────────────────────────────
  // TEST CASE 4: Data-Driven Test using test.each()
  // ─────────────────────────────────────────────────────────
  for (const user of testUsers) {
    test(`TC004 - Data-driven: Fill form for ${user.firstName} ${user.lastName}`, async ({ page }) => {
      /**
       * DATA-DRIVEN TESTING
       *
       * Instead of writing one test per user, we loop over the
       * testUsers array. Playwright will create a separate test
       * instance for each user automatically.
       *
       * Interview Tip: This is how you avoid copy-paste tests.
       * The test name includes the user's name so reports are clear.
       */

      await pfizerPage.fillUserDetails(user);

      await expect(pfizerPage.firstNameInput).toHaveValue(user.firstName);
      await expect(pfizerPage.lastNameInput).toHaveValue(user.lastName);
      await expect(pfizerPage.emailInput).toHaveValue(user.email);
    });
  }

  // ─────────────────────────────────────────────────────────
  // TEST CASE 5: Negative Test — Empty Fields Validation
  // ─────────────────────────────────────────────────────────
  test('TC005 - Negative: Submit form with empty fields', async ({ page }) => {
    /**
     * NEGATIVE TESTING
     *
     * We test what SHOULDN'T work. If someone clicks Submit with
     * empty fields, the form should show validation errors.
     *
     * Interview Tip: Always cover negative scenarios.
     * "Happy path" is not enough — QAs are expected to break things.
     */

    // Don't fill any fields — click submit directly
    const isSubmitVisible = await pfizerPage.isVisible(pfizerPage.submitButton);

    if (isSubmitVisible) {
      await pfizerPage.clickSubmit();

      // The form should NOT navigate away — we should still be on the same page
      expect(page.url()).toContain('pfizerforall.com');
    } else {
      // If submit button isn't on homepage, skip this assertion
      console.log('Submit button not found on this page — form may be on a sub-page');
      test.skip();
    }
  });

  // ─────────────────────────────────────────────────────────
  // TEST CASE 6: Verify First Name field behavior
  // ─────────────────────────────────────────────────────────
  test('TC006 - Verify First Name input field is editable and accepts text', async ({ page }) => {
    /**
     * Field-level validation test
     * Tests a single field in isolation — useful for component testing.
     */

    const testFirstName = 'John';

    await pfizerPage.enterFirstName(testFirstName);

    // Field should be enabled (not readonly/disabled)
    await expect(pfizerPage.firstNameInput).toBeEnabled();

    // Field should have our value
    await expect(pfizerPage.firstNameInput).toHaveValue(testFirstName);

    // Field should be visible
    await expect(pfizerPage.firstNameInput).toBeVisible();
  });

});

/**
 * ────────────────────────────────────────────────────────────────
 * BONUS: Standalone test outside describe block
 * Shows you can also write tests without grouping them
 * ────────────────────────────────────────────────────────────────
 */
test('TC007 - Standalone: Verify Pfizer page loads with correct URL', async ({ page }) => {
  await page.goto('https://www.pfizerforall.com/');
  await page.waitForLoadState('networkidle');

  // URL should contain the domain
  expect(page.url()).toContain('pfizerforall.com');

  // Page should have a title
  const title = await page.title();
  expect(title).toBeTruthy(); // title is not empty
  console.log('Page Title:', title);
});

/**
 * ────────────────────────────────────────────────────────────────
 * BONUS: Standalone test outside describe block
 * Shows you can also write tests without grouping them
 * ────────────────────────────────────────────────────────────────
 */
test('TC008 - Manoj - Standalone: Verify Pfizer page loads with correct URL', async ({ page }) => {
  await page.goto('https://www.pfizerforall.com/');
  await page.waitForLoadState('networkidle');

  // URL should contain the domain
  expect(page.url()).toContain('pfizerforall.com');

  // Page should have a title
  const title = await page.title();
  expect(title).toBeTruthy(); // title is not empty
  console.log('Page Title:', title);
  await page.getByRole('textbox', { name: 'First name' }).fill('abcd');
  await page.waitForTimeout(10000);
});
/**
 * ────────────────────────────────────────────────────────────────
 * BONUS: Standalone test outside describe block
 * Shows you can also write tests without grouping them
 * ────────────────────────────────────────────────────────────────
 */
test('TC009 - Manoj - Standalone: Verify Pfizer page loads with correct URL', async ({ page }) => {
  await page.goto('https://www.pfizerforall.com/');
  await page.waitForLoadState('networkidle');

  // URL should contain the domain
  expect(page.url()).toContain('pfizerforall.com');

  // Page should have a title
  const title = await page.title();
  expect(title).toBeTruthy(); // title is not empty
  console.log('Page Title:', title);
  await page.getByRole('textbox', { name: 'Last name' }).fill('abcd',{timeout:3000});
  await page.getByRole('textbox', { name: 'Last name' }).fill("XYZ");
  await page.waitForTimeout(9000);
});
