import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loginOtp, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const redirect = (role) => {
    if (role === "Admin") navigate("/admin");
    else if (role === "Supervisor") navigate("/supervisor");
    else navigate("/maverick");
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name}!`);
      redirect(user.role);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Login failed");
    }
  };

  const handleRequestOtp = async () => {
    try {
      await api.post("/auth/otp/request", { email });
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to send OTP");
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginOtp(email, otp);
      toast.success(`Welcome, ${user.name}!`);
      redirect(user.role);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maverick Feedback 360
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Training Feedback & Effectiveness Portal
          </p>
        </div>

        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          {["password", "otp"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {t === "password" ? "Password" : "OTP Login"}
            </button>
          ))}
        </div>

        {tab === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            {!otpSent ? (
              <button
                type="button"
                onClick={handleRequestOtp}
                className="btn-primary w-full"
              >
                Send OTP
              </button>
            ) : (
              <>
                <div>
                  <label className="label">Enter OTP</label>
                  <input
                    className="input"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-sm text-brand-600 hover:underline w-full text-center"
                >
                  Resend OTP
                </button>
              </>
            )}
          </form>
        )}

        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Demo credentials:</p>
          <p>Admin: admin@maverick360.com / Admin@123</p>
          <p>Supervisor: supervisor@maverick360.com / Supervisor@123</p>
          <p>Maverick: maverick@maverick360.com / Maverick@123</p>
        </div>
      </div>
    </div>
  );
}
