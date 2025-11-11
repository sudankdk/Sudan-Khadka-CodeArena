import { create } from "zustand";
import type { IAuth } from "../../../Interfaces/auth/auth";
import type { User } from "../../../types/user/user.types";

 const useAuthStore  = create<IAuth>((set)=>({
    token: null,
    user: null,
    setUser: (user:User | null)=>set({user}),
    setToken: (token: string | null) => set({ token }),
    clear: () => set({ user: null, token: null }),
}))


export default useAuthStore