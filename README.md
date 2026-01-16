# Code Arena

A full-stack web application for coding competitions and problem-solving challenges, similar to platforms like LeetCode or Codeforces.

## Features

- **User Authentication**: Register and login to access the platform
- **Problem Solving**: Browse and solve coding problems with test cases
- **Admin Dashboard**: Manage problems, test cases, and users
- **User Dashboard**: View profile, stats, recent submissions, and skill progress
- **Contests and Duels**: Participate in coding contests and duels
- **Discussion Forum**: Engage in discussions about problems

## Tech Stack

### Backend
- **Language**: Go
- **Framework**: Fiber (HTTP router)
- **Database**: PostgreSQL with GORM (via Docker)
- **Authentication**: JWT tokens and OAuth (Google)
- **Architecture**: Clean Architecture with domain, service, and repository layers

### Frontend
- **Language**: TypeScript
- **Framework**: React with Vite
- **UI Library**: Shadcn/ui components
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization

## Project Structure

```
backend/          # Go backend application
  ├── internal/   # Internal packages
  │   ├── api/    # API handlers and routes
  │   ├── domain/ # Domain models (problems, users, testcases)
  │   ├── repo/   # Data repositories
  │   └── service/# Business logic services
  ├── configs/    # Configuration files
  └── test/       # Unit tests

frontend/         # React frontend application
  ├── src/
  │   ├── Components/  # Reusable UI components
  │   ├── pages/       # Page components
  │   ├── services/    # API service clients
  │   └── types/       # TypeScript type definitions
  └── public/          # Static assets
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for frontend)
- Go (for backend development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sudan-khadka-codearena
   ```

2. **Backend Setup**
   ```bash
   cd backend
   # Install dependencies
   go mod download
   # Start services with Docker
   docker-compose up -d
   # Run the application
   go run main.go
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   # Install dependencies
   npm install
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

## Usage

- **Users**: Register/login, browse problems, solve challenges, view progress
- **Admins**: Access admin dashboard to create/manage problems and test cases, view user statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.