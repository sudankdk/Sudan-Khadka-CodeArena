import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../../services/auth/api/auth";
import useAuthStore from "../../services/auth/store/auth.store";

const OAuth = () => {
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const token = useMemo(() => {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const search = new URLSearchParams(location.search);
    return hash.get("token") || search.get("token");
  }, [location.hash, location.search]);

  useEffect(() => {
    const authSuccess = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      setToken(token);
      const res = await authClient.get<{ user: any }>("/users/me");

      if (res.user?.role === "regular") {
        setUser(res.user);
        navigate("/dashboard", { replace: true });
      } else if (res.user?.role === "admin") {
        setUser(res.user);
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    authSuccess();
  }, [navigate, setToken, setUser, token]);

  return <p>Authenticating...</p>;
};

export default OAuth;