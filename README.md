# CodeArena

CodeArena is a comprehensive, full-stack competitive programming platform designed to help users sharpen their algorithmic and data-structure skills through interactive problem solving, real-time multiplayer coding battles, timed contests, community discussions, and personalized learning roadmaps. Built as a Final Year Project, the system provides a unified environment — similar to platforms like LeetCode or Codeforces — where users can write, execute, and have their code evaluated against predefined test cases, all from within the browser.

---

## Project Objective

The primary objective of this project is to develop a scalable, web-based competitive programming system that:

- Provides a centralized platform for practicing coding problems categorized by difficulty and topic tags.
- Enables real-time, head-to-head multiplayer coding battles using WebSockets.
- Supports scheduled coding contests with dynamic scoring, time penalties, and a live leaderboard.
- Offers personalized learning roadmaps that let users track their progress across topics.
- Integrates a sandboxed Code Execution Engine (CEE) for secure, isolated evaluation of user-submitted code in multiple programming languages.
- Empowers administrators with a dedicated dashboard for managing problems, test cases, users, and contests.

---

## Features

The system provides the following features:

| Category | Feature | Description |
|---|---|---|
| **Authentication** | User Registration | Email/password-based account creation with input validation |
| | User Login | Secure JWT-based authentication with access tokens |
| | Google OAuth | One-click sign-in via Google accounts |
| | Password Reset | Email-based password recovery flow using SMTP |
| | Secure Logout | JWT token invalidation and session cleanup |
| **Problem Solving** | Problem Browser | Browse, search, and filter problems by difficulty (Easy, Medium, Hard) and tags |
| | Code Editor | In-browser Monaco editor with syntax highlighting and language selection |
| | Code Execution | Submit code against hidden test cases; receive Accepted/Wrong Answer/TLE/RE verdicts |
| | Submission History | View all past submissions with status, language, and timestamps |
| **Battles (1v1)** | Matchmaking Queue | Join a real-time WebSocket matchmaking queue to find opponents |
| | Live Coding Duel | Both players solve the same problem simultaneously; first to pass all test cases wins |
| | Battle Results | Post-match result screen with winner declaration and rating changes |
| **Contests (Arena)** | Contest Listing | View all contests filtered by status: Upcoming, Active, and Ended |
| | Contest Participation | Join active contests and solve the assigned problem set |
| | Dynamic Scoring | Points awarded based on base score minus time penalty and wrong-submission penalty |
| | Live Leaderboard | Real-time ranked leaderboard updated via WebSocket broadcasts |
| **Leaderboard (Kings)** | Global Rankings | View top 50/100/200/500 programmers ranked by contest rating |
| | Podium Display | Top 3 users highlighted with medal badges and rating |
| **Discussions (Discuss)** | Discussion Forum | Create discussion threads with titles, content, and topic tags |
| | Commenting System | Post comments and replies with upvote/downvote functionality |
| | View Tracking | Track view count on each discussion post |
| **Roadmaps** | Custom Roadmaps | Create or enroll in topic-based learning roadmaps |
| | Node-Based Tracking | Each roadmap consists of topic nodes containing linked problems |
| | Progress Calculation | Automatic progress tracking as linked problems are solved |
| **AI Hints** | Gemini Integration | AI-powered hints for problems using the Google Gemini API |
| **Admin Panel** | Problem Management | Full CRUD operations for problems with test case editor |
| | User Management | View, search, and manage all registered users |
| | Contest Management | Create and configure coding contests |
| | Admin Dashboard | Platform-wide statistics: total users, problems, submissions |

---

## Technologies Used

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.1 | UI component framework |
| TypeScript | ~5.9.3 | Type-safe JavaScript |
| Vite | 7.1.7 | Build tool and dev server |
| Tailwind CSS | 4.1.17 | Utility-first CSS framework |
| Shadcn/ui | — | Pre-built accessible UI components (Button, Card, Dialog, Input, Pagination, etc.) |
| Monaco Editor | 4.7.0 | In-browser code editor (same editor as VS Code) |
| React Router DOM | 7.9.5 | Client-side routing and navigation |
| TanStack React Query | 5.90.20 | Server state management and data fetching/caching |
| Zustand | 5.0.8 | Lightweight client state management |
| Axios | 1.13.2 | HTTP client for API requests |
| Recharts | 2.15.4 | Charting library for data visualization on dashboards |
| React Toastify | 11.0.5 | Toast notification system |
| Lucide React | 0.553.0 | Icon library |
| JetBrains Mono / Outfit / Roboto | — | Custom fonts for the UI |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Go (Golang) | 1.24.0 (toolchain 1.24.10) | Backend programming language |
| Fiber | 2.52.9 | High-performance HTTP web framework |
| GORM | 1.31.1 | ORM for database operations |
| PostgreSQL Driver (pgx) | 5.6.0 | PostgreSQL database driver |
| golang-jwt | 5.3.0 | JWT token generation and validation |
| Goth / goth_fiber | 1.82.0 / 0.3.2 | OAuth authentication (Google) |
| go-redis | 9.18.0 | Redis client for caching and leaderboards |
| Zap Logger | 1.27.1 | Structured logging |
| Google GenAI SDK | 1.48.0 | Gemini API integration for AI hints |
| gorilla/websocket | 1.5.3 | WebSocket support for real-time battles |
| chromedp | 0.14.2 | Headless Chrome for server-side rendering/screenshots |
| Testify | 1.11.1 | Unit testing framework with assertions and mocks |

### Code Execution Engine (CEE)

| Technology | Version | Purpose |
|---|---|---|
| Go (Golang) | 1.24.10 | CEE backend language |
| Fiber | 2.52.10 | HTTP API framework for CEE |
| Docker SDK | 28.5.2 | Programmatic Docker container management |
| Docker Containers | — | Sandboxed execution environments per language |

**Supported Languages:**

| Language | Docker Image | File Extension |
|---|---|---|
| Python | `cee-python` | `.py` |
| JavaScript (Node.js) | `cee-node` | `.js` |
| Go | `cee-go` | `.go` |

### Database

| Technology | Version | Purpose |
|---|---|---|
| PostgreSQL | 18 | Primary relational database for all application data |
| Redis | 7 (Alpine) | In-memory store for leaderboard sorted sets and caching |

### Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://sudan-khadka-code-arena.vercel.app/ |
| Backend + API | Render | Hosted as a Docker web service |
| Database | Render | Managed PostgreSQL (Render starter plan) |
| Redis | Render | Managed Redis instance (Render starter plan) |

---

## System Requirements

### For End Users (Accessing the Deployed Application)

| Requirement | Specification |
|---|---|
| Device | Any computer, laptop, tablet, or smartphone |
| Internet | Stable broadband connection (minimum 1 Mbps recommended for real-time battles) |
| Browser | Google Chrome 90+, Mozilla Firefox 88+, Microsoft Edge 90+, or Safari 14+ |
| JavaScript | Must be enabled in the browser |
| Cookies | Must be enabled (required for JWT authentication) |

### For Local Development

#### Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| Processor | Dual-core CPU (Intel i3 / AMD Ryzen 3) | Quad-core CPU (Intel i5 / AMD Ryzen 5 or above) |
| RAM | 4 GB | 8 GB or higher |
| Storage | 2 GB free disk space | 5 GB free disk space (for Docker images) |
| Internet | Required for dependency installation and OAuth | Stable broadband |

#### Software Requirements

| Software | Required Version | Download Link |
|---|---|---|
| **Node.js** | v18.0.0 or higher | https://nodejs.org/ |
| **npm** | v9.0.0 or higher (bundled with Node.js) | — |
| **Go** | v1.24.0 or higher | https://go.dev/dl/ |
| **Docker Desktop** | v4.0.0 or higher | https://www.docker.com/products/docker-desktop/ |
| **Docker Compose** | v2.0.0 or higher (bundled with Docker Desktop) | — |
| **Git** | v2.30.0 or higher | https://git-scm.com/downloads |
| **Web Browser** | Chrome 90+, Firefox 88+, or Edge 90+ | — |
| **Operating System** | Windows 10/11, macOS 12+, or Ubuntu 20.04+ | — |

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sudankdk/Sudan-Khadka-CodeArena.git
```

### 2. Navigate to the Project Folder

```bash
cd Sudan-Khadka-CodeArena
```

### 3. Backend Setup

```bash
cd backend
```

#### 3.1 Configure Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# App Configuration
APP_ENV=development
PORT=8080

# Database Configuration
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=codearena
DSN=postgres://your_postgres_user:your_postgres_password@localhost:5432/codearena?sslmode=disable

# JWT Secret Key
SECRETKEY=your_jwt_secret_key

# Google OAuth Configuration
CLIENTID=your_google_client_id
CLIENTSECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback

# Google Gemini API (for AI Hints)
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_API_URL=https://generativelanguage.googleapis.com/v1beta

# Redis Configuration
redis_host=localhost
redis_port=6379
redis_url=redis://localhost:6379

# Frontend URL (for CORS and password reset links)
FRONTEND_URL=http://localhost:5173

# SMTP Configuration (for Password Reset Emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_FROM_NAME=CodeArena
SMTP_USE_TLS=false
PASSWORD_RESET_TTL_MINUTES=30
```

#### 3.2 Start PostgreSQL and Redis via Docker

```bash
docker-compose up -d postgres redis
```

This starts:
- **PostgreSQL 18** on port `5432`
- **Redis 7 (Alpine)** on port `6379`

#### 3.3 Install Go Dependencies

```bash
go mod download
```

#### 3.4 Run the Backend Server

```bash
go run main.go
```

The backend API will be available at: **http://localhost:8080**

### 4. Frontend Setup

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
```

#### 4.1 Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080
VITE_JUDGE0_URL=your_judge0_api_url
VITE_JUDGE0_HOST=your_judge0_host
VITE_JUDGE0_KEY=your_judge0_api_key
```

#### 4.2 Install npm Dependencies

```bash
npm install
```

#### 4.3 Run the Frontend Development Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 5. Code Execution Engine (CEE) Setup (Optional — for local code execution)

Open another terminal and navigate to the CEE directory:

```bash
cd CodeExecutionEngine
```

#### 5.1 Build the Language-Specific Docker Images

```bash
cd docker
docker build -t cee-python ./python
docker build -t cee-node ./node
docker build -t cee-go ./go
cd ..
```

#### 5.2 Run the CEE Server

```bash
go mod download
go run main.go
```

The Code Execution Engine will be available at: **http://localhost:3000**

> **Note:** Docker must be running and accessible for the CEE to spawn sandboxed containers for each submission.

---

## Live Project

| Component | URL |
|---|---|
| **Frontend (Live)** | https://sudan-khadka-code-arena.vercel.app/ |
| **Backend API (Live)** | Hosted on Render (auto-deployed from the `backend/` directory) |

---

## Project Structure

```
Sudan-Khadka-CodeArena/
│
├── frontend/                           # React + TypeScript Frontend (Vite)
│   ├── public/                         # Static assets
│   ├── src/
│   │   ├── App.tsx                     # Root component with route definitions
│   │   ├── main.tsx                    # Application entry point
│   │   ├── index.css                   # Global styles and Tailwind directives
│   │   │
│   │   ├── pages/                      # Page-level components (route targets)
│   │   │   ├── LandingPage.tsx         # Public landing/home page
│   │   │   ├── Auth/                   # Authentication pages
│   │   │   │   ├── Login.tsx           # User login form
│   │   │   │   ├── register.tsx        # User registration form
│   │   │   │   ├── ForgotPassword.tsx  # Forgot password request
│   │   │   │   ├── ResetPassword.tsx   # Password reset with token
│   │   │   │   └── OAuth.tsx           # Google OAuth callback handler
│   │   │   ├── user/                   # Authenticated user pages
│   │   │   │   ├── UserDashboard.tsx   # User home dashboard with stats
│   │   │   │   ├── ProblemSolve.tsx    # Problem detail + code editor page
│   │   │   │   ├── Arena.tsx           # Contest listing and management
│   │   │   │   ├── Duel.tsx            # 1v1 battle matchmaking lobby
│   │   │   │   ├── BattleArena.tsx     # Live battle coding interface
│   │   │   │   ├── BattleResult.tsx    # Post-battle result screen
│   │   │   │   ├── Discussion.tsx      # Discussion forum listing
│   │   │   │   ├── DiscussionDetail.tsx# Individual discussion thread
│   │   │   │   ├── Kings.tsx           # Global leaderboard page
│   │   │   │   ├── Roadmap.tsx         # Learning roadmap viewer
│   │   │   │   └── Profile.tsx         # User profile and settings
│   │   │   └── admin/                  # Admin-only pages
│   │   │       ├── Dashboard.tsx       # Admin overview with statistics
│   │   │       ├── AdminProblems.tsx   # Problem CRUD management
│   │   │       ├── AdminSingleProblem.tsx # Single problem editor
│   │   │       ├── AdminUsers.tsx      # User management table
│   │   │       └── AdminContests.tsx   # Contest management
│   │   │
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── ui/                     # Shadcn/ui primitives
│   │   │   │   ├── button.tsx          # Button component
│   │   │   │   ├── card.tsx            # Card component
│   │   │   │   ├── chart.tsx           # Chart wrapper component
│   │   │   │   ├── dialog.tsx          # Modal dialog component
│   │   │   │   ├── input.tsx           # Text input component
│   │   │   │   ├── label.tsx           # Form label component
│   │   │   │   ├── pagination.tsx      # Pagination component
│   │   │   │   ├── skeleton.tsx        # Loading skeleton placeholder
│   │   │   │   ├── switch.tsx          # Toggle switch component
│   │   │   │   ├── textarea.tsx        # Textarea component
│   │   │   │   └── alert.tsx           # Alert/notification component
│   │   │   ├── Forms/                  # Form components (login, register, etc.)
│   │   │   ├── cards/                  # Card-based display components
│   │   │   ├── charts/                 # Dashboard chart components
│   │   │   ├── table/                  # Data table components
│   │   │   ├── battle/                 # Battle-specific UI components
│   │   │   ├── admin/                  # Admin-specific components
│   │   │   ├── UserSidebar.tsx         # User navigation sidebar
│   │   │   ├── AdminSidebar.tsx        # Admin navigation sidebar
│   │   │   ├── UserDashboardLayout.tsx # User layout wrapper
│   │   │   ├── AdminDashboardLayout.tsx# Admin layout wrapper
│   │   │   ├── AuthLayout.tsx          # Auth pages layout wrapper
│   │   │   └── AnimatedGridBackground.tsx # Animated landing page background
│   │   │
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useProblems.ts          # Problem fetching and management
│   │   │   ├── useBattle.ts            # Battle state management
│   │   │   ├── useBattleWebSocket.ts   # WebSocket connection for battles
│   │   │   ├── useDiscussions.ts       # Discussion data hooks
│   │   │   ├── useSubmissions.ts       # Submission history hooks
│   │   │   ├── useAdminStats.ts        # Admin statistics hooks
│   │   │   └── useHint.ts             # AI hint request hook
│   │   │
│   │   ├── services/                   # API service layer
│   │   │   ├── auth/                   # Authentication API calls
│   │   │   └── users/                  # User-related API calls
│   │   │
│   │   ├── types/                      # TypeScript type definitions
│   │   │   ├── auth/                   # Auth-related types
│   │   │   ├── battle/                 # Battle-related types
│   │   │   ├── contest/               # Contest-related types
│   │   │   ├── discussion/            # Discussion-related types
│   │   │   ├── problemstest/          # Problem and test case types
│   │   │   ├── roadmap/               # Roadmap-related types
│   │   │   ├── submission/            # Submission-related types
│   │   │   └── user/                  # User-related types
│   │   │
│   │   ├── features/                   # Feature-specific modules
│   │   │   ├── Contests/              # Contest feature logic
│   │   │   └── Problems/             # Problem feature logic
│   │   │
│   │   ├── constants/                  # Application constants
│   │   │   ├── Icons.tsx              # Icon definitions
│   │   │   ├── Images.tsx             # Image imports
│   │   │   └── server.tsx             # Server URL constants
│   │   │
│   │   └── lib/                        # Utility functions
│   │       └── utils.ts               # General helper utilities
│   │
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # npm dependencies and scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── tsconfig.app.json              # App-specific TS config
│   ├── tsconfig.node.json             # Node-specific TS config
│   ├── vite.config.ts                  # Vite build configuration
│   ├── eslint.config.js               # ESLint configuration
│   ├── components.json                # Shadcn/ui configuration
│   └── vercel.json                     # Vercel deployment config (SPA rewrites)
│
├── backend/                            # Go (Fiber) Backend API
│   ├── main.go                         # Application entry point
│   ├── Dockerfile                      # Multi-stage Docker build (golang:1.24.10 → alpine:3.18)
│   ├── docker-compose.yml              # Docker Compose for PostgreSQL, Redis, and backend
│   ├── Makefile                        # Build automation commands
│   ├── go.mod                          # Go module definition and dependencies
│   ├── go.sum                          # Dependency checksums
│   │
│   ├── configs/                        # Application configuration
│   │   └── appConfigs.go              # Environment variable loader and config struct
│   │
│   ├── internal/                       # Core application code (Clean Architecture)
│   │   ├── api/                        # HTTP API layer
│   │   │   ├── server.go              # Fiber app setup, middleware, and route registration
│   │   │   └── rest/                  # REST handlers
│   │   │       ├── httphandleres.go   # HTTP handler interface definitions
│   │   │       ├── response.go        # Standardized API response helpers
│   │   │       └── handlers/          # Route handler implementations
│   │   │           ├── userhandlers.go          # User auth and profile endpoints
│   │   │           ├── ProblemTesthandlers.go    # Problem and test case CRUD endpoints
│   │   │           ├── submissionhandlers.go     # Code submission endpoints
│   │   │           ├── contesthandlers.go        # Contest management endpoints
│   │   │           ├── battle_handlers.go        # Battle/duel endpoints
│   │   │           ├── discussionhandlers.go     # Discussion forum endpoints
│   │   │           ├── roadmap_handlers.go       # Roadmap endpoints
│   │   │           ├── hint_handler.go           # AI hint generation endpoint
│   │   │           └── admin_stats_handlers.go   # Admin statistics endpoint
│   │   │
│   │   ├── domain/                     # Domain models (database entities)
│   │   │   ├── user.go                # User model
│   │   │   ├── problems.go           # Problem model
│   │   │   ├── testcase.go           # Test case model
│   │   │   ├── submission.go         # Submission model
│   │   │   ├── contests.go           # Contest and contest-related models
│   │   │   ├── battleroom.go         # Battle room and match models
│   │   │   ├── discussion.go         # Discussion and comment models
│   │   │   ├── roadmap.go            # Roadmap and node models
│   │   │   ├── leaderboard.go        # Leaderboard entry model
│   │   │   ├── password_reset.go     # Password reset token model
│   │   │   └── Boilerplate.go        # Boilerplate code templates per language
│   │   │
│   │   ├── dto/                        # Data Transfer Objects (request/response shapes)
│   │   │   ├── userdto.go            # User DTOs
│   │   │   ├── problemsdto.go        # Problem DTOs
│   │   │   ├── submissiondto.go      # Submission DTOs
│   │   │   ├── contest.go            # Contest DTOs
│   │   │   ├── battle_dto.go         # Battle DTOs
│   │   │   ├── discussiondto.go      # Discussion DTOs
│   │   │   ├── roadmap_dto.go        # Roadmap DTOs
│   │   │   ├── hint_dto.go           # Hint DTOs
│   │   │   ├── admin_stats_dto.go    # Admin statistics DTOs
│   │   │   └── pagination.go         # Pagination request/response DTO
│   │   │
│   │   ├── service/                    # Business logic layer
│   │   │   ├── userservice.go         # User registration, login, profile logic
│   │   │   ├── ProblemTestcaseService.go # Problem and test case CRUD logic
│   │   │   ├── submissionservice.go   # Submission creation and retrieval
│   │   │   ├── judge_service.go       # Code judging: sends code to CEE, compares outputs
│   │   │   ├── contestservice.go      # Contest lifecycle management
│   │   │   ├── contestscoringservice.go # Contest scoring with time/penalty calculations
│   │   │   ├── battle_service.go      # Battle matchmaking and game logic
│   │   │   ├── discussionservice.go   # Discussion CRUD and voting logic
│   │   │   ├── roadmap_service.go     # Roadmap creation and progress tracking
│   │   │   ├── hint_service.go        # AI hint generation via Gemini API
│   │   │   ├── admin_stats_service.go # Admin dashboard statistics
│   │   │   ├── seed_challenges.go     # Initial problem/challenge seeder
│   │   │   ├── mocks_test.go          # Shared mock implementations for testing
│   │   │   ├── user_service_test.go   # User service unit tests
│   │   │   ├── judge_service_test.go  # Judge service unit tests
│   │   │   ├── battle_service_test.go # Battle service unit tests
│   │   │   ├── roadmap_service_test.go# Roadmap service unit tests
│   │   │   └── contest_scoring_service_test.go # Scoring service unit tests
│   │   │
│   │   ├── repo/                       # Data access / repository layer
│   │   │   ├── userrepo.go            # User database queries
│   │   │   ├── problemsrepo.go        # Problem database queries
│   │   │   ├── testcaserepo.go        # Test case database queries
│   │   │   ├── submissionrepo.go      # Submission database queries
│   │   │   ├── contestrepo.go         # Contest database queries
│   │   │   ├── battle_repo.go         # Battle database queries
│   │   │   ├── discussionrepo.go      # Discussion database queries
│   │   │   ├── roadmap_repo.go        # Roadmap database queries
│   │   │   ├── admin_stats_repo.go    # Admin statistics queries
│   │   │   ├── password_reset_repo.go # Password reset token queries
│   │   │   ├── frontend_challenge_repo.go # Frontend challenge queries
│   │   │   └── Pagination.go          # Generic pagination helper
│   │   │
│   │   ├── mapper/                     # Object mappers (domain ↔ DTO conversion)
│   │   │   └── problemtestcasemapper.go # Problem/test case mapping functions
│   │   │
│   │   ├── middleware/                 # HTTP middleware
│   │   │   └── logging.go            # Request logging middleware
│   │   │
│   │   ├── helper/                     # Utility helpers
│   │   │   ├── auth.go               # JWT generation, validation, and password hashing
│   │   │   ├── auth_test.go           # Auth helper unit tests
│   │   │   └── mailer.go             # SMTP email sending utility
│   │   │
│   │   ├── logger/                     # Logging setup
│   │   │   └── logger.go             # Zap logger initialization
│   │   │
│   │   └── ws/                         # WebSocket module (real-time battles)
│   │       ├── hub.go                 # WebSocket hub managing all active rooms
│   │       ├── client.go             # WebSocket client connection handler
│   │       ├── handler.go            # WebSocket upgrade and message routing
│   │       ├── matchmaking.go        # Matchmaking queue and pairing algorithm
│   │       ├── message.go            # WebSocket message type definitions
│   │       └── connection_ws.go      # WebSocket connection interface
│   │
│   ├── migrations/                     # SQL database migration files
│   │   ├── 002_remove_discussion_problem_fk.sql
│   │   ├── 003_add_is_rated_to_contests.sql
│   │   └── 004_create_contest_tables.sql
│   │
│   ├── test/                           # Additional test utilities
│   └── screenshots/                    # Server-generated screenshots (for OG images, etc.)
│
├── CodeExecutionEngine/                # Sandboxed Code Execution Engine (CEE)
│   ├── main.go                         # CEE entry point (Fiber server on port 3000)
│   ├── Dockerfile                      # Multi-stage Docker build for CEE
│   ├── docker-compose.yml              # Docker Compose for CEE services
│   ├── Makefile                        # Build and run commands for CEE
│   ├── go.mod                          # Go module definition
│   ├── go.sum                          # Dependency checksums
│   ├── README.md                       # CEE-specific documentation
│   │
│   ├── internal/
│   │   ├── api/                        # CEE API route handlers
│   │   ├── Executer/                   # Code execution orchestrator
│   │   │   └── executor.go            # Manages Docker container lifecycle per submission
│   │   ├── sandbox/                    # Sandbox configuration
│   │   │   └── sandbox.go            # Container resource limits and security policies
│   │   ├── languages/                  # Language configuration
│   │   │   ├── languages.json        # Supported language definitions (image, entry, extension)
│   │   │   └── loader.go            # JSON language config loader
│   │   ├── docker/                     # Docker-related utilities
│   │   └── utils/                      # General utility functions
│   │
│   └── docker/                         # Language-specific Docker images
│       ├── python/                     # Python execution environment (Dockerfile + entrypoint)
│       ├── node/                       # Node.js execution environment (Dockerfile + entrypoint)
│       └── go/                         # Go execution environment (Dockerfile + entrypoint)
│
├── screenshots/                        # Application screenshots for documentation
├── render.yaml                         # Render.com deployment configuration (backend + DB + Redis)
├── .github/                            # GitHub Actions and CI/CD workflows
└── README.md                           # This file
```

---

## Screenshots

### Application Logo
![CodeArena Logo](screenshots/logo.png)

### Landing Page
![Landing Page](screenshots/landing_page.png)

### Login Page — Email/Password and Google OAuth
![Login Page](screenshots/login_page.png)

### Registration Page — Create a New Account
![Register Page](screenshots/register_page.png)

### User Dashboard — Stats, Charts, and Recent Activity
![User Dashboard](screenshots/user_dashboard.png)

### Problem Solving — Monaco Code Editor with Test Cases
![Problem Solving](screenshots/problem_solve.png)

### Roadmap — Topic-Based Learning Path with Progress Tracking
![Roadmap](screenshots/roadmap.png)

### Contests Page — Browse Upcoming, Active, and Ended Contests
![Contests Page](screenshots/contests_page.png)

### Contest Leaderboard — Live Rankings with Scoring
![Contest Leaderboard](screenshots/contest_leaderboard.png)

### 1v1 Battle Arena — Real-Time Matchmaking and Coding Duels
![Battle Arena](screenshots/battle_arena.png)

### Discussion Forum — Thread Detail with Tags and Voting
![Discussion Thread](screenshots/discussion_thread.png)

### Discussion Comments — Nested Replies with Upvote/Downvote
![Discussion Comments](screenshots/discussion_comments.png)

### Global Leaderboard (Kings) — Top Programmers by Contest Rating
![Global Leaderboard](screenshots/global_leaderboard.png)

### Admin Dashboard — Platform Statistics and Management
![Admin Dashboard](screenshots/admin_dashboard.png)

> **Note:** Place the corresponding screenshot image files in the `screenshots/` directory at the project root with the filenames referenced above.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `APP_ENV` | Yes | Application environment (`development` or `production`) |
| `PORT` | Yes | HTTP server port (default: `8080`) |
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_NAME` | Yes | PostgreSQL database name |
| `DSN` | Yes | Full PostgreSQL connection string |
| `SECRETKEY` | Yes | Secret key for JWT token signing |
| `CLIENTID` | Yes | Google OAuth 2.0 Client ID |
| `CLIENTSECRET` | Yes | Google OAuth 2.0 Client Secret |
| `GOOGLE_CALLBACK_URL` | Yes | OAuth callback URL |
| `GOOGLE_API_KEY` | Yes | Google Gemini API key (for AI hints) |
| `GOOGLE_API_URL` | Yes | Gemini API base URL |
| `redis_host` | Yes | Redis server hostname |
| `redis_port` | Yes | Redis server port |
| `redis_url` | Yes | Full Redis connection URL |
| `FRONTEND_URL` | Yes | Frontend URL (for CORS and email links) |
| `SMTP_HOST` | Optional | SMTP mail server host |
| `SMTP_PORT` | Optional | SMTP mail server port |
| `SMTP_USER` | Optional | SMTP authentication username |
| `SMTP_PASS` | Optional | SMTP authentication password |
| `SMTP_FROM` | Optional | Sender email address |
| `SMTP_FROM_NAME` | Optional | Sender display name |
| `SMTP_USE_TLS` | Optional | Use implicit TLS (`true`) or STARTTLS (`false`) |
| `PASSWORD_RESET_TTL_MINUTES` | Optional | Password reset token expiry in minutes (default: `30`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API base URL (e.g., `http://localhost:8080`) |
| `VITE_WS_BASE_URL` | Yes | WebSocket base URL (e.g., `ws://localhost:8080`) |
| `VITE_JUDGE0_URL` | Yes | Judge0 API endpoint URL |
| `VITE_JUDGE0_HOST` | Yes | Judge0 RapidAPI host |
| `VITE_JUDGE0_KEY` | Yes | Judge0 RapidAPI key |

---

## Future Improvements

Possible improvements for the system:

- **Mobile Application:** Develop a cross-platform mobile app using React Native or Flutter for on-the-go practice.
- **Enhanced UI/UX:** Add dark/light theme toggle, custom code editor themes, and gamification badges.
- **Additional Language Support:** Extend the Code Execution Engine with C, C++, Java, and Rust sandboxed environments.
- **Advanced Anti-Cheat:** Implement plagiarism detection for contest submissions and tab-switch monitoring.
- **AI-Powered Analytics:** Provide personalized problem recommendations based on solving patterns, weak areas, and time complexity analysis.
- **System Scalability:** Integrate message queues (RabbitMQ or Kafka) to handle high-volume concurrent submissions during contests.
- **Collaborative Problem Solving:** Add pair programming mode where two users can code together on a shared editor.
- **Editorial System:** Allow admins and users to publish solution editorials and video explanations for problems.

---

## Authors

- **Student Name:** Sudan Khadka
- **Program / Department:** Final Year Project
- **University / College Name:** Itahari International College

---

## License

This project is created for educational purposes as part of a Final Year Project.