"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  variant?: "icon" | "full";
}

export function LogoutButton({ variant = "icon" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Sign out"
      className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
