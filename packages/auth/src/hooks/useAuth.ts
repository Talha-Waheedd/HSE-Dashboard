import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import { authClient, configureTokenRefresh, tokenStore } from "@cbl/api";

const PREVIEW_BYPASS = import.meta.env.VITE_BYPASS_AUTH === "true";
const PREVIEW_USER = {
  id: "preview-user",
  email: "preview@cbl-lu-sukkur.local",
  name: "UI Preview User",
  role: "System Administrator",
  roles: ["System Administrator"],
  permissions: [
    "dashboard.view", "hazards.create", "hazards.update", "hazards.delete",
    "reports.export", "records.approve",
  ],
  department_id: "All",
  plant_id: "CBL-LU-SUKKUR",
};


export const useAuth = () => {
  const { instance } = useMsal();
  const { isAuthenticated, user, token, loginUser, clearAuth, hasRole } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  configureTokenRefresh(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return null;
    const tokens = await authClient.refresh(refreshToken);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) loginUser(currentUser, tokens.accessToken);
    return tokens.accessToken;
  });

  const login = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      if (PREVIEW_BYPASS) {
        loginUser(PREVIEW_USER);
        return;
      }

      // 1. Authenticate with Microsoft
      const loginResponse = await instance.loginPopup({
        scopes: ["user.read"],
      });

      const email = loginResponse.account?.username;
      
      if (!email) {
        throw new Error("Could not retrieve email from Microsoft account");
      }

      // 2. Verify with Ali's Live Backend
      const verifyResponse = await authClient.verifyEmail(email);

      if (!verifyResponse.authorized || !verifyResponse.user || !verifyResponse.tokens) {
        throw new Error("User not authorized in CBL system or no token received");
      }

      // 3. Set User securely
      const backendUser = verifyResponse.user;
      const authUser = {
        id: backendUser.id.toString(),
        email: backendUser.email,
        name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
        role: backendUser.role || (backendUser.roles?.[0]) || 'Viewer',
        roles: backendUser.roles,
        permissions: backendUser.permissions,
        department_id: backendUser.department_id?.toString() || backendUser.departmentId?.toString(),
        plant_id: backendUser.plant_id?.toString() || backendUser.plantId?.toString()
      };

      loginUser(authUser, verifyResponse.tokens.accessToken);
    } catch (e: any) {
      console.error("Login Error:", e);
      setError(e.message || "Failed to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    if (PREVIEW_BYPASS) {
      clearAuth();
      return;
    }

    try {
      await authClient.logout();
    } catch (e) {
      console.error("Backend logout error:", e);
    }
    instance.logoutPopup().catch(console.error);
    clearAuth();
  };

  return {
    login,
    logout,
    isLoggingIn,
    isAuthenticated,
    user,
    token,
    error,
    hasRole
  };
};
