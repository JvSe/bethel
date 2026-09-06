"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Accent = "salvia" | "azul" | "terracota" | "ameixa";

const accentMap: Record<Accent, { color: string; soft: string }> = {
  salvia: { color: "#4f8a6b", soft: "rgba(79,138,107,0.1)" },
  azul: { color: "#5878a8", soft: "rgba(88,120,168,0.1)" },
  terracota: { color: "#c0764f", soft: "rgba(192,118,79,0.1)" },
  ameixa: { color: "#8a5b86", soft: "rgba(138,91,134,0.1)" },
};

interface DashboardCtx {
  privacyVisible: boolean;
  togglePrivacy: () => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  maskValue: (v: string) => string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const DashboardContext = createContext<DashboardCtx | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [privacyVisible, setPrivacyVisible] = useState(true);
  const [accent, setAccentState] = useState<Accent>("salvia");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    rootRef.current = document.documentElement;
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--ds-accent", accentMap[accent].color);
    el.style.setProperty("--ds-accent-soft", accentMap[accent].soft);
  }, [accent]);

  function togglePrivacy() {
    setPrivacyVisible((v) => !v);
  }

  function setAccent(a: Accent) {
    setAccentState(a);
  }

  function maskValue(v: string): string {
    if (privacyVisible) return v;
    return v.replace(/\d[\d.,]*/g, "••••");
  }

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        privacyVisible,
        togglePrivacy,
        accent,
        setAccent,
        maskValue,
        searchQuery,
        setSearchQuery,
        sidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
