/**
 * Environment Configuration
 *
 * CONCEPT: Never hardcode URLs or credentials in tests.
 * Store them here and switch via an ENV variable.
 *
 * Interview Tip: "How do you run tests against different environments?"
 * Answer: Use process.env to switch config at runtime.
 * Example: BASE_ENV=staging npx playwright test
 *
 * In CI/CD (Jenkins/GitHub Actions), you inject environment variables
 * so the same test suite runs against dev, staging, and prod.
 */

export interface EnvironmentConfig {
  baseUrl: string;
  apiBaseUrl: string;
  apiVersion: string;
  timeout: number;
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    baseUrl: 'https://www.pfizerforall.com',
    apiBaseUrl: 'https://dummyjson.com',
    apiVersion: '',          // dummyjson uses root paths — no /api prefix
    timeout: 30000,
  },
  staging: {
    baseUrl: 'https://staging.pfizerforall.com',
    apiBaseUrl: 'https://dummyjson.com',
    apiVersion: '',
    timeout: 45000,
  },
  prod: {
    baseUrl: 'https://www.pfizerforall.com',
    apiBaseUrl: 'https://dummyjson.com',
    apiVersion: '',
    timeout: 60000,
  },
};

// Read the environment from an env variable, default to 'dev'
const currentEnv = process.env.BASE_ENV || 'dev';

export const config: EnvironmentConfig = environments[currentEnv];

// Log which environment is active (helpful in CI logs)
console.log(`Running tests against environment: [${currentEnv.toUpperCase()}] ${config.apiBaseUrl}`);
