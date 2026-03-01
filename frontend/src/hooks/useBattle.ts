import { useQuery } from "@tanstack/react-query";
import * as battleApi from "@/services/auth/api/battle";

export const battleKeys = {
  all: ["battles"] as const,
  stats: () => [...battleKeys.all, "stats"] as const,
  history: () => [...battleKeys.all, "history"] as const,
  historyPage: (page: number, pageSize: number) =>
    [...battleKeys.history(), { page, pageSize }] as const,
  leaderboard: () => [...battleKeys.all, "leaderboard"] as const,
  leaderboardPage: (page: number, pageSize: number) =>
    [...battleKeys.leaderboard(), { page, pageSize }] as const,
  match: (id: string) => [...battleKeys.all, "match", id] as const,
  eloHistory: () => [...battleKeys.all, "elo-history"] as const,
  challenges: () => [...battleKeys.all, "challenges"] as const,
  challenge: (id: string) => [...battleKeys.challenges(), id] as const,
};

export const useBattleStats = () => {
  return useQuery({
    queryKey: battleKeys.stats(),
    queryFn: battleApi.getBattleStats,
  });
};

export const useBattleHistory = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: battleKeys.historyPage(page, pageSize),
    queryFn: () => battleApi.getBattleHistory(page, pageSize),
  });
};

export const useBattleLeaderboard = (page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: battleKeys.leaderboardPage(page, pageSize),
    queryFn: () => battleApi.getBattleLeaderboard(page, pageSize),
  });
};

export const useBattleMatch = (matchId: string) => {
  return useQuery({
    queryKey: battleKeys.match(matchId),
    queryFn: () => battleApi.getBattleMatch(matchId),
    enabled: !!matchId,
  });
};

export const useEloHistory = () => {
  return useQuery({
    queryKey: battleKeys.eloHistory(),
    queryFn: battleApi.getEloHistory,
  });
};

export const useChallenges = () => {
  return useQuery({
    queryKey: battleKeys.challenges(),
    queryFn: battleApi.listChallenges,
  });
};

export const useChallenge = (id: string) => {
  return useQuery({
    queryKey: battleKeys.challenge(id),
    queryFn: () => battleApi.getChallengeById(id),
    enabled: !!id,
  });
};
