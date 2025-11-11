import { useEffect, useState } from "react";
import { useAuth } from "../../services/auth/hook/useAuth";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../services/auth/api/auth";

const LoginForm = () => {
  const { login, loading, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checking,setChecking] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === "" || password.trim() === "") {
      setError?.("Fields cannot be empty");
      return;
    }
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };
 useEffect(()=>{
  const verify= async()=>{
    try {
      authClient.get("/me");
      navigate("/dashboard");
    } catch (error) {
      
    }
    finally{
      setChecking(false);
    }
  }
  verify();
 },[])
  const handleNavigation = () => {
    navigate("/register");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-4"
      >
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
          Login
        </h2>

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

        <button
          type="submit"
          disabled={loading}
          className={`bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
      </form>
      <p>
        Dont't have an account ?{" "}
        <span onClick={handleNavigation}>Register</span>
      </p>
    </div>
  );
};

export default LoginForm;
