import { server } from "../../../const/server";
import type { IUserLogin, IUserRegister } from "../../../Interfaces/auth/auth";
import { ApiClient } from "../client";

export const authClient = new ApiClient(server);

export const registerUser = async (data: IUserRegister): Promise<any> => {
  return await authClient.post("/users/register", data);
};

export const loginUser = async (data: IUserLogin): Promise<any> => {
  return await authClient.post("/users/login", data);
};
