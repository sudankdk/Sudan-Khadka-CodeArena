import { server } from '../../../constants/server';
import { ApiClient } from "../client";
import type { 
  IContest,
  IContestProblem,
  IContestParticipant,
  IContestLeaderboardEntry,
  IGlobalLeaderboardEntry,
  ICreateContest,
  IAddProblemToContest,
  IContestsResponse,
  IContestFilters
} from '@/types/contest/contest';

export const contestClient = new ApiClient(server);

// Contest CRUD APIs
export const createContest = async (contest: ICreateContest): Promise<IContest> => {
  const resp = await contestClient.post<{data: IContest}>("/contests", contest);
  console.log("Created Contest:", resp);
  return resp?.data || resp;
}

export const getContestById = async (id: string): Promise<IContest> => {
  const resp = await contestClient.get<{data: IContest}>(`/contests/${id}`);
  console.log("Fetched Contest:", resp);
  return resp?.data || resp;
}

export const listContests = async (
  page: number = 1, 
  pageSize: number = 10,
  filters?: IContestFilters
): Promise<IContestsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  
  const resp = await contestClient.get<any>(`/contests?${params}`);
  console.log("Fetched Contests:", resp);
  
  const contestsData = resp?.data || resp;
  return {
    contests: contestsData?.contests || contestsData || [],
    total: contestsData?.total || 0,
    page: page,
    page_size: pageSize
  };
}

// Contest Problem Management
export const addProblemToContest = async (
  contestId: string, 
  problem: IAddProblemToContest
): Promise<void> => {
  await contestClient.post(`/contests/${contestId}/problems`, problem);
  console.log("Added Problem to Contest:", contestId, problem);
}

export const removeProblemFromContest = async (
  contestId: string, 
  problemId: string
): Promise<void> => {
  await contestClient.delete(`/contests/${contestId}/problems/${problemId}`);
  console.log("Removed Problem from Contest:", contestId, problemId);
}

export const getContestProblems = async (contestId: string): Promise<IContestProblem[]> => {
  const resp = await contestClient.get<{data: IContestProblem[]}>(`/contests/${contestId}/problems`);
  console.log("Fetched Contest Problems:", resp);
  return resp?.data || resp || [];
}

// Participant Management
export const registerForContest = async (contestId: string, userId: string): Promise<void> => {
  await contestClient.post(`/contests/${contestId}/register`, { user_id: userId });
  console.log("Registered for Contest:", contestId);
}

export const unregisterFromContest = async (contestId: string, userId: string): Promise<void> => {
  await contestClient.post(`/contests/${contestId}/unregister`, { user_id: userId });
  console.log("Unregistered from Contest:", contestId);
}

export const checkRegistrationStatus = async (contestId: string, userId: string): Promise<boolean> => {
  const resp = await contestClient.get<{data: {is_registered: boolean}}>(`/contests/${contestId}/registration-status?user_id=${userId}`);
  console.log("Registration Status:", resp);
  return resp?.data?.is_registered || false;
}

export const getContestParticipants = async (contestId: string): Promise<IContestParticipant[]> => {
  const resp = await contestClient.get<{data: IContestParticipant[]}>(`/contests/${contestId}/participants`);
  console.log("Fetched Contest Participants:", resp);
  return resp?.data || resp || [];
}

// Leaderboard APIs
export const getContestLeaderboard = async (
  contestId: string, 
  limit: number = 100
): Promise<IContestLeaderboardEntry[]> => {
  const resp = await contestClient.get<{data: IContestLeaderboardEntry[]}>(
    `/contests/${contestId}/leaderboard?limit=${limit}`
  );
  console.log("Fetched Contest Leaderboard:", resp);
  return resp?.data || resp || [];
}

export const getGlobalLeaderboard = async (limit: number = 100): Promise<IGlobalLeaderboardEntry[]> => {
  const resp = await contestClient.get<{data: IGlobalLeaderboardEntry[]}>(
    `/leaderboard/global?limit=${limit}`
  );
  console.log("Fetched Global Leaderboard:", resp);
  return resp?.data || resp || [];
}

// Admin APIs
export const finalizeContestRankings = async (contestId: string): Promise<void> => {
  await contestClient.post(`/contests/${contestId}/finalize`);
  console.log("Finalized Contest Rankings:", contestId);
}
