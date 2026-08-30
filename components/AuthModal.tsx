"use client";

import { useState } from "react";
import { X, User, Store, Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { useAuth, UserRole } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { sendOtp, verifyOtp, signInDemo } = useAuth();
  const [role, setRole] = useState<UserRole>("customer");
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  if (!isOpen) return null;

  function resetState() {
    setStep(1);
    setOtpCode("");
    setError(null);
    setInfoMsg(null);
    setGeneratedOtp(null);
  }

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMsg(null);

    const res = await sendOtp(cleanEmail, role);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setInfoMsg(res.message || `Verification code sent to ${cleanEmail}`);
      if (res.otpCode) {
        setGeneratedOtp(res.otpCode);
      }
      setStep(2);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifyOtp(email.trim().toLowerCase(), cleanOtp, role);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      onClose();
      resetState();
    }
  }

  function handleDemoSignIn() {
    signInDemo(role);
    onClose();
    resetState();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-6 relative">
        <button
          onClick={() => {
            onClose();
            resetState();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Shopyland Logo" className="h-12 w-auto object-contain mx-auto" />
          <h2 className="text-2xl font-black text-[#082B5C]">
            {step === 1 ? "Email OTP Sign In" : "Enter Verification Code"}
          </h2>
          <p className="text-xs text-slate-500">
            {step === 1
              ? "We will generate a 6-digit verification code for your email."
              : `Verification code sent for ${email}`}
          </p>
        </div>

        {/* Role Selector Tabs */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === "customer"
                  ? "bg-[#082B5C] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#082B5C]"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("shopkeeper")}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === "shopkeeper"
                  ? "bg-[#082B5C] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#082B5C]"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shopkeeper / Artisan</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Prominent Verification OTP Display Banner */}
        {generatedOtp && step === 2 && (
          <div className="p-4 rounded-xl bg-[#082B5C]/5 border border-[#082B5C]/20 text-center space-y-2">
            <span className="text-xs font-bold text-[#082B5C] uppercase tracking-wider block">
              🔑 Your Verification OTP Code:
            </span>
            <div className="text-3xl font-black text-[#082B5C] tracking-widest font-mono">
              {generatedOtp}
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(generatedOtp)}
              className="mt-1 px-3 py-1.5 rounded-lg bg-[#55AEB1] text-white text-xs font-bold hover:bg-[#44979A] transition-all inline-flex items-center gap-1 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Fill {generatedOtp}</span>
            </button>
          </div>
        )}

        {/* STEP 1: Enter Email & Send OTP */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#082B5C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-navy w-full py-3.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#55AEB1]" />
                  <span>Generating Code…</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-[#55AEB1]" />
                  <span>Send Verification Code (OTP)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Enter OTP & Verify */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base font-mono tracking-widest text-[#082B5C] focus:outline-none focus:border-[#082B5C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-navy w-full py-3.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#55AEB1]" />
                  <span>Verifying Code…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#55AEB1]" />
                  <span>Verify & Sign In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-[#082B5C] font-semibold"
              >
                Change Email
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-[#55AEB1] hover:text-[#082B5C] font-bold"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Instant Demo Shortcut */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Instant Demo Access</span>
            <button
              onClick={handleDemoSignIn}
              className="text-[#082B5C] font-bold hover:underline"
            >
              Sign In as {role === "shopkeeper" ? "Shopkeeper" : "Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
