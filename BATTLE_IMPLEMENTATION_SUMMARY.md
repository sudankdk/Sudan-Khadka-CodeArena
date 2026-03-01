# 1v1 Frontend Battle Platform — Implementation Summary

## Overview

Built a complete 1v1 Frontend Battle Platform based on the research document (`Frontend_1v1_Battle_Platform_Research.docx`). Players compete in real-time to fix broken HTML/CSS/JS challenges, judged by pixel-perfect comparison against a reference screenshot.

---

## What Was Done

### Phase 0: Codebase Fixes

| File | Issue | Fix |
|------|-------|-----|
| `backend/internal/domain/battleroom.go` | Broken struct — missing import, no closing brace, only 3 fields | Replaced entirely with 4 proper domain models |
| `backend/internal/ws/connection_ws.go` | Used gorilla/websocket (incompatible with Fiber's fasthttp) and had typo `upgarder` | Replaced with gofiber/contrib/websocket adapter; old file now a comment redirect |
| `backend/internal/helper/auth.go` | Cookie MaxAge (3600s = 1hr) didn't match JWT expiry (30 days) | Changed cookie MaxAge to `86400 * 30` (30 days) |
| `backend/docker-compose.yml` | No Redis service for matchmaking queue | Added Redis 7 Alpine on port 6379 with AOF persistence |

### Phase 1: Backend — Domain & Services

**New files created:**

- **`backend/internal/domain/battleroom.go`** — 4 GORM models:
  - `FrontendChallenge` — challenge with broken HTML/CSS/JS, reference screenshot path, pixel/diff thresholds, viewport dimensions, DOM assertions
  - `BattleMatch` — 1v1 match linking two players, status tracking, ELO before/after, time limit
  - `BattleSubmission` — player code submission with diff ratio, pass/fail, server-side timestamp
  - `BattleEloHistory` — rating change history per match for graphs

- **`backend/internal/dto/battle_dto.go`** — All DTOs aligned with REST responses:
  - `CreateFrontendChallengeDTO`, `UpdateFrontendChallengeDTO`
  - `BattleSubmissionDTO`, `JoinQueueDTO`, `JudgeResult`
  - `BattleStatsDTO`, `BattleHistoryDTO`, `BattleLeaderboardEntryDTO`
  - `BattleMatchDetailDTO` (with nested `ChallengeInfoDTO`, `BattlePlayerDTO`, `BattleSubmissionInfoDTO`)

- **`backend/internal/repo/frontend_challenge_repo.go`** — Interface-based repo for CRUD + `GetRandomByDifficulty`

- **`backend/internal/repo/battle_repo.go`** — Interface-based repo with 15 methods for matches, submissions, stats, leaderboard, ELO history

- **`backend/internal/service/judge_service.go`** — Go-native visual judge using chromedp:
  - Persistent browser pool via `ExecAllocator`
  - `JudgeSubmission()` — renders HTML in headless Chrome, takes full screenshot, compares pixels
  - `GenerateReferenceScreenshot()` — captures reference when creating challenges
  - `compareScreenshots()` — pixel-by-pixel RGBA Euclidean distance comparison

- **`backend/internal/service/battle_service.go`** — Battle logic:
  - `CalculateElo()` — standard ELO formula with K-factor tiers (40 for <30 matches, 20 default, 10 for 2000+ rating)
  - `GetEloTier()` — maps rating to tier name (Beginner → Master)
  - Full match lifecycle: `CreateMatch`, `ProcessSubmission`, `EndMatchWithWinner`, `EndMatchAsDraw`, `ForfeitMatch`
  - Stats, history, leaderboard, match detail, ELO history queries

### Phase 2: Backend — WebSocket System

- **`backend/internal/ws/message.go`** — 16 message type constants + typed payload structs for all client/server messages

- **`backend/internal/ws/client.go`** — WebSocket client:
  - Read/write pumps with goroutine-per-connection pattern
  - Ping/pong heartbeat (60s timeout)
  - Thread-safe match ID tracking

- **`backend/internal/ws/hub.go`** — Connection manager:
  - Client registry by user ID
  - Room management by match ID
  - Spectator rooms
  - `BroadcastToRoom`, `SendToUser`, `SendToOpponent`

- **`backend/internal/ws/handler.go`** — Message router:
  - Handles: join_queue, leave_queue, submission, typing_indicator, reconnect, forfeit, rematch_request
  - 30-second grace period for disconnections before auto-forfeit
  - Reconnect sends full match state to returning player

- **`backend/internal/ws/matchmaking.go`** — Redis-backed matchmaking:
  - Sorted Set queue (`ZADD` with ELO score, `ZRANGEBYSCORE` for range queries)
  - 2-second polling interval
  - Expanding ELO window (base 100 + 5/second)
  - Difficulty preference matching
  - Auto-starts match timer on match creation

### Phase 3: Backend — REST Endpoints

- **`backend/internal/api/rest/handlers/battle_handlers.go`** — REST routes:
  - `POST /battles/challenges` — admin only, creates challenge + generates reference screenshot
  - `GET /battles/challenges` — list all challenges
  - `GET /battles/challenges/:id` — get challenge by ID
  - `GET /battles/challenges/:id/reference` — serve reference screenshot file
  - `GET /battles/leaderboard` — paginated battle leaderboard
  - `GET /battles/history` — authenticated user's match history
  - `GET /battles/stats` — authenticated user's battle statistics
  - `GET /battles/match/:id` — match detail for replay
  - `GET /battles/elo-history` — ELO rating over time

### Phase 4: Frontend

**New files created:**

- **`frontend/src/types/battle/battle.ts`** — TypeScript interfaces mirroring all backend DTOs + WS message types + ELO tier helper functions

- **`frontend/src/services/auth/api/battle.ts`** — API service following existing `ApiClient` pattern for all REST endpoints

- **`frontend/src/hooks/useBattleWebSocket.ts`** — WebSocket hook:
  - Auto-connect/reconnect with exponential backoff (max 5 attempts)
  - Built-in handlers for all 16 message types
  - Exposes reactive state: `matchData`, `judgeResult`, `matchOver`, `queueStatus`, `opponentTyping`, etc.
  - Cookie-based auth (cookies sent with upgrade request)

- **`frontend/src/hooks/useBattle.ts`** — React Query hooks using query key factory pattern:
  - `useBattleStats`, `useBattleHistory`, `useBattleLeaderboard`, `useBattleMatch`, `useEloHistory`, `useChallenges`

- **`frontend/src/components/battle/SandboxPreview.tsx`** — Sandboxed iframe:
  - `sandbox="allow-scripts"` — no access to parent origin
  - Debounced updates (300ms default) to prevent excessive re-renders
  - Console capture via `postMessage` to parent window

- **`frontend/src/components/battle/EloTierBadge.tsx`** — ELO tier display:
  - Maps rating to tier name, color, and icon
  - Three sizes (sm/md/lg), optional rating display

**Modified files:**

- **`frontend/src/pages/user/Duel.tsx`** — Complete rewrite:
  - Replaced ALL mock data with real API/WebSocket integration
  - 4 tabs: LOBBY (quick match with difficulty selector, searching state, cancel), FIND (matchmaking queue), HISTORY (real match history from API, clickable rows), LEADERBOARD (ranked players table with tier badges)
  - Real stats from `useBattleStats()` hook
  - Navigates to `/duel/battle/:matchId` on match found
  - Connection status indicator

- **`frontend/src/pages/user/BattleArena.tsx`** — New full-screen battle page:
  - Top bar: player names, timer (MM:SS with color-coded urgency), submit/forfeit buttons
  - Left panel: Monaco editor with HTML/CSS/JS tabs
  - Right panel: live iframe preview (top), reference screenshot (bottom)
  - Console panel: captures `console.log/error/warn` from iframe
  - Forfeit confirmation modal
  - Typing indicator, opponent submitted notification, judge result display
  - Auto-navigates to result page on match over

- **`frontend/src/pages/user/BattleResult.tsx`** — Match result page:
  - Victory/Draw/Defeat display with themed colors
  - Side-by-side player comparison with ELO before/after/change
  - Submissions table with diff ratios and timestamps
  - "Play Again" button

- **`frontend/src/App.tsx`** — Added routes:
  - `/duel/battle/:matchId` → BattleArena
  - `/duel/result/:matchId` → BattleResult

- **`frontend/src/pages/user/Profile.tsx`** — Added battle stats card:
  - Shows ELO tier badge, W/L/D counts, current streak
  - Links to `/duel` arena
  - Gracefully handles no-data state

### Phase 5: Backend — WebSocket Auth Fix

- **`backend/internal/api/server.go`** — Changed WebSocket auth to use HTTP-only cookies:
  - The upgrade middleware reads JWT from cookie (or query param as fallback)
  - Validates before upgrade, sets `user_id` in Fiber locals
  - The WS handler reads validated user ID from locals
  - This aligns with the existing auth model (HTTP-only cookies, not tokens in JS)

---

## Why These Decisions Were Made

| Decision | Reason |
|----------|--------|
| **Go-native visual judge (chromedp)** | User chose this over Node.js — keeps the stack uniform, no additional runtime needed |
| **gofiber/contrib/websocket** | gorilla/websocket is incompatible with Fiber (fasthttp). The Fiber adapter wraps fasthttp/websocket correctly |
| **Redis sorted sets for matchmaking** | O(log N) range queries for ELO-based matching, built-in ordering |
| **Cookie-based WebSocket auth** | The app uses HTTP-only cookies — JavaScript can't read them, so token-in-query-param wouldn't work. Cookies are automatically sent with WebSocket upgrade requests |
| **Expanding ELO window** | Prevents long wait times — starts at ±100 ELO, expands by +5/second |
| **Pixel-by-pixel comparison** | Precise visual matching using Euclidean distance per pixel with configurable thresholds |
| **30s grace period for disconnections** | Prevents accidental forfeits from temporary network issues |
| **Server-side timestamps on submissions** | Prevents clock manipulation — the server records when it received the submission |
| **Sandboxed iframe** | `sandbox="allow-scripts"` prevents XSS from user code while allowing JS execution |
| **Interface-based repos** | Compile-time interface checks (`var _ IRepo = (*Repo)(nil)`) follow existing codebase pattern |

---

## Dependencies Added

### Backend (Go)
- `github.com/gofiber/contrib/websocket v1.3.4` — Fiber-compatible WebSocket adapter
- `github.com/chromedp/chromedp v0.14.2` — Headless Chrome for visual judge
- `github.com/redis/go-redis/v9 v9.18.0` — Redis client for matchmaking queue

### Frontend
- No new npm dependencies — uses existing `@monaco-editor/react`, `@tanstack/react-query`, `zustand`, `recharts`

### Infrastructure
- Redis 7 Alpine added to `docker-compose.yml` (port 6379, AOF persistence)

---

## Files Created/Modified

### Backend (15 files)
```
MODIFIED: backend/internal/domain/battleroom.go
MODIFIED: backend/internal/ws/connection_ws.go
MODIFIED: backend/internal/helper/auth.go
MODIFIED: backend/docker-compose.yml
MODIFIED: backend/internal/api/server.go
CREATED:  backend/internal/dto/battle_dto.go
CREATED:  backend/internal/repo/frontend_challenge_repo.go
CREATED:  backend/internal/repo/battle_repo.go
CREATED:  backend/internal/service/judge_service.go
CREATED:  backend/internal/service/battle_service.go
CREATED:  backend/internal/ws/message.go
CREATED:  backend/internal/ws/client.go
CREATED:  backend/internal/ws/hub.go
CREATED:  backend/internal/ws/handler.go
CREATED:  backend/internal/ws/matchmaking.go
CREATED:  backend/internal/api/rest/handlers/battle_handlers.go
```

### Frontend (11 files)
```
CREATED:  frontend/src/types/battle/battle.ts
CREATED:  frontend/src/services/auth/api/battle.ts
CREATED:  frontend/src/hooks/useBattleWebSocket.ts
CREATED:  frontend/src/hooks/useBattle.ts
CREATED:  frontend/src/components/battle/SandboxPreview.tsx
CREATED:  frontend/src/components/battle/EloTierBadge.tsx
CREATED:  frontend/src/pages/user/BattleArena.tsx
CREATED:  frontend/src/pages/user/BattleResult.tsx
MODIFIED: frontend/src/pages/user/Duel.tsx
MODIFIED: frontend/src/App.tsx
MODIFIED: frontend/src/pages/user/Profile.tsx
```

---

## Verification

- **Backend**: `go build ./...` — zero errors
- **Frontend TypeScript**: `tsc --noEmit` — zero errors  
- **Frontend Vite build**: `vite build` — success (2528 modules, 11.84s)
