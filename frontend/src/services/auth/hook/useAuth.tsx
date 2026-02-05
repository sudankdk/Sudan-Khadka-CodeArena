import { useState } from "react";
import useAuthStore from "../store/auth.store";
import { loginUser, logoutUser, registerUser } from "../api/auth";
import type { IUserLogin, IUserRegister } from '../../../types/auth/auth';

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { setToken, setUser, clear } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const login = async (data: IUserLogin) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(data);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (error: any) {
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
      setUser(res.data);
    } catch (error: any) {
      console.log(error);
      setError(error.response?.data?.message || "register failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      clear();
    } catch (error: any) {
      console.log(error);
      setError(error.response?.data?.message || "logout failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  return { login, loading, error, register, logout, setError };
};
