import UserDashboardLayout from "@/components/UserDashboardLayout";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBattleStats, useBattleHistory, useBattleLeaderboard } from "@/hooks/useBattle";
import { useBattleWebSocket } from "@/hooks/useBattleWebSocket";
import EloTierBadge from "@/components/battle/EloTierBadge";

type DuelTab = "LOBBY" | "FIND" | "HISTORY" | "LEADERBOARD";

const Duel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DuelTab>("LOBBY");
  const [difficulty, setDifficulty] = useState("medium");
  const [historyPage] = useState(1);

  const ws = useBattleWebSocket();
  const { data: stats, isLoading: statsLoading } = useBattleStats();
  const { data: history, isLoading: historyLoading } = useBattleHistory(historyPage, 20);
  const { data: leaderboard, isLoading: leaderboardLoading } = useBattleLeaderboard(1, 20);

  const tabs: DuelTab[] = ["LOBBY", "FIND", "HISTORY", "LEADERBOARD"];

  // Connect WebSocket on mount
  useEffect(() => {
    ws.connect();
    return () => ws.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate to BattleArena when match is found
  useEffect(() => {
    if (ws.matchData) {
      navigate(`/duel/battle/${ws.matchData.match_id}`);
    }
  }, [ws.matchData, navigate]);

  const handleJoinQueue = useCallback(() => {
    ws.joinQueue(difficulty);
  }, [ws, difficulty]);

  const handleLeaveQueue = useCallback(() => {
    ws.leaveQueue();
  }, [ws]);

  const isSearching = ws.queueStatus?.status === "searching";

  const getDifficultyColor = (d: string) => {
    if (d === "easy") return "text-[#4ECDC4] border-[#4ECDC4]";
    if (d === "medium") return "text-[#F7D046] border-[#F7D046]";
    return "text-[#E54B4B] border-[#E54B4B]";
  };

  const getResultColor = (r: string) => {
    if (r === "win") return "text-[#4ECDC4]";
    if (r === "loss") return "text-[#E54B4B]";
    return "text-[#F7D046]";
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE COLOSSEUM</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            1 VS 1<span className="text-[#E54B4B] ml-2">⚔</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2">
            "I AM NOT A NEGRO ARTIST, I AM AN ARTIST" — JMB
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border-2 border-[#4ECDC4] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">W</span>
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">
              {statsLoading ? "—" : stats?.wins ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">WINS</p>
          </div>
          <div className="border-2 border-[#E54B4B] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">L</span>
            <p className="text-3xl font-bold text-[#E54B4B] font-mono">
              {statsLoading ? "—" : stats?.losses ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">LOSSES</p>
          </div>
          <div className="border-2 border-[#F7D046] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">%</span>
            <p className="text-3xl font-bold text-[#F7D046] font-mono">
              {statsLoading ? "—" : `${Math.round(stats?.win_rate ?? 0)}%`}
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">WIN RATE</p>
          </div>
          <div className="border-2 border-[#333] p-4 relative">
            <span className="absolute -top-2 -right-2 text-gray-500 text-xs">🔥</span>
            <p className="text-3xl font-bold text-white font-mono">
              {statsLoading ? "—" : stats?.current_streak ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">WIN STREAK</p>
          </div>
        </div>

        {/* ELO Badge */}
        {stats && (
          <div className="mb-6 flex items-center gap-4">
            <EloTierBadge rating={stats.rating} tier={stats.tier} size="lg" />
            <span className="text-gray-500 text-[10px] tracking-widest">
              {stats.total_matches} MATCHES PLAYED
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-dashed border-[#333] pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-mono tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[#E54B4B] text-white"
                  : "text-gray-500 hover:text-white border border-[#333] hover:border-[#E54B4B]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* LOBBY */}
        {activeTab === "LOBBY" && (
          <div className="space-y-6">
            {/* Quick Match CTA */}
            <div className="border-2 border-[#F7D046] p-8 text-center relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-[#F7D046] text-xs tracking-widest">
                QUICK MATCH
              </span>
              <p className="text-gray-400 text-xs mb-6">
                SELECT DIFFICULTY AND FIND AN OPPONENT
              </p>

              {/* Difficulty selector */}
              <div className="flex gap-2 justify-center mb-6">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-6 py-3 text-xs font-mono tracking-widest transition-all border-2 ${
                      difficulty === d
                        ? getDifficultyColor(d) + " bg-white/5"
                        : "border-[#333] text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>

              {isSearching ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-[#F7D046] text-sm font-mono tracking-widest animate-pulse">
                      SEARCHING FOR OPPONENT...
                    </span>
                    {ws.queueStatus && (
                      <span className="text-gray-500 text-xs font-mono">
                        {ws.queueStatus.wait_time}s
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLeaveQueue}
                    className="px-8 py-3 border-2 border-[#E54B4B] text-[#E54B4B] text-xs tracking-widest hover:bg-[#E54B4B] hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoinQueue}
                  disabled={!ws.connected}
                  className={`px-12 py-4 text-sm font-bold tracking-widest transition-colors ${
                    ws.connected
                      ? "bg-[#F7D046] text-black hover:bg-[#f5c518]"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {ws.connected ? "FIND MATCH ⚡" : "CONNECTING..."}
                </button>
              )}
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${ws.connected ? "bg-[#4ECDC4]" : "bg-[#E54B4B]"}`}
              />
              <span className="text-[10px] text-gray-600 tracking-widest">
                {ws.connected ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            {/* Error */}
            {ws.error && (
              <div className="border border-[#E54B4B] p-3">
                <span className="text-[#E54B4B] text-xs font-mono">{ws.error}</span>
              </div>
            )}
          </div>
        )}

        {/* FIND — difficulty-based search */}
        {activeTab === "FIND" && (
          <div className="max-w-md mx-auto">
            <div className="border-2 border-[#4ECDC4] p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-[#4ECDC4] text-xs tracking-widest">
                MATCHMAKING
              </span>

              <div className="space-y-6 mt-4">
                {/* Difficulty */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">
                    DIFFICULTY
                  </label>
                  <div className="flex gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 text-xs font-mono tracking-widest transition-all border-2 ${
                          difficulty === d
                            ? getDifficultyColor(d) + " bg-white/5"
                            : "border-[#333] text-gray-600 hover:border-gray-500"
                        }`}
                      >
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {isSearching ? (
                  <div className="text-center space-y-4">
                    <p className="text-[#4ECDC4] font-mono text-sm tracking-widest animate-pulse">
                      SEARCHING...
                    </p>
                    {ws.queueStatus && (
                      <p className="text-gray-500 text-xs font-mono">
                        WAITING: {ws.queueStatus.wait_time}s
                      </p>
                    )}
                    <button
                      onClick={handleLeaveQueue}
                      className="w-full py-3 border-2 border-[#E54B4B] text-[#E54B4B] text-xs tracking-widest hover:bg-[#E54B4B] hover:text-white transition-colors"
                    >
                      CANCEL SEARCH
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleJoinQueue}
                    disabled={!ws.connected}
                    className={`w-full py-4 text-sm font-bold tracking-widest transition-colors ${
                      ws.connected
                        ? "bg-[#4ECDC4] text-black hover:bg-[#3dbdb5]"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {ws.connected ? "JOIN QUEUE ⚔" : "CONNECTING..."}
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="mt-6 text-center text-[10px] text-gray-600 space-y-1">
              <p>MATCHMAKING PAIRS YOU WITH A SIMILARLY RATED OPPONENT</p>
              <p className="text-gray-500">ELO WINDOW EXPANDS OVER TIME</p>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "HISTORY" && (
          <div className="border-2 border-dashed border-[#333]">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
              <div className="col-span-2">RESULT</div>
              <div className="col-span-3">OPPONENT</div>
              <div className="col-span-2">DIFFICULTY</div>
              <div className="col-span-2">DURATION</div>
              <div className="col-span-2">RATING</div>
              <div className="col-span-1">DATE</div>
            </div>

            {historyLoading && (
              <div className="px-4 py-8 text-center">
                <span className="text-gray-500 text-xs font-mono tracking-widest animate-pulse">
                  LOADING...
                </span>
              </div>
            )}

            {!historyLoading && (!history || (Array.isArray(history) && history.length === 0)) && (
              <div className="px-4 py-8 text-center">
                <span className="text-gray-600 text-xs font-mono tracking-widest">
                  NO BATTLES YET. FIND A MATCH TO GET STARTED.
                </span>
              </div>
            )}

            {Array.isArray(history) &&
              history.map((entry) => {
                const eloStr =
                  entry.elo_change > 0
                    ? `+${Math.round(entry.elo_change)}`
                    : entry.elo_change < 0
                    ? `${Math.round(entry.elo_change)}`
                    : "0";
                return (
                  <div
                    key={entry.match_id}
                    onClick={() => navigate(`/duel/result/${entry.match_id}`)}
                    className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-[#222] last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="col-span-2">
                      <span className={`font-bold tracking-widest ${getResultColor(entry.result)}`}>
                        {entry.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-white font-mono text-sm">
                        {entry.opponent_name.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`text-[10px] tracking-widest px-2 border ${getDifficultyColor(entry.difficulty)}`}
                      >
                        {entry.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-300 font-mono text-sm">
                        {formatDuration(entry.duration)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`font-mono font-bold ${
                          entry.elo_change > 0
                            ? "text-[#4ECDC4]"
                            : entry.elo_change < 0
                            ? "text-[#E54B4B]"
                            : "text-gray-600"
                        }`}
                      >
                        {eloStr !== "0" ? eloStr : "—"}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-gray-500 text-[10px] font-mono">
                        {new Date(entry.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* LEADERBOARD */}
        {activeTab === "LEADERBOARD" && (
          <div className="border-2 border-dashed border-[#333]">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
              <div className="col-span-1">#</div>
              <div className="col-span-3">PLAYER</div>
              <div className="col-span-2">TIER</div>
              <div className="col-span-2">RATING</div>
              <div className="col-span-2">W/L</div>
              <div className="col-span-2">WIN RATE</div>
            </div>

            {leaderboardLoading && (
              <div className="px-4 py-8 text-center">
                <span className="text-gray-500 text-xs font-mono tracking-widest animate-pulse">
                  LOADING...
                </span>
              </div>
            )}

            {!leaderboardLoading &&
              (!leaderboard || (Array.isArray(leaderboard) && leaderboard.length === 0)) && (
                <div className="px-4 py-8 text-center">
                  <span className="text-gray-600 text-xs font-mono tracking-widest">
                    NO RANKED PLAYERS YET
                  </span>
                </div>
              )}

            {Array.isArray(leaderboard) &&
              leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-[#222] last:border-0 hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-1">
                    <span
                      className={`font-mono font-bold ${
                        entry.rank === 1
                          ? "text-[#F7D046]"
                          : entry.rank === 2
                          ? "text-[#C0C0C0]"
                          : entry.rank === 3
                          ? "text-[#CD7F32]"
                          : "text-gray-500"
                      }`}
                    >
                      {entry.rank <= 3 ? "♛" : ""}{entry.rank}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-white font-mono text-sm">
                      {entry.username.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <EloTierBadge rating={entry.rating} tier={entry.tier} size="sm" showRating={false} />
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#F7D046] font-mono font-bold">
                      {Math.round(entry.rating)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-300 font-mono text-sm">
                      {entry.matches_won}/{entry.matches_played - entry.matches_won}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-300 font-mono text-sm">
                      {Math.round(entry.win_rate)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Basquiat */}
        <div className="mt-10 text-[#222] text-[8px] font-mono">
          <p>"I CROSS OUT WORDS SO YOU WILL SEE THEM MORE;</p>
          <p>THE FACT THAT THEY ARE OBSCURED MAKES YOU WANT TO READ THEM."</p>
          <p className="text-[#E54B4B] mt-1">— SAMO© 1982</p>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Duel;
