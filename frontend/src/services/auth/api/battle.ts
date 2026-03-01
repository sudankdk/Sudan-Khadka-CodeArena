import { ApiClient } from "../client";
import { server } from "@/constants/server";
import type {
  IFrontendChallenge,
  ICreateFrontendChallenge,
  IBattleStats,
  IBattleHistoryEntry,
  IBattleLeaderboardEntry,
  IBattleMatchDetail,
  IEloHistoryEntry,
} from "@/types/battle/battle";

const battleClient = new ApiClient(server);

// --- Challenge endpoints (admin) ---

export const createChallenge = async (data: ICreateFrontendChallenge) => {
  const resp = await battleClient.post<{ data: IFrontendChallenge }>(
    "battles/challenges",
    data
  );
  return resp?.data || resp;
};

export const listChallenges = async () => {
  const resp = await battleClient.get<{ data: IFrontendChallenge[] }>(
    "battles/challenges"
  );
  return resp?.data || resp;
};

export const getChallengeById = async (id: string) => {
  const resp = await battleClient.get<{ data: IFrontendChallenge }>(
    `battles/challenges/${id}`
  );
  return resp?.data || resp;
};

// --- Battle stats & history (auth required) ---

export const getBattleStats = async () => {
  const resp = await battleClient.get<{ data: IBattleStats }>(
    "battles/stats"
  );
  return resp?.data || resp;
};

export const getBattleHistory = async (page = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const resp = await battleClient.get<{
    data: { history: IBattleHistoryEntry[]; total: number; page: number; page_size: number };
  }>(`battles/history?${params.toString()}`);
  const inner = resp?.data;
  return inner?.history || [];
};

export const getBattleMatch = async (matchId: string) => {
  const resp = await battleClient.get<{ data: IBattleMatchDetail }>(
    `battles/match/${matchId}`
  );
  return resp?.data || resp;
};

export const getEloHistory = async () => {
  const resp = await battleClient.get<{ data: IEloHistoryEntry[] }>(
    "battles/elo-history"
  );
  return resp?.data || resp;
};

// --- Leaderboard (public) ---

export const getBattleLeaderboard = async (page = 1, pageSize = 50) => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const resp = await battleClient.get<{
    data: { entries: IBattleLeaderboardEntry[]; total: number; page: number; page_size: number };
  }>(`battles/leaderboard?${params.toString()}`);
  const inner = resp?.data;
  return inner?.entries || [];
};
