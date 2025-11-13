import { useEffect } from "react";
import useAuthStore from "../store/auth.store";
import { authClient } from "../api/auth";

export const useLoadUser = () => {
  const { setUser, clear, setLoading } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authClient.get("/users/me");
        setUser(res.data.user);
      } catch {
        clear();
      } finally {
        setLoading(false); // ✅ mark loading complete
      }
    };

    fetchUser();
  }, [setUser, clear, setLoading]);
};
