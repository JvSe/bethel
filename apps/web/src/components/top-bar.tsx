"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDashboard } from "@/contexts/dashboard-context";

interface TopBarProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export default function TopBar({ title, subtitle, action }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { privacyVisible, togglePrivacy, searchQuery, setSearchQuery, toggleSidebar, closeSidebar } = useDashboard();

  useEffect(() => {
    setSearchQuery("");
    closeSidebar();
  }, [pathname, setSearchQuery, closeSidebar]);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div
      className="topbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: "var(--ds-bg-blur)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--ds-border)",
        padding: "18px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button
          type="button"
          className="topbar-menu"
          onClick={toggleSidebar}
          title="Abrir menu"
          aria-label="Abrir menu"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 11,
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ds-muted)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7 H20" />
            <path d="M4 12 H20" />
            <path d="M4 17 H20" />
          </svg>
        </button>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 700,
              fontSize: 23,
              letterSpacing: "-0.02em",
              color: "var(--ds-text)",
            }}
          >
            {title}
          </h1>
          <div style={{ fontSize: 13, color: "var(--ds-muted)", marginTop: 3 }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <label
          className="topbar-search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 11,
            padding: "9px 13px",
            color: "var(--ds-muted)",
            fontSize: 13,
            width: 210,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16 L20 20" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar..."
            aria-label="Buscar nesta tela"
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              color: "var(--ds-text)",
              fontSize: 13,
              width: "100%",
              fontFamily: "inherit",
              padding: 0,
            }}
          />
        </label>

        <button
          onClick={toggleTheme}
          title="Tema claro / escuro"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 11,
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ds-muted)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4 A8 8 0 0 1 12 20 Z" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <button
          onClick={togglePrivacy}
          title="Mostrar/ocultar valores"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 11,
            background: privacyVisible ? "var(--ds-surface)" : "var(--ds-accent)",
            border: "1px solid var(--ds-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: privacyVisible ? "var(--ds-muted)" : "#fff",
            transition: "background 0.15s",
          }}
        >
          {privacyVisible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12 C5 6 19 6 22 12 C19 18 5 18 2 12 Z" />
              <circle cx="12" cy="12" r="2.7" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12a18.45 18.45 0 0 1 5.06-7.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8a18.5 18.5 0 0 1-2.16 3.72" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>

        {action}
      </div>
    </div>
  );
}
