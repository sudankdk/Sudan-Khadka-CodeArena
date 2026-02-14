import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  createContest,
  getContestById,
  listContests,
  addProblemToContest,
  removeProblemFromContest,
  getContestProblems,
  registerForContest,
  unregisterFromContest,
  checkRegistrationStatus,
  getContestParticipants,
  getContestLeaderboard,
  getGlobalLeaderboard,
  finalizeContestRankings
} from '@/services/auth/api/contest';
import type { 
  ICreateContest, 
  IAddProblemToContest,
  IContestFilters 
} from '@/types/contest/contest';

// Query Keys
export const contestKeys = {
  all: ['contests'] as const,
  lists: () => [...contestKeys.all, 'list'] as const,
  list: (filters?: IContestFilters) => [...contestKeys.lists(), filters] as const,
  details: () => [...contestKeys.all, 'detail'] as const,
  detail: (id: string) => [...contestKeys.details(), id] as const,
  problems: (id: string) => [...contestKeys.detail(id), 'problems'] as const,
  participants: (id: string) => [...contestKeys.detail(id), 'participants'] as const,
  leaderboard: (id: string) => [...contestKeys.detail(id), 'leaderboard'] as const,
  globalLeaderboard: () => [...contestKeys.all, 'global-leaderboard'] as const,
};

// List Contests Hook
export const useContests = (
  page: number = 1,
  pageSize: number = 10,
  filters?: IContestFilters
) => {
  return useQuery({
    queryKey: [...contestKeys.list(filters), page, pageSize],
    queryFn: () => listContests(page, pageSize, filters),
  });
};

// Get Contest by ID Hook
export const useContest = (id: string) => {
  return useQuery({
    queryKey: contestKeys.detail(id),
    queryFn: () => getContestById(id),
    enabled: !!id,
  });
};

// Get Contest Problems Hook
export const useContestProblems = (contestId: string) => {
  return useQuery({
    queryKey: contestKeys.problems(contestId),
    queryFn: () => getContestProblems(contestId),
    enabled: !!contestId,
  });
};

// Get Contest Participants Hook
export const useContestParticipants = (contestId: string) => {
  return useQuery({
    queryKey: contestKeys.participants(contestId),
    queryFn: () => getContestParticipants(contestId),
    enabled: !!contestId,
  });
};

// Check Registration Status Hook
export const useRegistrationStatus = (contestId: string, userId: string) => {
  return useQuery({
    queryKey: [...contestKeys.detail(contestId), 'registration', userId],
    queryFn: () => checkRegistrationStatus(contestId, userId),
    enabled: !!contestId && !!userId,
  });
};

// Get Contest Leaderboard Hook
export const useContestLeaderboard = (contestId: string, limit: number = 100) => {
  return useQuery({
    queryKey: [...contestKeys.leaderboard(contestId), limit],
    queryFn: () => getContestLeaderboard(contestId, limit),
    enabled: !!contestId,
  });
};

// Get Global Leaderboard Hook
export const useGlobalLeaderboard = (limit: number = 100) => {
  return useQuery({
    queryKey: [...contestKeys.globalLeaderboard(), limit],
    queryFn: () => getGlobalLeaderboard(limit),
  });
};

// Create Contest Mutation
export const useCreateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contest: ICreateContest) => createContest(contest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.lists() });
    },
  });
};

// Add Problem to Contest Mutation
export const useAddProblemToContest = (contestId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problem: IAddProblemToContest) => addProblemToContest(contestId, problem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.problems(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
    },
  });
};

// Remove Problem from Contest Mutation
export const useRemoveProblemFromContest = (contestId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problemId: string) => removeProblemFromContest(contestId, problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.problems(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
    },
  });
};

// Register for Contest Mutation
export const useRegisterForContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, userId }: { contestId: string; userId: string }) =>
      registerForContest(contestId, userId),
    onSuccess: (_, { contestId, userId }) => {
      queryClient.invalidateQueries({ queryKey: contestKeys.participants(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: [...contestKeys.detail(contestId), 'registration', userId] });
    },
  });
};

// Unregister from Contest Mutation
export const useUnregisterFromContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, userId }: { contestId: string; userId: string }) =>
      unregisterFromContest(contestId, userId),
    onSuccess: (_, { contestId, userId }) => {
      queryClient.invalidateQueries({ queryKey: contestKeys.participants(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: [...contestKeys.detail(contestId), 'registration', userId] });
    },
  });
};

// Finalize Contest Rankings Mutation
export const useFinalizeContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contestId: string) => finalizeContestRankings(contestId),
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.leaderboard(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.globalLeaderboard() });
    },
  });
};
