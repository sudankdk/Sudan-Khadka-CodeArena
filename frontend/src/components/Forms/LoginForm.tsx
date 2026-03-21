import { useEffect, useState } from "react";
import { useAuth } from "../../services/auth/hook/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../services/auth/store/auth.store";
import { server } from '../../constants/server';
import { FcGoogle } from "react-icons/fc";

const LoginForm = () => {
  const { login, loading, error, setError } = useAuth();
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = server + "auth/" + provider;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError?.("Fields cannot be empty");
      return;
    }
    try {
      await login({ email, password });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (
      (location.pathname === "/login" || location.pathname === "/register") &&
      user?.id
    ) {
      if (user.role === "regular") navigate("/dashboard", { replace: true });
      if (user.role === "admin")
        navigate("/admin/dashboard", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleNavigation = () => navigate("/register");

  return (
    <div className="w-full flex items-center justify-center flex-col">
      <h2 className="text-2xl font-bold  mb-2">Welcome Back!</h2>
      <p className="font-extralight m-0">Let's gets you back</p>
      <form onSubmit={handleSubmit} className="flex m-4 flex-col gap-6">
        <label className="font-bold text-black mb-0 ">Email</label>
        <input
          className="border  bg-transparent px-6 py-3 text-lg transition focus:outline-none "
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <label className="font-bold text-black mb-0 ">Password</label>
        <input
          className="border  bg-transparent px-6 py-3 text-lg transition focus:outline-none  "
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-black text-white py-3 rounded font-semibold text-lg hover:bg-gray-800 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Loading..." : "Login"}
        </button>
        {error && (
          <p className="text-red-500 text-sm text-left mt-1">{error}</p>
        )}
      </form>
      <div className="mt-8 text-left text-base">
        <p className="text-indigo-900">
          Don’t have an account?{" "}
          <span
            onClick={handleNavigation}
            className="text-indigo-600 cursor-pointer font-medium hover:underline"
          >
            Register
          </span>
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => handleOAuth("google")}
            className="w-full flex gap-3 justify-center items-center  text-indigo-800 border-b border-indigo-200 py-2 bg-transparent font-medium hover:text-indigo-600 transition"
          >
            {<FcGoogle />}
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
