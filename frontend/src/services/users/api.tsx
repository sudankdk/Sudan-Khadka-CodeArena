import { server } from '@/constants/server';
import { ApiClient } from "../auth/client";

export const userClient = new ApiClient(server);

export interface AdminUserPayload {
  username: string;
  email: string;
  password?: string;
  role?: "admin" | "regular";
  rating?: number;
  matches_played?: number;
  matches_won?: number;
  submissions_count?: number;
  solved_count?: number;
  bio?: string;
  language_preference?: string;
}

export interface UserProfilePayload {
  username?: string;
  email?: string;
  password?: string;
  bio?: string;
  language_preference?: string;
  profile_image?: string;
}

export interface AdminUserStats {
  total_users: number;
  admin_users: number;
  regular_users: number;
  average_rating: number;
  total_matches: number;
  total_wins: number;
  total_solved: number;
  active_this_month: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export const fetchUserList = async (): Promise<ApiResponse<any>> => {
  return await userClient.get("/admin/users");
};

export const fetchUserStats = async (): Promise<ApiResponse<AdminUserStats>> => {
  return await userClient.get("/admin/users/stats");
};

export const createUser = async (payload: AdminUserPayload): Promise<ApiResponse<any>> => {
  return await userClient.post("/admin/users", payload);
};

export const updateUser = async (id: string, payload: Partial<AdminUserPayload>): Promise<ApiResponse<any>> => {
  return await userClient.put(`/admin/users/${id}`, payload);
};

export const updateMyProfile = async (payload: UserProfilePayload): Promise<ApiResponse<any>> => {
  return await userClient.put("/users/me", payload);
};
