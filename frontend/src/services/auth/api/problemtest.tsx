import { server } from '../../../constants/server';
import { ApiClient } from "../client";
import type { IProblemTest } from '@/types/problemstest/problemtest';

export const problemtestClient = new ApiClient(server);

export const createProblemTest = async (problemtest: IProblemTest) => {
  const resp = await problemtestClient.post<IProblemTest>("/problems", problemtest);
  console.log("Created Problem Test:", resp);
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
  console.log("Fetched Problem Tests Response:", resp);

  // Handle the case where the data might be at resp.data or just in resp
  const responseData = resp?.data || resp;
  const problems = responseData?.problems || [];
  const total = responseData?.total || 0;

  return {
    problems: Array.isArray(problems) ? problems : [],
    total: Number(total),
    page: Number(responseData?.page || page),
    page_size: Number(responseData?.page_size || pageSize)
  };
}

export const getProblemTestBySlug = async (slug: string): Promise<IProblemTest> => {
  const resp = await problemtestClient.get<any>(`/problems/slug/${slug}?include_tc=true`);
  console.log("Fetched Problem Test by Slug:", resp);
  // Handle both wrapped and unwrapped responses
  return resp?.data || resp;
}

export const filteredProblemsByDifficulty = async (difficulty: string): Promise<IProblemTest[]> => {
  const resp = await problemtestClient.get<any>(`/problems?difficulty=${difficulty}`);
  console.log("Fetched Filtered Problems:", resp);
  return resp?.data?.problems || [];
}