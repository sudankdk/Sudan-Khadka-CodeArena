import { server } from "@/constants/server";
import { ApiClient } from "../client";

const client = new ApiClient(server);

export interface HintRequest {
  problem_title: string;
  problem_desc: string;
  difficulty: string;
  user_code: string;
  hint_level: number;
}

export interface HintResponse {
  hint: string;
  level: number;
}

export const getHint = async (req: HintRequest): Promise<HintResponse> => {
  return client.post<HintResponse>("/hints", req);
};
