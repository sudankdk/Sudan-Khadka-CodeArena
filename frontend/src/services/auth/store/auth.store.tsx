import { create } from "zustand";
import { authClient } from "../api/auth"; // ← Add this import
import type { IAuth } from "../../../Interfaces/auth/auth";
import type { User } from "../../../types/user/user.types";

const useAuthStore = create<IAuth>((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  setUser: (user: User | null) => set({ user }),

  setToken: (token: string | null) => set({ token }),

  clear: () => set({ user: null, token: null }),

  initialize: async () => {
    set({ loading: true });
    try {
      const response = await authClient.get("/users/me");
      set({ user: response.user, loading: false, error: null });
    } catch (error) {
      set({ user: null, loading: false, error: null });
    }
  },
}));

export default useAuthStore;
