Frontend 1v1 Battle Platform
Deep Technical Research & Architecture Guide
March 2026

Executive Summary
This document provides a comprehensive technical blueprint for building a frontend-focused 1v1 competitive coding platform — a unique evolution of LeetCode-style challenges where the task is not to write algorithms, but to fix broken UIs. Two players receive the same broken frontend (messy HTML/CSS/JS), and the first to restore it to a target visual state wins.

This is a genuinely differentiated product in the market. The key challenges are: (1) sandboxed execution of user-submitted frontend code, (2) visual judging that allows multiple valid solutions, (3) real-time 1v1 matchmaking and WebSocket room management, and (4) a fair ELO-based rating system. All four pillars are covered in depth below.

1. System Architecture Overview
The platform is composed of five independent systems that work together:

Component	Responsibility
Frontend App	Split-screen code editor + live preview iframe + match UI
Matchmaking Service	Redis-based queue pairing players by ELO and difficulty tier
WebSocket Server	Real-time room management, submission events, match state
Visual Judge	Playwright headless browser + Pixelmatch screenshot comparison
ELO Service	Rating updates, match history, leaderboard persistence

The flow from a user's perspective: join queue → get matched → receive broken challenge → code in split-screen editor with live preview → submit → judge compares screenshot to reference → first correct submission wins → ELO updates for both players.

2. The Challenge Format
2.1 What a Frontend Challenge Looks Like
Each challenge consists of three parts delivered to both players simultaneously:

•	A broken starter file (HTML + CSS + JS) — this is the 'messed up' code the player fixes. For example: a navbar where flexbox properties are wrong, a button with broken hover states, a card layout where grid columns are misconfigured.
•	A reference screenshot — an image of what the UI should look like when correctly fixed. This is the source of truth for the judge. Players can view it in a side panel.
•	A problem description — a human-readable description of what is broken (e.g., 'The navigation bar items are stacked vertically. Fix the layout so items appear in a single horizontal row with equal spacing.').

Crucially, the problem description tells players what outcome to achieve, not how to achieve it. This is what makes multiple valid solutions possible. A player might use flexbox, another might use grid, another might use inline-block — all produce the same visual result and all would pass the judge.
2.2 Difficulty Tiers and Problem Design
Problems should be categorized into at least three tiers. This affects both matchmaking (similar-tier challenges for similarly-rated players) and problem selection.

Tier	Examples of Challenge Types
Easy	Fix a broken color, correct a font-size, restore a missing padding/margin, fix a z-index overlap, correct display:none that should be block
Medium	Fix broken flexbox/grid layout, restore responsive breakpoints, fix a broken CSS animation, correct a broken form layout, fix hover/focus states
Hard	Fix a complex multi-column layout from scratch, restore a broken interactive component (tabs, accordion, modal), fix CSS custom properties chain, restore broken JS interactivity + styling together

Content Strategy: The hardest part of building this platform is not the engineering — it is creating a high-quality problem set. Plan to invest significant effort in authoring challenges where (a) the breakage is clearly intentional and fixable, (b) multiple solutions are valid, and (c) the reference screenshot is unambiguous.

3. The Frontend Sandbox
3.1 Architecture: sandboxed iframes with srcdoc
When a player writes HTML/CSS/JS in the editor, it needs to be rendered live in a preview panel. The standard approach used by CodePen, JSFiddle, and similar tools is a sandboxed iframe with the srcdoc attribute. The browser itself becomes the runtime — no server execution required for the preview.

The key is the sandbox attribute on the iframe. This restricts what the embedded code can do:

<iframe
  sandbox="allow-scripts"
  srcdoc="<html>...</html>"
  style="width:100%; height:100%; border:none;"
></iframe>

With only allow-scripts and no allow-same-origin, the iframe runs in a separate null origin, which means it cannot access localStorage, cookies, the parent window's DOM, or make credentialed requests. This is the correct security posture.

Critical Security Rule: Never combine allow-scripts with allow-same-origin unless the iframe is served from a completely different subdomain. Using both on same-origin content allows the embedded code to remove the sandbox attribute entirely, defeating all protections.
3.2 Live Preview with Debouncing
To give players a live preview as they type, regenerate the iframe content on every keystroke — but debounced to avoid thrashing:

// Combine HTML + CSS + JS into a single document
const buildDocument = (html, css, js) => `
  <!DOCTYPE html><html><head>
  <style>${css}</style>
  </head><body>${html}
  <script>${js}</script>
  </body></html>`

// Debounce the preview update — 300ms after typing stops
const debouncedUpdate = debounce((html, css, js) => {
  iframeRef.current.srcdoc = buildDocument(html, css, js);
}, 300);

For code editor UI, Monaco Editor (the engine behind VS Code) is the gold standard. It provides syntax highlighting, autocomplete, and multi-file tab support — everything a frontend developer expects.
3.3 Console Output Capture
When player JavaScript calls console.log(), the output goes to the iframe's isolated console — invisible to the parent app. To capture it, inject a console hijacker into the iframe before the user's JS runs:

const buildDocument = (html, css, js) => `
  <!DOCTYPE html><html><head><style>${css}</style></head><body>
  ${html}
  <script>
    // Intercept console and send to parent
    const _log = console.log.bind(console);
    console.log = (...args) => {
      _log(...args);
      window.parent.postMessage({ type: 'console', data: args }, '*');
    };
  </script>
  <script>${js}</script>
  </body></html>`

The parent app listens for these postMessage events and renders them in a console panel, giving players the debugging feedback they need during the challenge.
3.4 Security Checklist
•	Use sandbox='allow-scripts' only — do not add allow-same-origin
•	Serve the iframe content from a different subdomain (e.g., sandbox.yourdomain.com) for additional origin isolation
•	Set Content-Security-Policy headers on the sandbox subdomain to block outbound network requests from player code
•	Add a Content-Security-Policy: frame-ancestors directive to prevent the iframe from being embedded elsewhere
•	Validate and sanitize submissions server-side before storing — even though the iframe is sandboxed, you don't want to store malicious payloads in your database
•	Rate-limit submissions — players should not be able to spam judge requests

4. The Visual Judge
The judging system is the most technically interesting component of this platform. Unlike algorithmic problems with deterministic outputs, frontend problems are visual. The judge must determine whether a player's submission produces the correct visual result without caring how they achieved it.
4.1 Approach 1: Screenshot Pixel Comparison (Recommended)
The primary judging strategy is pixel-level screenshot comparison using Playwright and Pixelmatch. When a player submits:

1.	Playwright launches a headless Chromium instance
2.	The submitted HTML/CSS/JS is loaded into the browser
3.	Playwright waits for fonts, images, and animations to settle
4.	A screenshot is taken at a fixed viewport size (e.g., 1280x720)
5.	Pixelmatch compares it pixel-by-pixel against the reference screenshot
6.	If the pixel difference ratio is below a configured threshold, the submission passes

The core Playwright code looks like this:

const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

async function judgeSubmission(html, css, js, referenceImagePath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Load submission as data URI to avoid serving it
  const content = buildDocument(html, css, js);
  await page.setContent(content, { waitUntil: 'networkidle' });

  // Wait for animations/transitions to finish
  await page.waitForTimeout(500);

  const screenshot = await page.screenshot();
  await browser.close();

  // Compare with reference
  const reference = PNG.sync.read(fs.readFileSync(referenceImagePath));
  const actual = PNG.sync.read(screenshot);
  const { width, height } = reference;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    reference.data, actual.data, diff.data,
    width, height,
    { threshold: 0.1 }  // Per-pixel color tolerance (0-1)
  );

  const diffRatio = numDiffPixels / (width * height);
  return { passed: diffRatio < 0.02, diffRatio };  // 2% tolerance
}
4.2 Threshold Tuning
The two key thresholds require careful calibration:

Parameter	Guidance
threshold (per-pixel)	0.1 is a good default. It allows minor anti-aliasing and sub-pixel rendering differences without being too lenient. For problems with solid colors, go lower (0.05).
maxDiffPixelRatio	0.02 (2%) is recommended for most challenges. Go stricter for pixel-art style challenges (0.005), looser for complex layouts with text rendering variance (0.05).
Viewport size	Fix at 1280x720 for all challenges. Both the reference screenshot and submission must be captured at the same dimensions.
waitUntil: 'networkidle'	Ensures the page is fully loaded before screenshotting. Add a fixed 300-500ms buffer on top for CSS transitions.

Pro Tip: Generate your reference screenshots using the same Playwright + Chromium setup you use for judging. Screenshots can vary slightly between different browsers and OS environments, so the reference and submission must be captured in the same environment.
4.3 Approach 2: DOM/CSS Assertion Testing (Complementary)
Pixel comparison works well but can produce false positives for small rendering differences. A complementary approach is DOM assertion testing: after rendering the submission, use Playwright to query the DOM and assert specific properties.

For example, for a 'fix the navbar' problem, you might assert:

// Assert computed styles via Playwright evaluate()
const navStyle = await page.evaluate(() => {
  const nav = document.querySelector('nav');
  const style = getComputedStyle(nav);
  return {
    display: style.display,
    flexDirection: style.flexDirection,
  };
});
assert(navStyle.display === 'flex');
assert(navStyle.flexDirection === 'row');

// Assert element positioning
const buttonBox = await page.locator('#submit-btn').boundingBox();
// button should be roughly centered
assert(Math.abs(buttonBox.x - (1280/2)) < 50);

The two approaches together are more robust than either alone: pixel comparison catches visual regressions the DOM assertions miss, and DOM assertions catch structural issues that visually look similar but are semantically wrong.
4.4 Judging Service Architecture
The judge should run as a separate microservice, not inline with the WebSocket server. The flow is:

7.	Player submits code via WebSocket
8.	WebSocket server enqueues the submission to a job queue (Redis LPUSH)
9.	Judge worker picks up the job (Redis BRPOP), runs Playwright
10.	Judge publishes result back to a Redis Pub/Sub channel for this match
11.	WebSocket server receives the result and broadcasts to both players

This decoupling means the WebSocket server stays fast and responsive — it is not blocked waiting for a headless browser to render. Multiple judge workers can be scaled horizontally to handle concurrent submissions.

Performance Note: Playwright takes 1-3 seconds per judge run (browser launch + page load + screenshot). Pre-warm a pool of browser instances rather than launching a new browser per submission to bring this down to 300-500ms.

5. Real-Time 1v1 Matchmaking
5.1 Queue Architecture with Redis
Redis Sorted Sets are the standard data structure for matchmaking queues. The score is the player's ELO rating, which allows efficient range-based queries to find opponents of similar skill.

// Player joins the queue
ZADD matchmaking:queue {elo_score} {player_id}
// Store player metadata
HSET matchmaking:player:{player_id} elo 1400 tier medium joinedAt 1234567890

// Find opponents within ELO range
ZRANGEBYSCORE matchmaking:queue {elo - 100} {elo + 100} LIMIT 0 5

// When a match is found, atomically remove both players
ZREM matchmaking:queue {player_a_id} {player_b_id}

The matchmaking worker runs on a polling loop (every 1-2 seconds) and checks the queue. If a match is found, it creates a match room and notifies both players. A critical detail: the longer a player waits, the wider the ELO range expands — this prevents indefinite queue times for players with unusual ratings.

// Expanding ELO window based on wait time
const waitSeconds = (Date.now() - player.joinedAt) / 1000;
const eloWindow = 100 + (waitSeconds * 5);  // +5 ELO per second waited
const opponents = await redis.zrangebyscore(
  'matchmaking:queue',
  player.elo - eloWindow,
  player.elo + eloWindow
);
5.2 WebSocket Room Management
Once a match is created, both players join a WebSocket room identified by the match ID. All match events are broadcast to this room.

The key WebSocket events your server needs to handle:

Event	Direction & Payload
join_queue	Client → Server: { difficulty: 'medium', eloRating: 1400 }
match_found	Server → Both: { matchId, problem, opponentName, opponentElo, startTime }
submission	Client → Server: { matchId, html, css, js, submittedAt }
opponent_submitted	Server → Other Player: { submittedAt } (lets them know opponent submitted, adds pressure)
judge_result	Server → Both: { matchId, winner, loserId, diffRatio, breakdown }
match_over	Server → Both: { winner, newEloWinner, newEloLoser, eloChange }
opponent_disconnected	Server → Player: { grace_period_seconds: 30 }
forfeit	Server → Both: { forfeitedBy, reason: 'disconnect_timeout' }
5.3 Match State
Each active match needs state stored in Redis (with a TTL of the match time limit + buffer):

// Match state stored in Redis Hash
HSET match:{matchId}
  playerA        'user_123'
  playerB        'user_456'
  problem        'navbar-flex-bug'
  status         'ongoing'  // ongoing | judging | finished
  startTime      '1706745600000'
  timeLimit      '900'      // 15 minutes in seconds
  winner         ''
EXPIRE match:{matchId} 3600   // 1 hour TTL
5.4 Handling Disconnections
Disconnections are the messiest edge case in 1v1 games. The recommended approach:

12.	When a player disconnects, start a 30-second grace timer and notify their opponent
13.	If the player reconnects within 30 seconds, the match resumes with no penalty
14.	If the timer expires, the disconnected player forfeits and the opponent wins
15.	Use server-side timestamps for all submission events — never trust client-side times

Important: Record the submission timestamp at the moment the server receives the WebSocket message, not when judgment completes. This prevents a scenario where Player A submits a correct answer but judgment takes 2 seconds, during which Player B also submits correctly — the server-side receipt time correctly identifies who submitted first.

6. ELO Rating System
6.1 The Mathematics
ELO is a well-proven statistical system for rating relative skill. The core formulas:

Expected score for Player A against Player B:
Ea = 1 / (1 + 10^((Rb - Ra) / 400))

New rating for Player A after the match:
Ra_new = Ra + K * (Actual - Ea)

Where Actual is 1 for a win, 0 for a loss, and 0.5 for a draw. K is the sensitivity factor — how much each match can shift your rating.

K-Factor Value	When to Use
K = 40	New players (fewer than 30 matches played). Higher K means faster rating convergence early.
K = 20	Established players (30-100 matches). Standard competitive range.
K = 10	High-rated players (ELO > 2000). Protects established top players from large swings.
6.2 Implementation
function calculateElo(ratingA, ratingB, outcome, K = 20) {
  // outcome: 1 = A wins, 0 = B wins, 0.5 = draw
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const newRatingA = Math.round(ratingA + K * (outcome - expectedA));
  const newRatingB = Math.round(ratingB + K * ((1 - outcome) - expectedB));

  return { newRatingA, newRatingB,
           changeA: newRatingA - ratingA,
           changeB: newRatingB - ratingB };
}

All players start at 1200. This is a reasonable seed that ensures new players don't immediately face top-rated players, and ELO changes are visible and meaningful early in a player's journey.
6.3 Displaying ELO Meaningfully
Raw ELO numbers feel abstract to users. Consider mapping ELO to named tiers to give players a sense of progression:

ELO Range	Tier
< 1000	Beginner
1000 - 1200	Bronze
1200 - 1400	Silver
1400 - 1600	Gold
1600 - 1800	Platinum
1800 - 2000	Diamond
> 2000	Master

7. UI/UX and Game Loop Design
7.1 The Match Screen Layout
The match screen is the most important UI in the platform. It needs to communicate a lot of information clearly without overwhelming the player. Recommended layout:

•	Top bar: Match timer (counting down), opponent name + ELO, your ELO, a 'Submit' button
•	Left panel: Monaco code editor with tabs for HTML, CSS, and JS
•	Right panel: Split between (top) live preview iframe and (bottom) reference screenshot for comparison
•	Bottom strip: Console output panel, collapsible

UX Insight: Show the reference screenshot and live preview side-by-side so players can visually diff what they need to fix. Some platforms use a 'toggle' between the two views, but side-by-side is faster for spotting differences.
7.2 Tension and Engagement Mechanics
A 1v1 match is most exciting when players feel competitive pressure. A few mechanics that amplify this:

•	Opponent activity indicator: Show a small status like 'Opponent is typing...' when their WebSocket is sending updates. This creates urgency without revealing their code.
•	Submission notification: When the opponent submits (regardless of whether it passes), briefly flash 'Opponent submitted!' so the current player knows they need to hurry.
•	Countdown urgency: Flash the timer red when under 60 seconds. Play an audio cue (optional, user-controlled) at 30 seconds.
•	Post-match replay: Show both players' final submissions side-by-side after the match. This is educational and satisfying — players can see how the opponent solved it differently.
7.3 Match Time Limits
Time limits prevent matches from going on forever and add pressure. Recommended limits by tier:

Difficulty	Recommended Time Limit
Easy	5 minutes — sufficient to fix a simple CSS property, creates urgency
Medium	12 minutes — enough for layout fixes without being too relaxed
Hard	20 minutes — complex reconstructions legitimately take time

If the time limit expires with no correct submission, it can be scored as a draw (both ELO unchanged), or a partial-score system can determine the winner based on pixel similarity at time expiry.

8. Recommended Tech Stack
Layer	Recommended Tools
Code Editor (Frontend)	Monaco Editor — same engine as VS Code, supports HTML/CSS/JS syntax highlighting, autocomplete
Live Preview Sandbox	sandboxed iframe with srcdoc — browser-native, zero server cost for preview rendering
WebSocket Server	Socket.IO (Node.js) — handles reconnection logic, rooms, and namespaces out of the box
Matchmaking Queue	Redis Sorted Sets + a Node.js worker — proven pattern, low latency, easy to scale
Match State Store	Redis Hash with TTL — ephemeral match data that auto-expires
Visual Judge	Playwright (Chromium) + Pixelmatch — open source, well-documented, reliable
Judge Job Queue	Redis LPUSH/BRPOP — simple, fast message queue for judge submissions
Database (Persistent)	PostgreSQL — match history, user profiles, ELO history, problem metadata
Backend Language	Node.js/TypeScript — consistent with frontend ecosystem, good Socket.IO support

9. Build Roadmap
Phase 1: Core Loop (MVP)
16.	Build the split-screen editor with Monaco + sandboxed iframe preview
17.	Build static challenge pages (no matchmaking yet) — load a broken challenge, fix it
18.	Build the Playwright visual judge as a standalone CLI tool you can test locally
19.	Wire up the submit button to the judge and display pass/fail
20.	Manually test 10 challenges to calibrate thresholds
Phase 2: 1v1 Matches
21.	Build the WebSocket server with Socket.IO and Redis
22.	Build the matchmaking queue (no ELO yet — just FIFO pairing)
23.	Build match rooms — both players get the same problem at the same time
24.	Wire submission events through WebSocket to the judge queue
25.	Handle disconnections and forfeits
Phase 3: ELO and Progression
26.	Add ELO calculation to match results
27.	Build player profiles with ELO history graph
28.	Add difficulty tiers to the matchmaking queue
29.	Build a leaderboard
30.	Add match history with replay capability
Phase 4: Polish and Scale
31.	Pre-warm Playwright browser pool for faster judging
32.	Add DOM assertion layer on top of pixel comparison for more reliable verdicts
33.	Build a problem authoring tool for creating new challenges
34.	Add spectator mode — allow users to watch live matches
35.	Add rematch functionality

10. Known Hard Problems and Tradeoffs
10.1 Visual Judge False Positives
The biggest reliability challenge: font rendering differences between the judge environment and the problem author's environment can cause pixel differences that are visually invisible to humans but fail the 2% threshold. Mitigations:
•	Always embed fonts as base64 in problem files — no external font loading
•	Mask regions with dynamic content (timestamps, random values) using Playwright's mask option
•	Use DOM assertions as a secondary pass when pixel comparison narrowly fails
•	Provide players with a 'preview how the judge sees it' button — renders their code through the actual judge pipeline so they can see if there are rendering discrepancies
10.2 Cheating and Abuse
•	Code injection: the sandbox attribute prevents iframe-to-parent attacks, but server-side storage of submissions should still sanitize HTML before storing or rendering in match history
•	Solution sharing: players could coordinate outside the platform. This is hard to prevent technically — focus on making the problem set large enough that memorizing answers is impractical
•	Timeout abuse: submitting correct code at the last second by watching the opponent's activity indicator. This is a legitimate strategy and not a bug
10.3 Problem Set Scalability
The platform lives and dies by its problem set quality. An authoring tool that lets you: (1) enter broken code, (2) visually confirm what 'fixed' looks like, (3) automatically capture the reference screenshot, and (4) run the judge against multiple 'valid' solutions to verify the threshold — is essential for scaling content creation.

Conclusion
A frontend 1v1 battle platform is technically achievable and represents a genuinely unique product in the competitive coding space. The four core engineering investments are:

36.	A well-sandboxed iframe-based code playground with live preview
37.	A robust visual judge combining Playwright screenshot comparison with DOM assertions
38.	A Redis-backed matchmaking system with WebSocket room management
39.	An ELO rating system with meaningful tier progression

The non-engineering investment that matters most is the problem set. The platform's differentiation comes from the quality and variety of frontend challenges. Invest in a problem authoring workflow early, and build with multiple valid solutions in mind from the start.

Good luck building it — this is a genuinely fun product to work on.
