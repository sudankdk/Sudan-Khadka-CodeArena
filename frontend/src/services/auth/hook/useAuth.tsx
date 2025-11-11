import { useState } from "react";
import useAuthStore from "../store/auth.store";
import { loginUser, registerUser } from "../api/auth";
import type { IUserLogin, IUserRegister } from "../../../Interfaces/auth/auth";

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { setToken, setUser, clear } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const login = async (data: IUserLogin) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(data);
      setToken(res.data);
    } catch (error: any) {
      console.log(error);
      setError(error.response?.data?.message || "login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: IUserRegister) => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerUser(data);
      console.log(res);
      setUser(res.data);
    } catch (error: any) {
      console.log(error);
      setError(error.response?.data?.message || "register failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    try {
      clear();
    } catch (error: any) {
      console.log(error);
      setError(error.response?.data?.message || "logout failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  return { login, loading, error, register, logout,setError };
};
