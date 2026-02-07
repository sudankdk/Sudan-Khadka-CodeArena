import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  createSubmission, 
  getUserStats, 
  getProblemStats, 
  listSubmissions,
  getTopicStats
} from '../services/auth/api/submission';
import type { ICreateSubmission } from '@/types/submission/submission';

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (submission: ICreateSubmission) => createSubmission(submission),
    onSuccess: () => {
      // Invalidate user stats and submissions to refetch
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: () => getUserStats(),
  });
};

export const useProblemStats = (problemId: string) => {
  return useQuery({
    queryKey: ['problemStats', problemId],
    queryFn: () => getProblemStats(problemId),
    enabled: !!problemId,
  });
};

export const useSubmissions = (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    user_id?: string;
    problem_id?: string;
    status?: string;
    language?: string;
  }
) => {
  return useQuery({
    queryKey: ['submissions', page, pageSize, filters],
    queryFn: () => listSubmissions(page, pageSize, filters),
  });
};

export const useTopicStats = () => {
  return useQuery({
    queryKey: ['topicStats'],
    queryFn: () => getTopicStats(),
  });
};
