import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/auth/api/auth";

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetPassword(token, password);
      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      const message = err?.response?.data || err?.message || "Unable to reset password";
      setError(typeof message === "string" ? message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center flex-col">
      <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
      <p className="font-extralight m-0">Choose a strong password to continue.</p>
      <form onSubmit={handleSubmit} className="flex m-4 flex-col gap-6">
        <label className="font-bold text-black mb-0">New Password</label>
        <input
          className="border bg-transparent px-6 py-3 text-lg transition focus:outline-none"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <label className="font-bold text-black mb-0">Confirm Password</label>
        <input
          className="border bg-transparent px-6 py-3 text-lg transition focus:outline-none"
          placeholder="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-black text-white py-3 rounded font-semibold text-lg hover:bg-gray-800 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
        {error && <p className="text-red-500 text-sm text-left mt-1">{error}</p>}
        {success && <p className="text-green-600 text-sm text-left mt-1">{success}</p>}
      </form>
    </div>
  );
};

export default ResetPasswordForm;
