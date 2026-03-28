import { useAuth } from "@/lib/auth";
import { X } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  mode?: "signin" | "signup";
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function ReplitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v6H3V3zm0 6h8v6H3V9zm0 6h8v6H3v-6zm10-12h8v18H13V3z"/>
    </svg>
  );
}

export function AuthModal({ onClose, mode = "signin" }: AuthModalProps) {
  const { login } = useAuth();

  function handleLogin() {
    onClose();
    login();
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-[#1B2A4A] px-6 pt-8 pb-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-[#F5A623] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#F5A623]/30">
            <span className="font-black text-white text-lg">PT</span>
          </div>
          <h2 className="text-xl font-extrabold mb-1">
            {mode === "signup" ? "Join PocketTask" : "Welcome back"}
          </h2>
          <p className="text-white/60 text-sm">
            {mode === "signup"
              ? "Start earning or posting tasks in Pictou County."
              : "Sign in to your account to continue."}
          </p>
        </div>

        {/* Buttons */}
        <div className="px-6 py-6 space-y-3">
          {/* Google */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold text-gray-700 text-sm group"
          >
            <GoogleIcon />
            <span className="flex-1 text-left">Continue with Google</span>
            <span className="text-gray-300 group-hover:text-gray-400 text-xs">→</span>
          </button>

          {/* Apple */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-black hover:bg-gray-900 transition-all font-semibold text-white text-sm group"
          >
            <AppleIcon />
            <span className="flex-1 text-left">Continue with Apple</span>
            <span className="text-white/40 group-hover:text-white/60 text-xs">→</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Replit / email */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-[#1B2A4A]/30 hover:bg-[#1B2A4A]/5 transition-all font-semibold text-gray-600 text-sm group"
          >
            <ReplitIcon />
            <span className="flex-1 text-left">Continue with Replit</span>
            <span className="text-gray-300 group-hover:text-gray-400 text-xs">→</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            By continuing you agree to our{" "}
            <a href="/guidelines" className="text-[#1B2A4A] font-semibold hover:underline">Community Guidelines</a>.
            We keep your data private and never share it.
          </p>
        </div>
      </div>
    </div>
  );
}
