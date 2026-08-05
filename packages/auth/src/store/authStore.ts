import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { tokenStore } from "@cbl/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles?: string[];
  permissions?: string[];
  department_id?: string;
  plant_id?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  loginUser: (user: User, token?: string) => void;
  clearAuth: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token: string) => {
        try {
          const decodedUser = jwtDecode<User>(token);
          tokenStore.setTokens({ accessToken: token });
          set({ token, user: decodedUser, isAuthenticated: true });
        } catch (error) {
          console.error("Invalid token", error);
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      loginUser: (user: User, token?: string) => {
        if (token) tokenStore.setTokens({ accessToken: token });
        set({ user, token: token || null, isAuthenticated: true });
      },

      clearAuth: () => {
        tokenStore.clear();
        set({ token: null, user: null, isAuthenticated: false });
      },

      hasRole: (role: string) => {
        const user = get().user;
        if (!user || !user.role) return false;
        return user.role.toLowerCase() === role.toLowerCase();
      },

      hasPermission: (permission: string) => Boolean(
        get().user?.permissions?.some((item) => item.toLowerCase() === permission.toLowerCase())
      ),
    }));
