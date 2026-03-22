import { create } from "zustand";
import { authClient } from "../api/auth"; // ← Add this import
import type { IAuth } from '../../../types/auth/auth';
import type { User } from "../../../types/user/user.types";

const useAuthStore = create<IAuth>((set) => ({
  token: null,
  user: null,
  loading: true,
  error: null,

  setUser: (user: User | null) => set({ user }),

  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
    set({ token });
  },

  clear: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, token: null });
  },

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const stored = localStorage.getItem("auth_token");
      if (stored) {
        set({ token: stored });
      }

      const token = stored || useAuthStore.getState().token;
      if (!token) {
        set({ user: null, loading: false, error: null });
        return;
      }

      const response = await authClient.get<{ user: User }>("/users/me");
      set({ user: response.user, loading: false, error: null });
    } catch (error: any) {
      console.error("Auth initialization error:", error);
      set({ user: null, loading: false, error: error.message || "Failed to initialize auth" });
    }
  },
}));

export default useAuthStore;
