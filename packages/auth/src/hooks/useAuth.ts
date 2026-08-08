import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect } from "react";
import { authClient, configureTokenRefresh, tokenStore } from "@cbl/api";
import { InteractionStatus } from "@azure/msal-browser";

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
  const { instance, accounts, inProgress } = useMsal();
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

  // Handle redirect response natively
  useEffect(() => {
    const handleRedirect = async () => {
      if (PREVIEW_BYPASS) return;

      if (inProgress === InteractionStatus.None && accounts.length > 0 && !isAuthenticated && !error) {
        setIsLoggingIn(true);
        // We do NOT clear error here unless we explicitly retry, to prevent loops
        try {
          const account = accounts[0];
          const email = account.username;
          if (!email) {
            throw new Error("Could not retrieve email from Microsoft account");
          }
          
          let msalToken: string | undefined = undefined;
          try {
            const tokenResponse = await instance.acquireTokenSilent({
              scopes: ["user.read"],
              account: account
            });
            msalToken = tokenResponse.idToken;
          } catch (e) {
            console.warn("Silent token acquisition failed.", e);
            throw new Error("Unable to verify Microsoft identity. Please retry sign-in.");
          }

          const verifyResponse = await authClient.verifyEmail(email, msalToken);

          if (!verifyResponse.authorized || !verifyResponse.user || !verifyResponse.tokens) {
            throw new Error("User not authorized in CBL system or no token received");
          }

          const backendUser = verifyResponse.user;
          const roleName = typeof backendUser.role === 'object'
            ? backendUser.role?.name
            : backendUser.role;
          const rolePermissions = typeof backendUser.role === 'object'
            ? backendUser.role?.permissions?.map((p) => p.key)
            : undefined;
          const authUser = {
            id: backendUser.id.toString(),
            email: backendUser.email,
            name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
            role: roleName || backendUser.roles?.[0] || 'Viewer',
            roles: backendUser.roles,
            permissions: backendUser.permissions || rolePermissions || [],
            department_id: backendUser.department_id?.toString() || backendUser.departmentId?.toString(),
            plant_id: backendUser.plant_id?.toString() || backendUser.plantId?.toString()
          };

          loginUser(authUser, verifyResponse.tokens.accessToken);
        } catch (e: any) {
          console.error("Backend Verification Error:", e);
          
          if (e.message?.includes("User not authorized")) {
            setError("Your Microsoft email is not registered in the system. Please contact the administrator.");
          } else {
            setError(e.message || "Failed to verify user with CBL system");
          }
        } finally {
          setIsLoggingIn(false);
        }
      }
    };

    handleRedirect();
  }, [inProgress, accounts, isAuthenticated, instance, loginUser, error]);

  const login = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      if (PREVIEW_BYPASS) {
        loginUser(PREVIEW_USER);
        return;
      }

      // NO POPUPS! Redirect the whole page
      await instance.loginRedirect({
        scopes: ["user.read"],
        prompt: "select_account"
      });
    } catch (e: any) {
      console.error("Login Error:", e);
      setError(e.message || "Failed to initiate login");
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
    await instance.logoutRedirect();
    clearAuth();
  };

  return {
    login,
    logout,
    isLoggingIn: isLoggingIn || inProgress !== InteractionStatus.None,
    isAuthenticated,
    user,
    token,
    error,
    hasRole
  };
};
