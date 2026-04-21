export interface IFrontendChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  broken_html: string;
  broken_css: string;
  broken_js: string;
  reference_screenshot: string;
  pixel_threshold: number;
  diff_threshold: number;
  time_limit: number;
  viewport_width: number;
  viewport_height: number;
  dom_assertions: string;
  created_at: string;
  updated_at: string;
}

export interface ICreateFrontendChallenge {
  title: string;
  description: string;
  difficulty: string;
  broken_html: string;
  broken_css: string;
  broken_js: string;
  pixel_threshold?: number;
  diff_threshold?: number;
  time_limit?: number;
  viewport_width?: number;
  viewport_height?: number;
  dom_assertions?: string;
}

export interface IBattleMatch {
  id: string;
  challenge_id: string;
  player_a_id: string;
  player_b_id: string;
  status: BattleMatchStatus;
  winner_id?: string;
  player_a_elo_before: number;
  player_b_elo_before: number;
  player_a_elo_after: number;
  player_b_elo_after: number;
  time_limit: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export type BattleMatchStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export interface IBattleSubmission {
  id: string;
  match_id: string;
  player_id: string;
  html: string;
  css: string;
  js: string;
  diff_ratio: number;
  passed: boolean;
  submitted_at: string;
}

export interface IBattleStats {
  total_matches: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  rating: number;
  tier: string;
}

export interface IBattleHistoryEntry {
  match_id: string;
  opponent_id: string;
  opponent_name: string;
  result: "win" | "loss" | "draw";
  elo_change: number;
  difficulty: string;
  duration: number;
  created_at: string;
}

export interface IBattleLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  rating: number;
  tier: string;
  matches_played: number;
  matches_won: number;
  win_rate: number;
}

export interface IBattleMatchDetail {
  match_id: string;
  challenge: IChallengeInfo;
  player_a: IBattlePlayer;
  player_b: IBattlePlayer;
  status: string;
  result: string;
  winner_id?: string;
  time_limit: number;
  start_time?: string;
  end_time?: string;
  submissions: IBattleSubmissionInfo[];
}

export interface IChallengeInfo {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

export interface IBattlePlayer {
  user_id: string;
  username: string;
  rating: number;
  tier: string;
  rating_before: number;
  elo_change: number;
}

export interface IBattleSubmissionInfo {
  id: string;
  player_id: string;
  diff_ratio: number;
  passed: boolean;
  submitted_at: string;
}

export interface IEloHistoryEntry {
  match_id: string;
  rating_before: number;
  rating_after: number;
  change: number;
  created_at: string;
}

// --- WebSocket Message Types ---

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
}

export type WSMessageType =
  | "join_queue"
  | "leave_queue"
  | "match_found"
  | "submission"
  | "opponent_submitted"
  | "judge_result"
  | "match_over"
  | "typing_indicator"
  | "opponent_disconnected"
  | "opponent_reconnected"
  | "reconnect"
  | "forfeit"
  | "rematch_request"
  | "rematch_accepted"
  | "error"
  | "queue_status";

export interface MatchFoundPayload {
  match_id: string;
  opponent_name: string;
  opponent_elo: number;
  opponent_tier: string;
  challenge_id: string;
  title: string;
  description: string;
  difficulty: string;
  broken_html: string;
  broken_css: string;
  broken_js: string;
  time_limit: number;
  reference_url: string;
  start_time: string;
}

export interface SubmissionPayload {
  match_id: string;
  html: string;
  css: string;
  js: string;
}

export interface OpponentSubmittedPayload {
  submitted_at: string;
}

export interface JudgeResultPayload {
  match_id: string;
  diff_ratio: number;
  passed: boolean;
}

export interface MatchOverPayload {
  match_id: string;
  result: string;
  winner_id?: string;
  elo_change_a: number;
  elo_change_b: number;
  new_rating_a: number;
  new_rating_b: number;
}

export interface DisconnectedPayload {
  grace_period_seconds: number;
}

export interface ErrorPayload {
  message: string;
}

export interface QueueStatusPayload {
  status: "searching" | "matched" | "cancelled";
  wait_time: number;
}

export interface JoinQueuePayload {
  difficulty: string;
}

export interface TypingPayload {
  match_id: string;
  is_typing: boolean;
}

export interface ForfeitPayload {
  match_id: string;
  forfeited_by: string;
  reason: string;
}

export interface RematchPayload {
  match_id: string;
  opponent_id: string;
}

// --- ELO Tier helper ---
export const ELO_TIERS = {
  Beginner: { min: 0, max: 999, color: "#888888" },
  Bronze: { min: 1000, max: 1199, color: "#CD7F32" },
  Silver: { min: 1200, max: 1399, color: "#C0C0C0" },
  Gold: { min: 1400, max: 1599, color: "#F7D046" },
  Platinum: { min: 1600, max: 1799, color: "#4ECDC4" },
  Diamond: { min: 1800, max: 1999, color: "#B9F2FF" },
  Master: { min: 2000, max: Infinity, color: "#E54B4B" },
} as const;

export type EloTierName = keyof typeof ELO_TIERS;

export function getEloTierInfo(rating: number): { name: EloTierName; color: string } {
  for (const [name, info] of Object.entries(ELO_TIERS)) {
    if (rating >= info.min && rating <= info.max) {
      return { name: name as EloTierName, color: info.color };
    }
  }
  return { name: "Beginner", color: ELO_TIERS.Beginner.color };
}
