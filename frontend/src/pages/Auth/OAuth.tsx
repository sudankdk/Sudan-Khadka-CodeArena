import { useEffect } from "react";
import { authClient } from "../../services/auth/api/auth";
import useAuthStore from "../../services/auth/store/auth.store";
import { useNavigate } from "react-router-dom";

const OAuth = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
    const authSuccess = async () => {
      const res = await authClient.get<{ user: any }>("/users/me");
      console.log(res);
      if (res.user && res.user.role == "regular") {
        setUser(res.user);
        navigate("/dashboard", { replace: true });
      } else if (res.user && res.user.role == "admin") {
        setUser(res.user);
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    authSuccess();
  }, []);
  return <p>Authenticating...</p>;
};

export default OAuth;
