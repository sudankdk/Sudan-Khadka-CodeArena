export interface IDiscussion {
  id: string;
  user_id: string;
  username: string;
  user_image?: string;
  title: string;
  content: string;
  tags?: string[];
  upvotes: number;
  downvotes: number;
  view_count: number;
  is_solved: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface ICreateDiscussion {
  title: string;
  content: string;
  tags?: string;
}

export interface IUpdateDiscussion {
  title?: string;
  content?: string;
  tags?: string;
  is_solved?: boolean;
}

export interface IDiscussionComment {
  id: string;
  discussion_id: string;
  user_id: string;
  username: string;
  user_image?: string;
  parent_id?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  replies?: IDiscussionComment[];
}

export interface ICreateComment {
  discussion_id: string;
  parent_id?: string;
  content: string;
}

export interface IUpdateComment {
  content?: string;
  is_solution?: boolean;
}

export interface IVoteRequest {
  target_id: string;
  target_type: 'discussion' | 'comment';
  vote_type: 'upvote' | 'downvote';
}

export interface IDiscussionStats {
  total_discussions: number;
  solved_count: number;
  total_comments: number;
}

export interface IDiscussionsResponse {
  data: IDiscussion[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface IDiscussionFilters {
  user_id?: string;
  tag?: string;
  is_solved?: boolean;
  search?: string;
  sort_by?: 'newest' | 'popular' | 'most_voted';
}
