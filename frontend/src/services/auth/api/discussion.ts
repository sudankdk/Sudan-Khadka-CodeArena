import { server } from '../../../constants/server';
import { ApiClient } from "../client";
import type { 
  ICreateDiscussion,
  IUpdateDiscussion,
  IDiscussion,
  IDiscussionsResponse,
  IDiscussionFilters,
  ICreateComment,
  IUpdateComment,
  IDiscussionComment,
  IVoteRequest,
  IDiscussionStats
} from '@/types/discussion/discussion';

export const discussionClient = new ApiClient(server);

// Discussion APIs
export const createDiscussion = async (discussion: ICreateDiscussion) => {
  const resp = await discussionClient.post<{data: IDiscussion}>("/discussions", discussion);
  console.log("Created Discussion:", resp);
  return resp?.data || resp;
}

export const getDiscussionById = async (id: string): Promise<IDiscussion> => {
  const resp = await discussionClient.get<{data: IDiscussion}>(`/discussions/${id}`);
  console.log("Fetched Discussion:", resp);
  return resp?.data || resp;
}

export const updateDiscussion = async (id: string, updates: IUpdateDiscussion): Promise<IDiscussion> => {
  const resp = await discussionClient.put<{data: IDiscussion}>(`/discussions/${id}`, updates);
  console.log("Updated Discussion:", resp);
  return resp?.data || resp;
}

export const deleteDiscussion = async (id: string): Promise<void> => {
  await discussionClient.delete(`/discussions/${id}`);
  console.log("Deleted Discussion:", id);
}

export const listDiscussions = async (
  page: number = 1, 
  pageSize: number = 20,
  filters?: IDiscussionFilters
): Promise<IDiscussionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  
  if (filters?.user_id) params.append('user_id', filters.user_id);
  if (filters?.tag) params.append('tag', filters.tag);
  if (filters?.is_solved !== undefined) params.append('is_solved', filters.is_solved.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  
  const resp = await discussionClient.get<IDiscussionsResponse>(`/discussions?${params}`);
  console.log("Fetched Discussions:", resp);
  return resp;
}

// Comment APIs
export const createComment = async (comment: ICreateComment): Promise<IDiscussionComment> => {
  const resp = await discussionClient.post<{data: IDiscussionComment}>("/discussions/comments", comment);
  console.log("Created Comment:", resp);
  return resp?.data || resp;
}

export const getCommentsByDiscussionId = async (discussionId: string): Promise<IDiscussionComment[]> => {
  const resp = await discussionClient.get<{data: IDiscussionComment[]}>(`/discussions/${discussionId}/comments`);
  console.log("Fetched Comments:", resp);
  return resp?.data || resp;
}

export const updateComment = async (commentId: string, updates: IUpdateComment): Promise<IDiscussionComment> => {
  const resp = await discussionClient.put<{data: IDiscussionComment}>(`/discussions/comments/${commentId}`, updates);
  console.log("Updated Comment:", resp);
  return resp?.data || resp;
}

export const deleteComment = async (commentId: string): Promise<void> => {
  await discussionClient.delete(`/discussions/comments/${commentId}`);
  console.log("Deleted Comment:", commentId);
}

// Vote APIs
export const voteOnTarget = async (voteData: IVoteRequest): Promise<void> => {
  await discussionClient.post("/discussions/vote", voteData);
  console.log("Voted:", voteData);
}

export const removeVote = async (targetId: string, targetType: 'discussion' | 'comment'): Promise<void> => {
  await discussionClient.delete(`/discussions/vote?target_id=${targetId}&target_type=${targetType}`);
  console.log("Removed Vote:", targetId, targetType);
}

// Stats API
export const getDiscussionStats = async (): Promise<IDiscussionStats> => {
  const resp = await discussionClient.get<{data: IDiscussionStats}>('/stats/discussions');
  console.log("Fetched Discussion Stats:", resp);
  return resp?.data || resp;
}
