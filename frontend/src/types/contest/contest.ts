export interface IContest {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_rated: boolean;
  is_finalized?: boolean;
  participant_count?: number;
  participant_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface IContestProblem {
  id: string;
  contest_id: string;
  problem_id: string;
  problem: {
    id: string;
    main_heading: string;
    difficulty: string;
    slug: string;
  };
  order_index: number;
  max_points: number;
  partial_credit: boolean;
  time_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface IContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    email: string;
    rating: number;
    solved_count: number;
  };
  total_points: number;
  problems_solved: number;
  problems_attempted: number;
  penalty_time: number;
  rank: number;
  rating_change: number;
  old_rating: number;
  new_rating: number;
  registered_at: string;
  started_at?: string;
  last_submission_at?: string;
  finished_at?: string;
}

export interface IContestLeaderboardEntry {
  contest_id: string;
  user_id: string;
  username: string;
  rank: number;
  score: number;
  problems_solved: number;
  penalty_minutes: number;
  rating_change?: number;
}

export interface IGlobalLeaderboardEntry {
  user_id: string;
  username: string;
  rating: number;
  contests_participated: number;
  rank: number;
}

export interface ICreateContest {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_rated: boolean;
}

export interface IAddProblemToContest {
  problem_title: string;
  max_points: number;
  time_penalty_minutes: number;
}

export interface IContestsResponse {
  contests: IContest[];
  total: number;
  page: number;
  page_size: number;
}

export interface IContestFilters {
  search?: string;
  is_active?: boolean;
  sort_by?: string;
}
