export interface ISubmission {
  id: string;
  user_id: string;
  problem_id: string;
  contest_id?: string | null; // NULL for practice, UUID for contest submissions
  problem_slug?: string;
  problem_title?: string;
  difficulty?: string;
  language: string;
  status: string;
  execution_time?: number;
  memory_used?: number;
  test_cases_passed: number;
  total_test_cases: number;
  points_earned?: number; // Points earned in contest submissions
  created_at: string;
}

export interface ICreateSubmission {
  problem_id: string;
  contest_id?: string | null; // Pass contest ID when solving contest problems
  language: string;
  code: string;
  status: string;
  execution_time?: number;
  memory_used?: number;
  test_cases_passed: number;
  total_test_cases: number;
  error_message?: string;
}

export interface IUserStats {
  total_submissions: number;
  accepted_count: number;
  acceptance_rate: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_solved: number;
  recent_submissions: ISubmission[];
}

export interface IProblemStats {
  problem_id: string;
  total_submissions: number;
  accepted_count: number;
  acceptance_rate: number;
}

export interface ITopicStats {
  tag: string;
  count: number;
}

export interface ISubmissionsResponse {
  data: ISubmission[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export const SubmissionStatus = {
  ACCEPTED: "accepted",
  WRONG_ANSWER: "wrong_answer",
  RUNTIME_ERROR: "runtime_error",
  COMPILE_ERROR: "compile_error",
  TIME_LIMIT_EXCEEDED: "time_limit_exceeded",
  MEMORY_LIMIT_EXCEEDED: "memory_limit_exceeded",
} as const;

export type SubmissionStatusType = typeof SubmissionStatus[keyof typeof SubmissionStatus];
