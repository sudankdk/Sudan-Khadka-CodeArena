import { useCallback, useEffect, useRef, useState } from "react";
import useAuthStore from "@/services/auth/store/auth.store";
import type {
  WSMessage,
  WSMessageType,
  MatchFoundPayload,
  JudgeResultPayload,
  MatchOverPayload,
  OpponentSubmittedPayload,
  QueueStatusPayload,
  DisconnectedPayload,
  ErrorPayload,
} from "@/types/battle/battle";

const WS_BASE_URL = "ws://localhost:8080/ws/battle";
const TICKET_URL = "http://localhost:8080/api/ws-ticket";

type MessageHandler = (payload: any) => void;

interface UseBattleWebSocketReturn {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: <T>(type: WSMessageType, payload: T) => void;
  joinQueue: (difficulty: string) => void;
  leaveQueue: () => void;
  submitCode: (matchId: string, html: string, css: string, js: string) => void;
  sendTypingIndicator: (matchId: string, isTyping: boolean) => void;
  forfeit: (matchId: string) => void;
  requestRematch: (matchId: string, opponentId: string) => void;
  reconnect: (matchId: string) => void;

  // State derived from incoming messages
  matchData: MatchFoundPayload | null;
  judgeResult: JudgeResultPayload | null;
  matchOver: MatchOverPayload | null;
  opponentSubmitted: OpponentSubmittedPayload | null;
  queueStatus: QueueStatusPayload | null;
  opponentDisconnected: DisconnectedPayload | null;
  opponentReconnected: boolean;
  opponentTyping: boolean;
  rematchRequested: boolean;
  rematchAccepted: boolean;
  error: string | null;
}

export function useBattleWebSocket(): UseBattleWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<WSMessageType, MessageHandler>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const abortRef = useRef<AbortController | null>(null);

  const [connected, setConnected] = useState(false);
  const [matchData, setMatchData] = useState<MatchFoundPayload | null>(null);
  const [judgeResult, setJudgeResult] = useState<JudgeResultPayload | null>(null);
  const [matchOver, setMatchOver] = useState<MatchOverPayload | null>(null);
  const [opponentSubmitted, setOpponentSubmitted] = useState<OpponentSubmittedPayload | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatusPayload | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState<DisconnectedPayload | null>(null);
  const [opponentReconnected, setOpponentReconnected] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAccepted, setRematchAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register built-in message handlers
  useEffect(() => {
    const handlers = handlersRef.current;
    handlers.set("match_found", (payload: MatchFoundPayload) => {
      setMatchData(payload);
      setQueueStatus(null);
      setError(null);
    });
    handlers.set("judge_result", (payload: JudgeResultPayload) => {
      setJudgeResult(payload);
    });
    handlers.set("match_over", (payload: MatchOverPayload) => {
      setMatchOver(payload);
    });
    handlers.set("opponent_submitted", (payload: OpponentSubmittedPayload) => {
      setOpponentSubmitted(payload);
    });
    handlers.set("queue_status", (payload: QueueStatusPayload) => {
      setQueueStatus(payload);
    });
    handlers.set("opponent_disconnected", (payload: DisconnectedPayload) => {
      setOpponentDisconnected(payload);
      setOpponentReconnected(false);
    });
    handlers.set("opponent_reconnected", () => {
      setOpponentDisconnected(null);
      setOpponentReconnected(true);
    });
    handlers.set("typing_indicator", (payload: { is_typing: boolean }) => {
      setOpponentTyping(payload.is_typing);
    });
    handlers.set("rematch_request", () => {
      setRematchRequested(true);
    });
    handlers.set("rematch_accepted", () => {
      setRematchAccepted(true);
    });
    handlers.set("error", (payload: ErrorPayload) => {
      setError(payload.message);
    });
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Abort any in-flight connection attempt (handles React StrictMode double-mount)
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // Step 1: Fetch a one-time WS ticket via HTTP (cookies sent automatically)
    // Step 2: Connect WebSocket with ticket as query param
    // This is needed because the browser WebSocket API cannot send HTTP-only cookies cross-origin
    const token = useAuthStore.getState?.()?.token || undefined;

    fetch(TICKET_URL, {
      method: "POST",
      signal: ac.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error("Failed to authenticate for WebSocket");
        }
        return resp.json();
      })
      .then(({ ticket }: { ticket: string }) => {
        // If this connection attempt was aborted while fetch was in-flight, bail out
        if (ac.signal.aborted) return;

        // Close any existing WS before opening a new one
        if (wsRef.current) {
          wsRef.current.onclose = null; // Prevent auto-reconnect from old close
          wsRef.current.close();
          wsRef.current = null;
        }

        const ws = new WebSocket(`${WS_BASE_URL}?ticket=${ticket}`);

        ws.onopen = () => {
          setConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            const handler = handlersRef.current.get(message.type);
            if (handler) {
              handler(message.payload);
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          setConnected(false);
          // Auto-reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 16000);
            reconnectTimerRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
        };

        ws.onerror = () => {
          setError("WebSocket connection error");
        };

        wsRef.current = ws;
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError("Failed to connect — please log in and try again");
        }
      });
  }, []);

  const disconnect = useCallback(() => {
    // Cancel any in-flight connection attempt
    abortRef.current?.abort();
    abortRef.current = null;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttempts.current = maxReconnectAttempts; // prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent auto-reconnect from this close
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendMessage = useCallback(<T,>(type: WSMessageType, payload: T) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setError("Not connected to server");
      return;
    }
    const msg: WSMessage<T> = { type, payload };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const joinQueue = useCallback(
    (difficulty: string) => {
      // Reset match-related state
      setMatchData(null);
      setJudgeResult(null);
      setMatchOver(null);
      setOpponentSubmitted(null);
      setOpponentDisconnected(null);
      setOpponentReconnected(false);
      setRematchRequested(false);
      setRematchAccepted(false);
      setError(null);
      sendMessage("join_queue", { difficulty });
    },
    [sendMessage]
  );

  const leaveQueue = useCallback(() => {
    sendMessage("leave_queue", {});
    setQueueStatus(null);
  }, [sendMessage]);

  const submitCode = useCallback(
    (matchId: string, html: string, css: string, js: string) => {
      sendMessage("submission", { match_id: matchId, html, css, js });
    },
    [sendMessage]
  );

  const sendTypingIndicator = useCallback(
    (matchId: string, isTyping: boolean) => {
      sendMessage("typing_indicator", { match_id: matchId, is_typing: isTyping });
    },
    [sendMessage]
  );

  const forfeit = useCallback(
    (matchId: string) => {
      sendMessage("forfeit", { match_id: matchId });
    },
    [sendMessage]
  );

  const requestRematch = useCallback(
    (matchId: string, opponentId: string) => {
      sendMessage("rematch_request", { match_id: matchId, opponent_id: opponentId });
    },
    [sendMessage]
  );

  const reconnectToMatch = useCallback(
    (matchId: string) => {
      sendMessage("reconnect", { match_id: matchId });
    },
    [sendMessage]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectAttempts.current = maxReconnectAttempts;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connected,
    connect,
    disconnect,
    sendMessage,
    joinQueue,
    leaveQueue,
    submitCode,
    sendTypingIndicator,
    forfeit,
    requestRematch,
    reconnect: reconnectToMatch,
    matchData,
    judgeResult,
    matchOver,
    opponentSubmitted,
    queueStatus,
    opponentDisconnected,
    opponentReconnected,
    opponentTyping,
    rematchRequested,
    rematchAccepted,
    error,
  };
}
