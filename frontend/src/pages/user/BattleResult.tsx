import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "@/services/auth/store/auth.store";
import { useBattleMatch } from "@/hooks/useBattle";
import EloTierBadge from "@/components/battle/EloTierBadge";

const BattleResult = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: match, isLoading } = useBattleMatch(matchId || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <span className="text-gray-500 font-mono text-xs tracking-widest animate-pulse">
          LOADING RESULTS...
        </span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
        <span className="text-gray-500 font-mono text-xs tracking-widest">MATCH NOT FOUND</span>
        <button
          onClick={() => navigate("/duel")}
          className="px-6 py-2 border border-[#333] text-gray-400 text-xs tracking-widest hover:border-[#F7D046] hover:text-[#F7D046] transition-colors"
        >
          BACK TO DUEL
        </button>
      </div>
    );
  }

  const isPlayerA = user?.id === match.player_a.user_id;
  const me = isPlayerA ? match.player_a : match.player_b;
  const opponent = isPlayerA ? match.player_b : match.player_a;

  const isWinner = match.winner_id === user?.id;
  const isDraw = !match.winner_id && match.status === "finished";
  const isLoss = match.winner_id && match.winner_id !== user?.id;

  const resultText = isWinner ? "VICTORY" : isDraw ? "DRAW" : "DEFEAT";
  const resultColor = isWinner
    ? "text-[#4ECDC4]"
    : isDraw
    ? "text-[#F7D046]"
    : "text-[#E54B4B]";
  const resultBorder = isWinner
    ? "border-[#4ECDC4]"
    : isDraw
    ? "border-[#F7D046]"
    : "border-[#E54B4B]";
  const resultIcon = isWinner ? "♛" : isDraw ? "⚖" : "✕";

  const eloSign = me.elo_change >= 0 ? "+" : "";

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-8">
      {/* Result Header */}
      <div className={`border-4 ${resultBorder} p-8 text-center mb-8 min-w-[400px]`}>
        <span className="text-6xl">{resultIcon}</span>
        <h1 className={`text-5xl font-bold font-mono tracking-wider mt-4 ${resultColor}`}>
          {resultText}
        </h1>
        <p className="text-gray-500 text-[10px] tracking-widest mt-2">
          {match.challenge.title.toUpperCase()} — {match.challenge.difficulty.toUpperCase()}
        </p>
      </div>

      {/* Players Comparison */}
      <div className="flex items-center gap-8 mb-8">
        {/* You */}
        <div className="border-2 border-dashed border-[#333] p-6 min-w-[250px] text-center">
          <p className="text-[10px] text-gray-600 tracking-widest mb-2">YOU</p>
          <p className="text-white font-mono text-xl font-bold mb-2">
            {me.username.toUpperCase()}
          </p>
          <EloTierBadge rating={me.rating} tier={me.tier} size="sm" className="mx-auto mb-3" />
          <div className="border-t border-[#333] pt-3 mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">BEFORE</span>
              <span className="text-gray-300 font-mono">{Math.round(me.rating_before)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">CHANGE</span>
              <span
                className={`font-mono font-bold ${
                  me.elo_change > 0 ? "text-[#4ECDC4]" : me.elo_change < 0 ? "text-[#E54B4B]" : "text-gray-500"
                }`}
              >
                {eloSign}{Math.round(me.elo_change)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">AFTER</span>
              <span className="text-[#F7D046] font-mono font-bold">
                {Math.round(me.rating_before + me.elo_change)}
              </span>
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="text-[#E54B4B] text-3xl font-bold">⚔</div>

        {/* Opponent */}
        <div className="border-2 border-dashed border-[#333] p-6 min-w-[250px] text-center">
          <p className="text-[10px] text-gray-600 tracking-widest mb-2">OPPONENT</p>
          <p className="text-white font-mono text-xl font-bold mb-2">
            {opponent.username.toUpperCase()}
          </p>
          <EloTierBadge rating={opponent.rating} tier={opponent.tier} size="sm" className="mx-auto mb-3" />
          <div className="border-t border-[#333] pt-3 mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">BEFORE</span>
              <span className="text-gray-300 font-mono">{Math.round(opponent.rating_before)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">CHANGE</span>
              <span
                className={`font-mono font-bold ${
                  opponent.elo_change > 0 ? "text-[#4ECDC4]" : opponent.elo_change < 0 ? "text-[#E54B4B]" : "text-gray-500"
                }`}
              >
                {opponent.elo_change >= 0 ? "+" : ""}{Math.round(opponent.elo_change)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">AFTER</span>
              <span className="text-gray-300 font-mono">
                {Math.round(opponent.rating_before + opponent.elo_change)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {match.submissions.length > 0 && (
        <div className="border-2 border-dashed border-[#333] min-w-[600px] mb-8">
          <div className="px-4 py-3 border-b border-[#333]">
            <span className="text-[10px] text-gray-500 tracking-widest">SUBMISSIONS</span>
          </div>
          <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[10px] text-gray-600 tracking-widest border-b border-[#222]">
            <div>PLAYER</div>
            <div>DIFF RATIO</div>
            <div>PASSED</div>
            <div>TIME</div>
          </div>
          {match.submissions.map((sub) => {
            const isMe = sub.player_id === user?.id;
            const player = isMe ? me : opponent;
            return (
              <div
                key={sub.id}
                className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#222] last:border-0"
              >
                <span className={`font-mono text-xs ${isMe ? "text-[#F7D046]" : "text-white"}`}>
                  {player.username.toUpperCase()}
                </span>
                <span className="text-gray-300 font-mono text-xs">
                  {(sub.diff_ratio * 100).toFixed(1)}%
                </span>
                <span className={sub.passed ? "text-[#4ECDC4] text-xs" : "text-[#E54B4B] text-xs"}>
                  {sub.passed ? "YES" : "NO"}
                </span>
                <span className="text-gray-500 text-xs font-mono">
                  {new Date(sub.submitted_at).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/duel")}
          className="px-8 py-3 border-2 border-[#333] text-gray-400 text-xs font-mono tracking-widest hover:border-[#F7D046] hover:text-[#F7D046] transition-colors"
        >
          BACK TO LOBBY
        </button>
        <button
          onClick={() => navigate("/duel")}
          className="px-8 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors"
        >
          PLAY AGAIN ⚡
        </button>
      </div>

      {/* Basquiat Quote */}
      <div className="mt-12 text-[#222] text-[8px] font-mono text-center">
        <p>"EVERY LINE MEANS SOMETHING"</p>
        <p className="text-[#E54B4B] mt-1">— SAMO© 1982</p>
      </div>
    </div>
  );
};

export default BattleResult;
