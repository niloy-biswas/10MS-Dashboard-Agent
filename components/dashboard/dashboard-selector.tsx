"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Zap, LayoutDashboard } from "lucide-react";
import type { Dashboard } from "@/lib/types";

interface DashboardSearchProps {
  query: string;
  onChange: (val: string) => void;
}

export function DashboardSearch({ query, onChange }: DashboardSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        id="dashboard-search"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by dashboard ID or name..."
        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[rgba(59,130,246,0.45)] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)] transition-all"
        autoFocus
      />
    </div>
  );
}

interface DashboardListItemProps {
  dashboard: Dashboard;
  isSelected: boolean;
  onSelect: (d: Dashboard) => void;
}

export function DashboardListItem({ dashboard, isSelected, onSelect }: DashboardListItemProps) {
  return (
    <motion.button
      layout
      onClick={() => onSelect(dashboard)}
      className={`w-full text-left rounded-xl px-4 py-3.5 transition-all duration-200 border group flex items-center gap-4 ${
        isSelected
          ? "border-[rgba(96,165,250,0.55)] shadow-[0_0_0_1px_rgba(96,165,250,0.20),0_0_28px_rgba(59,130,246,0.16),0_12px_40px_rgba(3,8,20,0.45)]"
          : "bg-secondary/40 border-border hover:bg-accent hover:border-[rgba(59,130,246,0.22)] hover:shadow-[0_8px_24px_rgba(4,10,22,0.35),0_0_0_1px_rgba(59,130,246,0.06)]"
      }`}
      style={isSelected ? {
        background: "linear-gradient(180deg, rgba(17,27,46,0.96) 0%, rgba(12,20,36,0.98) 100%)",
      } : {}}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
    >
      {/* ID badge */}
      <div
        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-mono font-bold tracking-wider transition-colors ${
          isSelected
            ? "bg-[rgba(59,130,246,0.16)] text-[#bfdbfe] border border-[rgba(59,130,246,0.28)]"
            : "bg-[rgba(255,255,255,0.04)] text-[#b8c4d6] group-hover:bg-[rgba(59,130,246,0.10)] group-hover:text-[#93c5fd]"
        }`}
      >
        {dashboard.dashboard_id}
      </div>

      {/* Name + vertical */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
          {dashboard.dashboard_name}
        </p>
        {dashboard.vertical && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{dashboard.vertical}</p>
        )}
      </div>

      {/* Refresh window pill */}
      {dashboard.refresh_window && (
        <span className="shrink-0 hidden sm:inline-flex items-center gap-1 text-xs text-[#b9d6ff] bg-[rgba(59,130,246,0.10)] border border-[rgba(59,130,246,0.18)] rounded-full px-2.5 py-0.5">
          <Zap className="h-2.5 w-2.5" />
          {dashboard.refresh_window}
        </span>
      )}

      <ChevronRight className={`shrink-0 h-3.5 w-3.5 transition-transform ${isSelected ? "text-[#60a5fa] translate-x-0.5" : "text-muted-foreground/40 group-hover:text-[#60a5fa]"}`} />
    </motion.button>
  );
}

interface DashboardSelectorProps {
  dashboards: Dashboard[];
  onSelect: (d: Dashboard) => void;
}

export function DashboardSelector({ dashboards, onSelect }: DashboardSelectorProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dashboard | null>(null);

  const filtered = dashboards.filter((d) => {
    const q = query.toLowerCase();
    return (
      d.dashboard_id?.toLowerCase().includes(q) ||
      d.dashboard_name?.toLowerCase().includes(q) ||
      d.vertical?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (d: Dashboard) => {
    setSelected(d);
  };

  return (
    <div className="flex flex-col gap-4">
      <DashboardSearch query={query} onChange={setQuery} />

      {/* List */}
      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 py-10 text-muted-foreground"
            >
              <LayoutDashboard className="h-8 w-8 opacity-30" />
              <p className="text-sm">No dashboards match your search</p>
            </motion.div>
          ) : (
            filtered.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <DashboardListItem
                  dashboard={d}
                  isSelected={selected?.id === d.id}
                  onSelect={handleSelect}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {selected && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => onSelect(selected)}
            className="w-full text-[#f8fbff] font-semibold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(37,99,235,0.35)] hover:shadow-[0_10px_36px_rgba(37,99,235,0.50)]"
            style={{
              background: "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)";
            }}
          >
            Open Dashboard {selected.dashboard_id}
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}