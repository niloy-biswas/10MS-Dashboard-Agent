"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/google-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "10minuteschool.com" },
      },
    });
    if (error) {
      const msg = error.message.toLowerCase().includes("provider")
        ? "Google sign-in is not configured yet. Please contact your admin."
        : error.message;
      setError(msg);
      setGoogleLoading(false);
    }
  };

  const hasTypedAt = email.includes("@");
  const isValidDomain = email.endsWith("@10minuteschool.com");
  const showDomainFeedback = hasTypedAt;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidDomain) {
      setError("Only @10minuteschool.com email addresses are allowed.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Sign in immediately (email confirmation disabled)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setError("Account created! Please check your email and confirm your address before signing in.");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[700px] h-[600px] rounded-full bg-primary/7 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#4f8ef7]/5 blur-[120px]" />
      </div>

      {/* Vertical accent lines */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[380px]"
      >
        <div className="bg-card border border-border/60 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top accent */}
          <div className="h-[1.5px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />

          <div className="px-8 py-8">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center gap-1 mb-7"
            >
              <img
                src="/TenTen Lottie Animation Blink Smile.gif"
                alt="TenTen"
                className="h-20 w-20 object-contain mb-1"
              />
              <p className="text-2xl font-black tracking-tight text-center font-mono bg-gradient-to-r from-[#d63031] via-[#a855b5] to-[#4c51bf] bg-clip-text text-transparent">
                10MS Analytics
              </p>
              <p className="text-xs text-muted-foreground tracking-widest text-center uppercase">
                Internal Intelligence
              </p>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-7"
            >
              <h1 className="text-lg font-semibold text-foreground tracking-tight leading-tight text-center">
                Request access
              </h1>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Create your account with your 10MS email
              </p>
            </motion.div>

            {/* Google sign-up */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="mb-5"
            >
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full h-11 bg-card hover:bg-muted/60 active:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border/60 hover:border-border text-foreground text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200"
              >
                {googleLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    Continue with Google
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground/50 text-center mt-2">
                Name and photo are pulled from your Google account automatically
              </p>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs text-muted-foreground/50 uppercase tracking-[0.12em]">
                  or sign up with email
                </span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/25 rounded-xl px-4 py-3 mb-5 text-sm text-destructive overflow-hidden"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              onSubmit={handleSignup}
              className="space-y-4"
            >
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full h-11 px-4 rounded-xl bg-input border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@10minuteschool.com"
                    className={`w-full h-11 px-4 pr-10 rounded-xl bg-input border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      showDomainFeedback
                        ? isValidDomain
                          ? "border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/15"
                          : "border-destructive/50 focus:border-destructive/70 focus:ring-destructive/15"
                        : "border-border/60 focus:border-primary/50 focus:ring-primary/15"
                    }`}
                  />
                  {showDomainFeedback && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {isValidDomain ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {showDomainFeedback && !isValidDomain && (
                  <p className="text-xs text-destructive/80 mt-1">
                    Must be a @10minuteschool.com address
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    className="w-full h-11 px-4 pr-12 rounded-xl bg-input border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (showDomainFeedback && !isValidDomain)}
                className="w-full h-11 mt-1 bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(229,57,53,0.35)] hover:shadow-[0_4px_32px_rgba(229,57,53,0.5)] transition-all duration-200"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </>
                )}
              </button>
            </motion.form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Already have access?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
            <p className="text-xs text-muted-foreground/30 tracking-wide">
              Built by the creators of TenTen
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-5 tracking-wider uppercase">
          Restricted to @10minuteschool.com accounts
        </p>

      </motion.div>
    </main>
  );
}
