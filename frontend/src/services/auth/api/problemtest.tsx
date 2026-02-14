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

export const getProblemTests = async (
  page: number = 1, 
  pageSize: number = 10, 
  search?: string
): Promise<ProblemTestsResponse> => {
  let url = `/problems?test-cases=true&page=${page}&page_size=${pageSize}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  const resp = await problemtestClient.get<any>(url);
  console.log("Fetched Problem Tests Full Response:", resp);
  
  // Response structure is { message: string, data: ProblemListResponse }
  // ApiClient already unwraps axios response.data, so resp is the fiber.Map
  const problemListData = resp?.data || resp;
  console.log("Problem List Data:", problemListData);
  
  const problems = problemListData?.problems || [];
  console.log("Problems array (should have boilerplates):", problems);
  console.log("First problem boilerplates:", problems[0]?.boilerplates);
  
  const total = problemListData?.total || 0;

  return {
    problems: Array.isArray(problems) ? problems : [],
    total: Number(total),
    page: Number(problemListData?.page || page),
    page_size: Number(problemListData?.page_size || pageSize)
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

export const deleteProblemTest = async (id: string) => {
  const resp = await problemtestClient.delete(`/problems/${id}`);
  console.log("Deleted Problem Test:", resp);
  return resp;
}

export const updateProblemTest = async (id: string, problemtest: Partial<IProblemTest>) => {
  const resp = await problemtestClient.put<IProblemTest>(`/problems/${id}`, problemtest);
  console.log("Updated Problem Test:", resp);
  return resp;
}
