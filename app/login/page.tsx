"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, BarChart2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient red glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/8 blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-[#4f8ef7]/5 blur-[120px]" />
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
        {/* Card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top gradient accent */}
          <div className="h-[1.5px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />

          <div className="px-8 py-8">
            {/* Brand mark */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center gap-3 mb-9"
            >
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_24px_rgba(229,57,53,0.5)]">
                <BarChart2 className="h-[18px] w-[18px] text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] text-foreground uppercase">
                  10MS Analytics
                </p>
                <p className="text-[10px] text-muted-foreground tracking-wider mt-0.5">
                  Internal Intelligence
                </p>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-7"
            >
              <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Sign in to access your analytics workspace
              </p>
            </motion.div>

            {/* Error state */}
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
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@10minuteschool.com"
                  className="w-full h-11 px-4 rounded-xl bg-input border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
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
                disabled={loading}
                className="w-full h-11 mt-1 bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(229,57,53,0.35)] hover:shadow-[0_4px_32px_rgba(229,57,53,0.5)] transition-all duration-200"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </>
                )}
              </button>
            </motion.form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Need access?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
            <p className="text-[10px] text-muted-foreground/30 font-mono tracking-wider">
              10MS · Internal
            </p>
          </div>
        </div>

        {/* Bottom badge */}
        <p className="text-center text-[10px] text-muted-foreground/40 mt-5 tracking-wider uppercase">
          Restricted to @10minuteschool.com accounts
        </p>
      </motion.div>
    </main>
  );
}
