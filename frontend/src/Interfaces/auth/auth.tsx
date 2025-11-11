import React from "react";
import type { User } from "../../types/user/user.types";

export interface IAuth {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
}

export interface IUserRegister {
  username: string;
  email: string;
  password: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface AuthLayoutProp {
  children: React.ReactNode;
}
