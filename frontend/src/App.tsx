import { Route, Routes } from "react-router-dom";
import Register from "./pages/Auth/register";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./services/auth/ProtectedRoute";
import UserDashboard from "./pages/user/UserDashboard";
import Problems from "./features/Problems/pages/Problems";
import Profile from "./pages/user/Profile";
import Discussion from "./pages/user/Discussion";
import DiscussionDetail from "./pages/user/DiscussionDetail";
import Duel from "./pages/user/Duel";
import Roadmap from "./pages/user/Roadmap";
import ProblemSolve from "./pages/user/ProblemSolve";
import AdminDashboard from "./pages/admin/Dashboard";
import useAuthStore from "./services/auth/store/auth.store";
import { useEffect } from "react";
import OAuth from "./pages/Auth/OAuth";
import AdminProblems from "./pages/admin/AdminProblems";
import AdminUsers from "./pages/admin/AdminUsers";
import LandingPage from "./pages/LandingPage";

// Contest pages
import { 
  AdminContests, 
  AdminContestDetail,
  UserContests,
  UserContestDetail,
  GlobalLeaderboard
} from "./features/Contests";


function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white w-full">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/oauth/success" element={<OAuth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <Problems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/:id"
          element={
            <ProtectedRoute>
              <ProblemSolve />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests"
          element={
            <ProtectedRoute>
              <UserContests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests/:contestId"
          element={
            <ProtectedRoute>
              <UserContestDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <GlobalLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discussion"
          element={
            <ProtectedRoute>
              <Discussion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discussion/:id"
          element={
            <ProtectedRoute>
              <DiscussionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/duel"
          element={
            <ProtectedRoute>
              <Duel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems"
          element={
            <ProtectedRoute>
              <AdminProblems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/problems/:slug"
          element={
            <ProtectedRoute>
              {/* <AdminSingleProblem /> */}
              <ProblemSolve />

            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contest"
          element={
            <ProtectedRoute>
              <AdminContests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contests/:contestId"
          element={
            <ProtectedRoute>
              <AdminContestDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
