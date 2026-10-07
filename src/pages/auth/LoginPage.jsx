import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Info
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();
  const navigate = useNavigate();

  // If already authenticated as SuperAdmin, navigate straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/super-admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedUser = username.trim();

    if (!trimmedUser) {
      newErrors.username = "Administrator username or email is required.";
    }
    if (!password) {
      newErrors.password = "Master password is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showWarning("Please provide both username and master password.");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const result = await login(trimmedUser, password);
      showSuccess(`Welcome, ${result.user?.name || "Platform SuperAdmin"}!`);
      navigate("/super-admin/dashboard");
    } catch (err) {
      const msg = err.message || "Invalid administrative credentials.";
      setErrors({ general: msg });
      setPassword("");
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg shadow-indigo-600/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white uppercase">
          SIPS Platform Administration
        </h1>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Root governance console for platform owners & system administrators.
        </p>
      </div>

      <div className="relative mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <div>
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">SuperAdmin Verification</h2>
              <p className="text-[11px] text-slate-400">Authenticate with root administrator credentials</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.general && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errors.general}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admin Username or Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username || errors.general) {
                      setErrors((prev) => ({ ...prev, username: "", general: "" }));
                    }
                  }}
                  placeholder="superadmin"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border bg-slate-950/60 text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 ${
                    errors.username
                      ? "border-rose-600 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-800 focus:ring-indigo-500/30 focus:border-indigo-500"
                  } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
              {errors.username && (
                <p className="text-[11px] font-medium text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Master Security Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password || errors.general) {
                      setErrors((prev) => ({ ...prev, password: "", general: "" }));
                    }
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border bg-slate-950/60 text-slate-100 text-sm focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-rose-600 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-800 focus:ring-indigo-500/30 focus:border-indigo-500"
                  } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  disabled={loading}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                Remember secure session
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Port 5175 Protected
              </span>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25"
              icon={ArrowRight}
              iconPosition="right"
            >
              {loading ? "Authenticating Root..." : "Enter SuperAdmin Console"}
            </Button>
          </form>

          {/* Access Advisory */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-snug">
              <strong>Restricted Access:</strong> Unauthorized access attempts are monitored and logged. Institutional TPOs and students must log in via their dedicated portals.
            </div>
          </div>
        </div>

        {/* Product Overview Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/landing")}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors"
          >
            Looking for platform overview? View Landing Page →
          </button>
        </div>
      </div>
    </div>
  );
}
