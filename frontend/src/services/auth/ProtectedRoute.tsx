import { type JSX } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "./store/auth.store";
import { useAuth } from "./hook/useAuth";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuthStore();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white w-full">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user || !user.id) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
