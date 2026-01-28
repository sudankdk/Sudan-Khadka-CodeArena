import { server } from "../../../const/server";
import { ApiClient } from "../client";
import type { IProblemTest } from "@/Interfaces/problemstest/problemtest";

export const problemtestClient = new ApiClient(server);

export const createProblemTest = async (problemtest: IProblemTest)=>{
   const resp = await problemtestClient.post<IProblemTest>("/problems",problemtest);
   console.log("Created Problem Test:",resp);
   return resp;
}

export interface ProblemTestsResponse {
  problems: IProblemTest[];
  total: number;
  page: number;
  page_size: number;
}

export const getProblemTests = async (page: number = 1, pageSize: number = 10): Promise<ProblemTestsResponse> => {
    const resp = await problemtestClient.get<any>(`/problems?test-cases=true&page=${page}&page_size=${pageSize}`);
    console.log("Fetched Problem Tests:", resp);
    return {
      problems: resp?.data?.problems || [],
      total: resp?.data?.total || 0,
      page: resp?.data?.page || 1,
      page_size: resp?.data?.page_size || pageSize
    };
}

export const getProblemTestBySlug = async (slug: string): Promise<IProblemTest> => {
  const resp = await problemtestClient.get<IProblemTest>(`/problems/slug/${slug}?include_tc=true`);
  console.log("Fetched Problem Test by Slug:", resp);
  return resp;
}

export const filteredProblemsByDifficulty = async (difficulty: string): Promise<IProblemTest[]> => {
  const resp = await problemtestClient.get<IProblemTest[]>(`/problems?difficulty=${difficulty}`);
  console.log("Fetched Filtered Problems:", resp);
  return resp;
}