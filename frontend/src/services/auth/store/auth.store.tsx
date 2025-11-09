import { create } from "zustand";
import type { IAuth } from "../../../Interfaces/auth/auth";

 const useAuthStore  = create<IAuth>((set)=>({
    loading:false,
    token : null,
  setLoading: (loading: boolean) => set({ loading }),
  setToken: (token: string | null) => set({ token }),
}))


export default useAuthStore