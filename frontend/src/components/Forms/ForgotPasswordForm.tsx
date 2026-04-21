import { useState } from "react";
import { requestPasswordReset } from "../../services/auth/api/auth";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await requestPasswordReset(email.trim());
      setSuccess("If an account exists, a reset link has been sent.");
    } catch (err: any) {
      const message = err?.response?.data || err?.message || "Unable to request reset";
      setError(typeof message === "string" ? message : "Unable to request reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center flex-col">
      <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
      <p className="font-extralight m-0">We will email you a reset link.</p>
      <form onSubmit={handleSubmit} className="flex m-4 flex-col gap-6">
        <label className="font-bold text-black mb-0">Email</label>
        <input
          className="border bg-transparent px-6 py-3 text-lg transition focus:outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-black text-white py-3 rounded font-semibold text-lg hover:bg-gray-800 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {error && <p className="text-red-500 text-sm text-left mt-1">{error}</p>}
        {success && <p className="text-green-600 text-sm text-left mt-1">{success}</p>}
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
