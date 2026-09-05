import { apiClient } from "./client";
import { tokenStore } from "./tokenStore";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string | { name?: string; permissions?: Array<{ key: string }> };
  roles?: string[];
  permissions?: string[];
  department_id?: string;
  departmentId?: string;
  plant_id?: string;
  plantId?: string;
  employeeProfile?: {
    departmentId?: string;
    plantId?: string;
    department?: { id?: string };
    plant?: { id?: string };
  };
  [key: string]: unknown;
}

const unwrap = <T>(payload: any): T => payload?.data ?? payload;

export const authClient = {
  async verifyEmail(email: string, msalToken?: string) {
    const response = await apiClient.post("/auth/verify-email", { email, msalToken });
    return unwrap<{ authorized: boolean; email: string; user?: BackendUser; tokens?: AuthTokens }>(response.data);
  },

  async login(email: string, password: string) {
    const response = await apiClient.post("/auth/login", { email, password });
    const result = unwrap<{ user: BackendUser; tokens: AuthTokens }>(response.data);
    tokenStore.setTokens(result.tokens);
    return result;
  },

  async refresh(refresh: string) {
    const response = await apiClient.post("/auth/refresh-token", { refreshToken: refresh });
    const result = unwrap<{ tokens: AuthTokens }>(response.data);
    tokenStore.setTokens(result.tokens);
    return result.tokens;
  },

  async me() {
    const response = await apiClient.get("/auth/me");
    return unwrap<BackendUser>(response.data);
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },
};
