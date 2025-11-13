import { Route, Routes } from "react-router-dom";
import Register from "./pages/Auth/register";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./services/auth/ProtectedRoute";
import Dashboard from "./services/users/Dashboard";
import useAuthStore from "./services/auth/store/auth.store";
import { useEffect } from "react";

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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
