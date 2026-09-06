"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FamilyPopover from "@/components/family-popover";
import { useDashboard } from "@/contexts/dashboard-context";

const navItems = [
  {
    section: "Painel",
    items: [
      { href: "/inicio", label: "Início", icon: HomeIcon },
      { href: "/financas", label: "Finanças", icon: FinancasIcon },
      { href: "/compras", label: "Compras", icon: ComprasIcon },
      { href: "/tarefas", label: "Tarefas", icon: TarefasIcon },
      { href: "/manutencao", label: "Manutenção", icon: ManutIcon },
      { href: "/despensa", label: "Despensa", icon: DespensaIcon },
      { href: "/calendario", label: "Calendário", icon: CalIcon },
    ],
  },
  {
    section: "Vida de fé",
    items: [
      { href: "/devocional", label: "Devocional", icon: DevocionalIcon },
      { href: "/oracao", label: "Oração", icon: OracaoIcon },
      { href: "/gratidao", label: "Gratidão", icon: GratidaoIcon },
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
          <HomeIcon size={20} />
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

function HomeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11 L12 4 L20 11" />
      <path d="M6 10 V20 H18 V10" />
    </svg>
  );
}
function FinancasIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10 H21" />
      <circle cx="17" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ComprasIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4 H5.5 L7 15 H18 L20 7 H6" />
      <circle cx="8.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </svg>
  );
}
function TarefasIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7 L6 9 L9 5" />
      <path d="M4 16 L6 18 L9 14" />
      <path d="M12 7 H20" />
      <path d="M12 16 H20" />
    </svg>
  );
}
function ManutIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 4 V6.5" /><path d="M12 17.5 V20" />
      <path d="M4 12 H6.5" /><path d="M17.5 12 H20" />
      <path d="M6.3 6.3 L8 8" /><path d="M16 16 L17.7 17.7" />
      <path d="M17.7 6.3 L16 8" /><path d="M8 16 L6.3 17.7" />
    </svg>
  );
}
function DespensaIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="12" rx="1.5" />
      <path d="M4 11 H20" />
      <path d="M10 7 V11" />
      <path d="M14 11 V15" />
    </svg>
  );
}
function CalIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 9 H20" />
      <path d="M8 3 V6" />
      <path d="M16 3 V6" />
    </svg>
  );
}
function DevocionalIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 H10 A2 2 0 0 1 12 7 V20 A2 2 0 0 0 10 18 H4 Z" />
      <path d="M20 5 H14 A2 2 0 0 0 12 7 V20 A2 2 0 0 1 14 18 H20 Z" />
    </svg>
  );
}
function OracaoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 V20" />
      <path d="M7 9 H17" />
    </svg>
  );
}
function GratidaoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20 C12 20 4 14.5 4 9 A4 4 0 0 1 12 7 A4 4 0 0 1 20 9 C20 14.5 12 20 12 20 Z" />
    </svg>
  );
}
