import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * BaseApiClient — The Core API Layer
 *
 * CONCEPT: This is the API equivalent of BasePage from UI automation.
 * Every HTTP method (GET, POST, PUT, PATCH, DELETE) lives here.
 *
 * WHY a base client? (Interview Answer)
 * ─────────────────────────────────────────────────────────────────
 * 1. DRY — Don't repeat headers/auth/logging in every test
 * 2. Central error handling — one place to log failures
 * 3. Easy to add auth headers globally (e.g., Bearer token)
 * 4. Testable in isolation — mock this layer for unit tests
 *
 * Playwright's APIRequestContext vs Axios/Fetch:
 * ─────────────────────────────────────────────────────────────────
 * - APIRequestContext is built into Playwright — no extra install
 * - Shares cookies/storage with the browser context automatically
 * - Can be used for both standalone API tests AND within UI tests
 * - Supports all standard HTTP methods and multipart/file uploads
 *
 * Interview Tip: "Why Playwright for API testing over Postman?"
 * Playwright lets you COMBINE UI + API in one test. Example:
 * Create a user via API → verify in UI. Or click UI → assert API call.
 */

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
}

export interface ApiResponse<T> {
  status: number;
  body: T;
  headers: Record<string, string>;
  ok: boolean;
}

export class BaseApiClient {

  // Playwright's request context — the HTTP engine
  protected readonly request: APIRequestContext;

  // Base URL — e.g. https://reqres.in/api
  protected readonly baseUrl: string;

  // Default headers applied to every request (auth, content-type, etc.)
  protected defaultHeaders: Record<string, string>;

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Set a Bearer token for all subsequent requests
   * Call this after login to authenticate remaining requests.
   *
   * Interview Tip: "How do you handle authenticated API testing?"
   * 1. Call the login endpoint to get a token
   * 2. Set the token via setAuthToken()
   * 3. All subsequent requests will carry the Authorization header
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove the auth token (for testing unauthenticated scenarios)
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Set a custom header for all requests (e.g., API Key, x-client-id)
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  // ─────────────────────────────────────────────────────────────
  // HTTP Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * GET — Retrieve data (no request body, idempotent)
   *
   * Interview Tip: GET is SAFE + IDEMPOTENT
   * Safe = doesn't change server state
   * Idempotent = calling it 100 times = same result as calling once
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    this.logRequest('GET', url, options);

    const response = await this.request.get(url, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      params: options?.params as Record<string, string>,
      timeout: options?.timeout,
    });

    return this.parseResponse<T>(response);
  }

  /**
   * POST — Create a new resource (has request body, NOT idempotent)
   *
   * Interview Tip: POST is NOT idempotent
   * Calling POST 3 times creates 3 separate resources.
   * This is why "retry on failure" is dangerous with POST.
   */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    this.logRequest('POST', url, options, body);

    const response = await this.request.post(url, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      data: body,
      timeout: options?.timeout,
    });

    return this.parseResponse<T>(response);
  }

  /**
   * PUT — Full replacement of a resource (idempotent)
   *
   * Interview Tip: PUT vs PATCH
   * PUT   → Send ALL fields. Missing fields get nulled/reset.
   * PATCH → Send ONLY the fields you want to change.
   */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    this.logRequest('PUT', url, options, body);

    const response = await this.request.put(url, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      data: body,
      timeout: options?.timeout,
    });

    return this.parseResponse<T>(response);
  }

  /**
   * PATCH — Partial update (only send changed fields)
   */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    this.logRequest('PATCH', url, options, body);

    const response = await this.request.patch(url, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      data: body,
      timeout: options?.timeout,
    });

    return this.parseResponse<T>(response);
  }

  /**
   * DELETE — Remove a resource (idempotent)
   *
   * Interview Tip: DELETE is idempotent — deleting a resource
   * that's already gone returns 404, but the INTENT is fulfilled.
   * Expected response is 204 No Content (no body).
   */
  async delete<T = void>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    this.logRequest('DELETE', url, options);

    const response = await this.request.delete(url, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      timeout: options?.timeout,
    });

    return this.parseResponse<T>(response);
  }

  // ─────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Build the full URL from base + endpoint
   */
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Parse a Playwright APIResponse into our typed ApiResponse<T>
   *
   * NOTE: We use a try/catch here because some responses (204 No Content,
   * some 404s) don't have a JSON body — parsing them would throw.
   */
  private async parseResponse<T>(response: APIResponse): Promise<ApiResponse<T>> {
    let body: T;

    try {
      body = await response.json() as T;
    } catch {
      // No body (e.g. 204 No Content) or non-JSON body
      body = {} as T;
    }

    const result: ApiResponse<T> = {
      status: response.status(),
      body,
      headers: response.headers(),
      ok: response.ok(),
    };

    this.logResponse(result);
    return result;
  }

  /**
   * Log request details — visible in test output for debugging
   */
  private logRequest(method: string, url: string, options?: RequestOptions, body?: unknown): void {
    console.log(`\n→ ${method} ${url}`);
    if (options?.params) console.log('  Params:', JSON.stringify(options.params));
    if (body) console.log('  Body:', JSON.stringify(body, null, 2));
  }

  /**
   * Log response details
   */
  private logResponse<T>(response: ApiResponse<T>): void {
    const statusEmoji = response.ok ? '✓' : '✗';
    console.log(`← ${statusEmoji} Status: ${response.status}`);
    if (!response.ok) {
      console.log('  Response Body:', JSON.stringify(response.body, null, 2));
    }
  }
}
