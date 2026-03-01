import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import useAuthStore from "@/services/auth/store/auth.store";
import { useBattleWebSocket } from "@/hooks/useBattleWebSocket";
import SandboxPreview from "@/components/battle/SandboxPreview";
import EloTierBadge from "@/components/battle/EloTierBadge";
import { server } from "@/constants/server";

type EditorTab = "HTML" | "CSS" | "JS";

interface ConsoleEntry {
  level: "log" | "error" | "warn";
  data: string;
  time: string;
}

const BattleArena = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const ws = useBattleWebSocket();

  // Editor state
  const [activeTab, setActiveTab] = useState<EditorTab>("HTML");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  // Timer
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typing indicator debounce
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    ws.connect();
    return () => ws.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When matchData arrives (either from match_found or reconnect), initialize editor state
  useEffect(() => {
    if (ws.matchData) {
      setHtml(ws.matchData.broken_html);
      setCss(ws.matchData.broken_css);
      setJs(ws.matchData.broken_js);

      // Calculate remaining time
      const startMs = new Date(ws.matchData.start_time).getTime();
      const endMs = startMs + ws.matchData.time_limit * 1000;
      const nowMs = Date.now();
      const remaining = Math.max(0, Math.floor((endMs - nowMs) / 1000));
      setRemainingSeconds(remaining);
    }
  }, [ws.matchData]);

  // If we navigated here directly (e.g., from Duel after match_found), send reconnect to get state
  useEffect(() => {
    if (ws.connected && matchId && !ws.matchData) {
      ws.reconnect(matchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.connected, matchId]);

  // Timer countdown
  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds]);

  // Navigate to result page when match is over
  useEffect(() => {
    if (ws.matchOver && matchId) {
      navigate(`/duel/result/${matchId}`);
    }
  }, [ws.matchOver, matchId, navigate]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        setConsoleEntries((prev) => [
          ...prev.slice(-99), // keep last 100
          {
            level: event.data.level,
            data: event.data.data,
            time: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Typing indicator
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const val = value || "";
      switch (activeTab) {
        case "HTML":
          setHtml(val);
          break;
        case "CSS":
          setCss(val);
          break;
        case "JS":
          setJs(val);
          break;
      }

      if (matchId) {
        ws.sendTypingIndicator(matchId, true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          ws.sendTypingIndicator(matchId, false);
        }, 1500);
      }
    },
    [activeTab, matchId, ws]
  );

  const handleSubmit = useCallback(() => {
    if (!matchId || submitting) return;
    setSubmitting(true);
    ws.submitCode(matchId, html, css, js);
    // submitting state will be cleared when judge_result arrives
  }, [matchId, html, css, js, ws, submitting]);

  // Clear submitting when judge result arrives
  useEffect(() => {
    if (ws.judgeResult) setSubmitting(false);
  }, [ws.judgeResult]);

  const handleForfeit = useCallback(() => {
    if (!matchId) return;
    ws.forfeit(matchId);
    setShowForfeitConfirm(false);
    // Navigate immediately — don't wait for broadcast since we initiated the forfeit
    navigate(`/duel/result/${matchId}`);
  }, [matchId, ws, navigate]);

  // Format timer as MM:SS
  const timerDisplay = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingSeconds]);

  const timerColor =
    remainingSeconds <= 60
      ? "text-[#E54B4B] animate-pulse"
      : remainingSeconds <= 180
      ? "text-[#F7D046]"
      : "text-white";

  const currentCode = activeTab === "HTML" ? html : activeTab === "CSS" ? css : js;
  const editorLang = activeTab === "HTML" ? "html" : activeTab === "CSS" ? "css" : "javascript";

  const referenceUrl = ws.matchData
    ? `${server}battles/challenges/${ws.matchData.challenge_id}/reference`
    : "";

  return (
    <div className="h-screen w-screen bg-[#0d0d0d] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 border-b-2 border-dashed border-[#333] flex items-center justify-between px-4 shrink-0">
        {/* Left: Player info */}
        <div className="flex items-center gap-4">
          <span className="text-white font-mono text-sm tracking-wider">
            {user?.username?.toUpperCase() || "YOU"}
          </span>
          <span className="text-[#E54B4B] text-lg">⚔</span>
          <span className="text-white font-mono text-sm tracking-wider">
            {ws.matchData?.opponent_name || "OPPONENT"}
          </span>
          {ws.matchData && (
            <EloTierBadge
              rating={ws.matchData.opponent_elo}
              tier={ws.matchData.opponent_tier}
              size="sm"
              showRating={false}
            />
          )}
          {ws.opponentTyping && (
            <span className="text-gray-500 text-[10px] tracking-widest animate-pulse">
              TYPING...
            </span>
          )}
          {ws.opponentDisconnected && (
            <span className="text-[#E54B4B] text-[10px] tracking-widest animate-pulse">
              DISCONNECTED ({ws.opponentDisconnected.grace_period_seconds}s)
            </span>
          )}
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-3">
          <span className={`font-mono text-2xl font-bold ${timerColor}`}>
            {timerDisplay}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {ws.judgeResult && (
            <span
              className={`text-[10px] font-mono tracking-widest ${
                ws.judgeResult.passed ? "text-[#4ECDC4]" : "text-[#F7D046]"
              }`}
            >
              {ws.judgeResult.passed
                ? "✓ PASSED"
                : `DIFF: ${(ws.judgeResult.diff_ratio * 100).toFixed(1)}%`}
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || remainingSeconds <= 0}
            className={`px-4 py-1.5 text-[10px] font-mono tracking-widest transition-all ${
              submitting
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-[#4ECDC4] text-black hover:bg-[#3dbdb5]"
            }`}
          >
            {submitting ? "JUDGING..." : "SUBMIT ⚡"}
          </button>
          <button
            onClick={() => setShowForfeitConfirm(true)}
            className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-[#E54B4B] border border-[#E54B4B] hover:bg-[#E54B4B] hover:text-white transition-colors"
          >
            FORFEIT
          </button>
        </div>
      </div>

      {/* Challenge Info Banner */}
      {ws.matchData && (
        <div className="h-8 border-b border-[#222] flex items-center px-4 gap-4 shrink-0">
          <span className="text-[10px] text-gray-500 tracking-widest">CHALLENGE:</span>
          <span className="text-white font-mono text-xs">{ws.matchData.title}</span>
          <span
            className={`text-[10px] tracking-widest px-2 border ${
              ws.matchData.difficulty === "easy"
                ? "text-[#4ECDC4] border-[#4ECDC4]"
                : ws.matchData.difficulty === "hard"
                ? "text-[#E54B4B] border-[#E54B4B]"
                : "text-[#F7D046] border-[#F7D046]"
            }`}
          >
            {ws.matchData.difficulty.toUpperCase()}
          </span>
          <span className="text-gray-600 text-[10px] ml-auto">{ws.matchData.description}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        <div className="w-1/2 flex flex-col border-r-2 border-dashed border-[#333]">
          {/* Editor Tabs */}
          <div className="flex border-b border-[#333] shrink-0">
            {(["HTML", "CSS", "JS"] as EditorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-[10px] font-mono tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-[#1a1a1a] text-[#F7D046] border-b-2 border-[#F7D046]"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={editorLang}
              value={currentCode}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                padding: { top: 8 },
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Right: Preview + Reference */}
        <div className="w-1/2 flex flex-col">
          {/* Live Preview */}
          <div className="flex-1 flex flex-col border-b-2 border-dashed border-[#333]">
            <div className="h-8 flex items-center px-4 border-b border-[#333] shrink-0">
              <span className="text-[10px] text-gray-500 tracking-widest">LIVE PREVIEW</span>
              <span className="text-[10px] text-[#4ECDC4] ml-auto tracking-widest">● LIVE</span>
            </div>
            <div className="flex-1">
              <SandboxPreview html={html} css={css} js={js} />
            </div>
          </div>

          {/* Reference Screenshot */}
          <div className="h-[40%] flex flex-col">
            <div className="h-8 flex items-center px-4 border-b border-[#333] shrink-0">
              <span className="text-[10px] text-gray-500 tracking-widest">REFERENCE TARGET</span>
              <span className="text-[10px] text-[#F7D046] ml-auto tracking-widest">♛ GOAL</span>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              {referenceUrl ? (
                <img
                  src={referenceUrl}
                  alt="Reference screenshot"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  Loading reference...
                </div>
              )}
            </div>
          </div>

          {/* Console */}
          <div className="h-32 border-t-2 border-dashed border-[#333] flex flex-col shrink-0">
            <div className="h-8 flex items-center justify-between px-4 border-b border-[#333]">
              <span className="text-[10px] text-gray-500 tracking-widest">CONSOLE</span>
              <button
                onClick={() => setConsoleEntries([])}
                className="text-[10px] text-gray-600 tracking-widest hover:text-white"
              >
                CLEAR
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-1 font-mono text-xs">
              {consoleEntries.length === 0 && (
                <p className="text-gray-600 text-[10px] py-2">No console output</p>
              )}
              {consoleEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`py-0.5 ${
                    entry.level === "error"
                      ? "text-[#E54B4B]"
                      : entry.level === "warn"
                      ? "text-[#F7D046]"
                      : "text-gray-300"
                  }`}
                >
                  <span className="text-gray-600 mr-2">{entry.time}</span>
                  {entry.data}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forfeit Confirmation Modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="border-2 border-[#E54B4B] bg-[#0d0d0d] p-8 max-w-sm w-full">
            <p className="text-[10px] text-gray-500 tracking-widest mb-2">CONFIRM</p>
            <h2 className="text-white font-mono text-xl mb-4">FORFEIT MATCH?</h2>
            <p className="text-gray-400 text-xs mb-6">
              You will lose this match and your ELO will be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForfeitConfirm(false)}
                className="flex-1 py-3 border border-[#333] text-gray-400 text-xs tracking-widest hover:border-white hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleForfeit}
                className="flex-1 py-3 bg-[#E54B4B] text-white text-xs tracking-widest hover:bg-[#c43e3e] transition-colors"
              >
                FORFEIT ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {ws.error && (
        <div className="fixed bottom-4 right-4 bg-[#E54B4B] text-white px-4 py-3 font-mono text-xs z-50">
          {ws.error}
        </div>
      )}

      {/* Opponent Submitted Notification */}
      {ws.opponentSubmitted && (
        <div className="fixed top-16 right-4 border border-[#F7D046] bg-[#0d0d0d] text-[#F7D046] px-4 py-2 font-mono text-xs z-50 animate-pulse">
          ⚡ OPPONENT SUBMITTED
        </div>
      )}
    </div>
  );
};

export default BattleArena;
