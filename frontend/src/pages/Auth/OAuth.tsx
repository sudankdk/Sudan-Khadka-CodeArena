import React, { useEffect } from "react";
import { authClient } from "../../services/auth/api/auth";
import useAuthStore from "../../services/auth/store/auth.store";
import { useNavigate } from "react-router-dom";

const OAuth = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
    const authSuccess = async () => {
      const res = await authClient.get("/users/me");
      console.log(res);
      if (res.user) {
        setUser(res.user);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    authSuccess();
  }, []);
  return <p>Authenticating...</p>;
};

export default OAuth;
