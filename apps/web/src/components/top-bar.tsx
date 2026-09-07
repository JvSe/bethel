"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Eye, EyeClosed, Menu, Moon, Search } from "reicon-react";
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
          <Menu size={18} />
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
          <Search size={16} />
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
          <Moon size={18} />
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
          {privacyVisible ? <Eye size={18} /> : <EyeClosed size={18} />}
        </button>

        {action}
      </div>
    </div>
  );
}
