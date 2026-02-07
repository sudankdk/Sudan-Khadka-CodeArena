import { server } from '../../../constants/server';
import { ApiClient } from "../client";
import type { 
  ICreateSubmission, 
  ISubmission, 
  IUserStats, 
  IProblemStats,
  ITopicStats,
  ISubmissionsResponse
} from '@/types/submission/submission';

export const submissionClient = new ApiClient(server);

export const createSubmission = async (submission: ICreateSubmission) => {
  const resp = await submissionClient.post<{data: ISubmission}>("/submissions", submission);
  console.log("Created Submission:", resp);
  return resp?.data || resp;
}

export const getSubmissionById = async (id: string): Promise<ISubmission> => {
  const resp = await submissionClient.get<{data: ISubmission}>(`/submissions/${id}`);
  console.log("Fetched Submission:", resp);
  return resp?.data || resp;
}

export const listSubmissions = async (
  page: number = 1, 
  pageSize: number = 20,
  filters?: {
    user_id?: string;
    problem_id?: string;
    status?: string;
    language?: string;
  }
): Promise<ISubmissionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    ...filters
  });
  
  const resp = await submissionClient.get<ISubmissionsResponse>(`/submissions?${params}`);
  console.log("Fetched Submissions:", resp);
  return resp;
}

export const getUserStats = async (): Promise<IUserStats> => {
  const resp = await submissionClient.get<{data: IUserStats}>("/submissions/stats/user");
  console.log("Fetched User Stats:", resp);
  return resp?.data || resp;
}

export const getProblemStats = async (problemId: string): Promise<IProblemStats> => {
  const resp = await submissionClient.get<{data: IProblemStats}>(`/submissions/stats/problem/${problemId}`);
  console.log("Fetched Problem Stats:", resp);
  return resp?.data || resp;
}

export const getTopicStats = async (): Promise<ITopicStats[]> => {
  const resp = await submissionClient.get<{data: ITopicStats[]}>("/stats/topics");
  console.log("Fetched Topic Stats:", resp);
  return resp?.data || [];
}
