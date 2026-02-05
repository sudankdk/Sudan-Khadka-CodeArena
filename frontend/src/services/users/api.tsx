import { server } from '@/constants/server';
import { ApiClient } from "../auth/client";

export const userClient = new ApiClient(server);

export const fetchUserList = async (): Promise<any> => {
  return await userClient.get("/users");
};
