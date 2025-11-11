import { useState } from "react";
import { useAuth } from "../../services/auth/hook/useAuth";

const RegisterForm = () => {
  const { register, loading, error, setError } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() == "" || email.trim() == "" || password == "") {
      setError?.("Fields cannot be empty");
      return;
    }
    if (password !== confirm) return alert("Passwords do not match");

    try {
      await register({ username, email, password });
      alert("Registered successfully!");
    } catch (error) {
      console.log(error);
    }
  };
  const handleNavigation = () => {
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-4"
      >
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
          Register
        </h2>

        <input
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={`bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Loading..." : "Register"}
        </button>

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
      </form>
      <p>
        Already have an account ? <span onClick={handleNavigation}>Login</span>
      </p>
    </div>
  );
};

export default RegisterForm;
