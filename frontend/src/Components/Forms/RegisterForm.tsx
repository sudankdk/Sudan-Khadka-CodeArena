import { useState } from "react";
import { useAuth } from "../../services/auth/hook/useAuth";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { server } from '../../constants/server';

const RegisterForm = () => {
  const { register, loading, error, setError } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = server + "auth/" + provider;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError?.("Fields cannot be empty");
      return;
    }
    if (password !== confirm) {
      setError?.("Passwords do not match");
      return;
    }
    try {
      await register({ username, email, password });
      alert("Registered successfully!");
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const handleNavigation = () => navigate("/login");

  return (
    <div className="w-full flex items-center justify-center flex-col">
      <h2 className="text-2xl font-bold mb-1 mt-2">Create Account</h2>
      <p className="font-light text-sm mb-6 ">
        Join us and start your journey
      </p>
      <form onSubmit={handleSubmit} className="flex m-0 flex-col gap-4 w-full max-w-md">
        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-gray-700 mb-0 leading-tight" htmlFor="register-username">
            Username
          </label>
          <input
            id="register-username"
            className="border  bg-transparent px-5 py-2.5 text-base rounded-md transition focus:outline-none  "
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-gray-700 mb-0 leading-tight" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            className="border  bg-transparent px-5 py-2.5 text-base rounded-md transition focus:outline-none  "
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-gray-700 mb-0 leading-tight" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            className="border  bg-transparent px-5 py-2.5 text-base rounded-md transition focus:outline-none  "
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <label className="font-medium text-gray-700 mb-0 leading-tight" htmlFor="register-confirm">
            Confirm Password
          </label>
          <input
            id="register-confirm"
            className="border  bg-transparent px-5 py-2.5 text-base rounded-md transition focus:outline-none  "
            placeholder="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {/* Register Button */}
        <button
          type="submit"
          disabled={loading}
          className={`bg-black text-white py-2.5 mt-2 rounded font-semibold text-base hover:bg-gray-800 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Loading..." : "Register"}
        </button>
        {error && (
          <p className="text-red-500 text-sm text-left mt-2">{error}</p>
        )}
      </form>
      {/* OAuth / Navigation */}
      <div className="mt-7 text-left text-base w-full max-w-md">
        <p className="text-indigo-900 mb-4">
          Already have an account?{" "}
          <span
            onClick={handleNavigation}
            className="text-indigo-600 cursor-pointer font-medium hover:underline"
          >
            Login
          </span>
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleOAuth("google")}
            className="w-full flex gap-2 justify-center items-center text-indigo-800 border-b border-indigo-200 py-2 bg-transparent font-medium hover:text-indigo-600 transition"
          >
            <FcGoogle />
            Register with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;