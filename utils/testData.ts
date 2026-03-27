/**
 * Test Data File
 *
 * Centralizing test data is a critical best practice.
 * Why? Because if data changes, you update ONE place, not every test.
 *
 * Interview Tip: This is the foundation of "Data-Driven Testing".
 * In advanced setups, this data could come from an Excel file, JSON,
 * a database, or environment variables.
 */

export interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ContactFormData extends UserDetails {
  // Extend with more fields as needed
}

/**
 * Primary test user for Pfizer For All form
 */
export const primaryUser: UserDetails = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'John.XYZ@abc.com',
};

/**
 * Additional test users for data-driven testing scenarios
 * Interview Tip: Mention that you can loop over these in a single test
 * using test.each() — this avoids code duplication.
 */
export const testUsers: UserDetails[] = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'John.XYZ@abc.com',
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
];

/**
 * Invalid/negative test data for boundary testing
 */
export const invalidUser: UserDetails = {
  firstName: '',
  lastName: '',
  email: 'not-a-valid-email',
};
