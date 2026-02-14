import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as discussionApi from '../services/auth/api/discussion';

// Simple query keys
export const discussionKeys = {
  all: ['discussions'] as const,
  lists: () => [...discussionKeys.all, 'list'] as const,
  list: (page: number, pageSize: number, filters?: any) => [...discussionKeys.lists(), { page, pageSize, filters }] as const,
  details: () => [...discussionKeys.all, 'detail'] as const,
  detail: (id: string) => [...discussionKeys.details(), id] as const,
  comments: (discussionId: string) => ['comments', discussionId] as const,
  stats: ['discussion-stats'] as const,
};

// Discussion hooks - direct TanStack Query usage
export const useDiscussions = (page = 1, pageSize = 20, filters?: any) => {
  return useQuery({
    queryKey: discussionKeys.list(page, pageSize, filters),
    queryFn: () => discussionApi.listDiscussions(page, pageSize, filters),
  });
};

export const useDiscussion = (id: string) => {
  return useQuery({
    queryKey: discussionKeys.detail(id),
    queryFn: () => discussionApi.getDiscussionById(id),
    enabled: !!id,
  });
};

export const useCreateDiscussion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discussionApi.createDiscussion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });
    },
  });
};

export const useUpdateDiscussion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      discussionApi.updateDiscussion(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });
    },
  });
};

export const useDeleteDiscussion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discussionApi.deleteDiscussion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });
    },
  });
};

// Comment hooks
export const useComments = (discussionId: string) => {
  return useQuery({
    queryKey: discussionKeys.comments(discussionId),
    queryFn: () => discussionApi.getCommentsByDiscussionId(discussionId),
    enabled: !!discussionId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discussionApi.createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.comments(variables.discussion_id) });
      queryClient.invalidateQueries({ queryKey: discussionKeys.detail(variables.discussion_id) });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      discussionApi.updateComment(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.comments(data.discussion_id) });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; discussionId: string }) => 
      discussionApi.deleteComment(id),
    onSuccess: (_, { discussionId }) => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.comments(discussionId) });
    },
  });
};

// Vote hooks
export const useVote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discussionApi.voteOnTarget,
    onSuccess: (_, variables) => {
      if (variables.target_type === 'discussion') {
        queryClient.invalidateQueries({ queryKey: discussionKeys.detail(variables.target_id) });
        queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments'] });
      }
    },
  });
};

export const useRemoveVote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: 'discussion' | 'comment' }) => 
      discussionApi.removeVote(targetId, targetType),
    onSuccess: (_, { targetId, targetType }) => {
      if (targetType === 'discussion') {
        queryClient.invalidateQueries({ queryKey: discussionKeys.detail(targetId) });
        queryClient.invalidateQueries({ queryKey: discussionKeys.lists() });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments'] });
      }
    },
  });
};

// Stats hook
export const useDiscussionStats = () => {
  return useQuery({
    queryKey: discussionKeys.stats,
    queryFn: discussionApi.getDiscussionStats,
  });
};
