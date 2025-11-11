import { Route, Routes } from "react-router-dom";
import Register from "./pages/Auth/register";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./services/auth/ProtectedRoute";
import Dashboard from "./services/users/Dashboard";

function App() {
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
