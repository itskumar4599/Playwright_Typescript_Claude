import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { Endpoints, QueryParams } from '../endpoints/endpoints';
import { config } from '../../config/environments';

// Request models
import { CreateUserRequest, UpdateUserRequest, PatchUserRequest } from '../models/request/UserRequest';
import { LoginRequest } from '../models/request/AuthRequest';

// Response models
import {
  ListUsersResponse,
  SingleUserResponse,
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
} from '../models/response/UserResponse';
import { LoginResponse, AuthMeResponse, AuthErrorResponse } from '../models/response/AuthResponse';
import { ApiResponse } from './BaseApiClient';

/**
 * DummyJsonApiClient — Service Layer for dummyjson.com
 *
 * File kept as ReqresApiClient.ts to avoid breaking existing imports,
 * but internally this targets dummyjson.com.
 *
 * CONCEPT: Service Layer / Facade Pattern
 * ─────────────────────────────────────────────────────────────────
 * Tests don't know about URLs, HTTP verbs, or JSON structure.
 * The client wraps all of that into readable business methods.
 *
 * BEFORE (bad — test knows too much about HTTP):
 *   const res = await request.post('/users/add', { data: { firstName, email } })
 *
 * AFTER (good — test reads like a user story):
 *   const res = await apiClient.createUser({ firstName: 'John', email: '...' })
 *
 * Interview Tip: This is the Facade Pattern.
 * "I hide the HTTP complexity behind a simple domain-language API."
 *
 * dummyjson.com — Free public REST API, no key required.
 * Docs: https://dummyjson.com/docs
 */
export class ReqresApiClient extends BaseApiClient {

  constructor(request: APIRequestContext) {
    super(request, `${config.apiBaseUrl}${config.apiVersion}`);
  }

  // ──────────────────────────────────────────────────────────
  // USER OPERATIONS
  // ──────────────────────────────────────────────────────────

  /**
   * GET all users — with offset-based pagination
   * dummyjson uses skip/limit (not page/per_page)
   *
   * Interview Tip: Two pagination styles:
   * Page-based:   ?page=2 (reqres style)
   * Offset-based: ?skip=10&limit=10 (dummyjson / SQL style)
   */
  async getUsers(limit: number = 10, skip: number = 0): Promise<ApiResponse<ListUsersResponse>> {
    return this.get<ListUsersResponse>(Endpoints.USERS, {
      params: {
        [QueryParams.LIMIT]: limit,
        [QueryParams.SKIP]: skip,
      },
    });
  }

  /**
   * GET a single user by ID
   */
  async getUserById(id: number): Promise<ApiResponse<SingleUserResponse>> {
    return this.get<SingleUserResponse>(Endpoints.USER_BY_ID(id));
  }

  /**
   * POST /users/add — Create a new user
   * dummyjson uses /users/add (not just /users) for creation
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<CreateUserResponse>> {
    return this.post<CreateUserResponse>(Endpoints.CREATE_USER, userData);
  }

  /**
   * PUT — Full update (replace all fields)
   */
  async updateUser(id: number, userData: UpdateUserRequest): Promise<ApiResponse<UpdateUserResponse>> {
    return this.put<UpdateUserResponse>(Endpoints.USER_BY_ID(id), userData);
  }

  /**
   * PATCH — Partial update (only changed fields)
   */
  async patchUser(id: number, userData: PatchUserRequest): Promise<ApiResponse<UpdateUserResponse>> {
    return this.patch<UpdateUserResponse>(Endpoints.USER_BY_ID(id), userData);
  }

  /**
   * DELETE a user
   * dummyjson returns 200 + { isDeleted: true } — NOT 204 No Content.
   * Interview Tip: Always read the API docs. DELETE returning 200 vs 204
   * is a design choice — both are valid REST.
   */
  async deleteUser(id: number): Promise<ApiResponse<DeleteUserResponse>> {
    return this.delete<DeleteUserResponse>(Endpoints.USER_BY_ID(id));
  }

  // ──────────────────────────────────────────────────────────
  // AUTH OPERATIONS
  // ──────────────────────────────────────────────────────────

  /**
   * POST /auth/login — Authenticate with username + password
   * Returns accessToken + refreshToken + user profile
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse | AuthErrorResponse>> {
    return this.post<LoginResponse | AuthErrorResponse>(Endpoints.LOGIN, credentials);
  }

  /**
   * GET /auth/me — Get authenticated user's profile
   * Requires Authorization: Bearer <accessToken> header to be set first.
   *
   * Interview Tip: This tests a PROTECTED endpoint.
   * Without a valid token → 401 Unauthorized
   * With a valid token → 200 + user profile
   */
  async getAuthenticatedUser(): Promise<ApiResponse<AuthMeResponse>> {
    return this.get<AuthMeResponse>(Endpoints.AUTH_ME);
  }
}
