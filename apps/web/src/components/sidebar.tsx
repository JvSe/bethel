"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FamilyPopover from "@/components/family-popover";
import { useDashboard } from "@/contexts/dashboard-context";
import { Book, Calendar, Candle, Card, CartLarge, Checklist, Fridge, Heart, Home, Settings } from "reicon-react";

const navItems = [
  {
    section: "Painel",
    items: [
      { href: "/inicio", label: "Início", icon: Home },
      { href: "/financas", label: "Finanças", icon: Card },
      { href: "/compras", label: "Compras", icon: CartLarge },
      { href: "/tarefas", label: "Tarefas", icon: Checklist },
      { href: "/manutencao", label: "Manutenção", icon: Settings },
      { href: "/despensa", label: "Despensa", icon: Fridge },
      { href: "/calendario", label: "Calendário", icon: Calendar },
    ],
  },
  {
    section: "Vida de fé",
    items: [
      { href: "/devocional", label: "Devocional", icon: Book },
      { href: "/oracao", label: "Oração", icon: Candle },
      { href: "/gratidao", label: "Gratidão", icon: Heart },
    ],
  },
] as const;

interface SidebarProps {
  familyId: string;
  familyName: string;
  members: { memberId: string; userId: string; name: string; avatarColor: string; role: string }[];
  isOwner: boolean;
  currentUserId: string;
}

export default function Sidebar({ familyId, familyName, members, isOwner, currentUserId }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useDashboard();

  return (
    <>
    <button
      type="button"
      className={`dashboard-backdrop${sidebarOpen ? " is-open" : ""}`}
      aria-label="Fechar menu"
      onClick={closeSidebar}
    />
    <aside
      className={`dashboard-sidebar${sidebarOpen ? " is-open" : ""}`}
      style={{
        width: 248,
        flexShrink: 0,
        background: "var(--ds-sidebar)",
        borderRight: "1px solid var(--ds-border)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 16px",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 22px" }}>
        <div
          style={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 11,
            background: "var(--ds-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <Home size={20} />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 700,
              fontSize: 16.5,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "var(--ds-text)",
            }}
          >
            Bethel
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ds-muted)", marginTop: 3 }}>
            Gestão do lar
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
        {navItems.map(({ section, items }) => (
          <div key={section}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: "var(--ds-muted)",
                textTransform: "uppercase",
                padding: section === "Painel" ? "10px 10px 6px" : "18px 10px 6px",
              }}
            >
              {section}
            </div>
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeSidebar}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 11px",
                    borderRadius: 11,
                    fontWeight: 600,
                    fontSize: 14,
                    color: active ? "var(--ds-accent)" : "var(--ds-muted)",
                    background: active ? "var(--ds-accent-soft)" : "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <Icon size={19} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Family */}
      <div style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 14, marginTop: 8 }}>
        <FamilyPopover familyId={familyId} familyName={familyName} members={members} isOwner={isOwner} currentUserId={currentUserId} />
      </div>
    </aside>
    </>
  );
}
