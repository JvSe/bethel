"use client";

import { authClient } from "@bethel/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { initials } from "@/lib/format";
import { inviteMemberAction } from "@/server/invite-actions";

interface FamilyMember {
  memberId: string;
  userId: string;
  name: string;
  avatarColor: string;
  role: string;
}

interface FamilyPopoverProps {
  familyId: string;
  familyName: string;
  members: FamilyMember[];
  isOwner: boolean;
  currentUserId: string;
}

const ACCENTS: { key: "salvia" | "azul" | "terracota" | "ameixa"; color: string; label: string }[] = [
  { key: "salvia", color: "#4f8a6b", label: "Sálvia" },
  { key: "azul", color: "#5878a8", label: "Azul" },
  { key: "terracota", color: "#c0764f", label: "Terracota" },
  { key: "ameixa", color: "#8a5b86", label: "Ameixa" },
];

export default function FamilyPopover({ familyId, familyName, members, isOwner, currentUserId }: FamilyPopoverProps) {
  const router = useRouter();
  const { accent, setAccent } = useDashboard();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setCopied(false);

    const result = await inviteMemberAction(inviteEmail);

    setInviteLoading(false);

    if (!result.success) {
      setInviteError(result.error);
      return;
    }

    setInviteLink(`${window.location.origin}/aceitar-convite?id=${result.invitationId}`);
  }

  async function handleLeave() {
    if (!window.confirm("Sair desta família? Você deixa de ver os dados da casa.")) return;
    const { error } = await authClient.organization.leave({ organizationId: familyId });
    if (error) {
      setRemoveError(error.message ?? "Não foi possível sair da família.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  async function handleCloseFamily() {
    if (
      !window.confirm(
        "Encerrar este espaço apaga todos os dados da família (finanças, tarefas, orações…). Esta ação não tem volta.",
      )
    ) {
      return;
    }
    const { error } = await authClient.organization.delete({ organizationId: familyId });
    if (error) {
      setRemoveError(error.message ?? "Não foi possível encerrar o espaço.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm("Remover este membro da família?")) return;
    setRemovingId(memberId);
    setRemoveError(null);

    const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId });

    setRemovingId(null);
    if (error) {
      setRemoveError(error.message ?? "Não foi possível remover o membro.");
      return;
    }
    router.refresh();
  }

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "8px 10px",
          borderRadius: 12,
          width: "100%",
          background: open ? "var(--ds-hover)" : "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex" }}>
          {members.slice(0, 3).map((m, i) => (
            <div
              key={m.memberId}
              style={{
                width: 27,
                height: 27,
                borderRadius: "50%",
                background: m.avatarColor,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--ds-sidebar)",
                marginLeft: i > 0 ? -9 : 0,
              }}
            >
              {initials(m.name)}
            </div>
          ))}
        </div>
        <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ds-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {familyName}
          </div>
          <div style={{ fontSize: 11, color: "var(--ds-muted)" }}>
            {members.length} {members.length === 1 ? "membro" : "membros"}
          </div>
        </div>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            width: 280,
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 14,
            padding: 14,
            boxShadow: "0 8px 28px rgba(0,0,0,.12)",
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--ds-muted)", textTransform: "uppercase", marginBottom: 8 }}>
            Membros
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {members.map((m) => (
              <div key={m.memberId} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: m.avatarColor,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {initials(m.name)}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ds-text)", flex: 1 }}>{m.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--ds-muted)" }}>
                  {m.role === "owner" ? "Dono" : "Membro"}
                </div>
                {isOwner && m.userId !== currentUserId && (
                  <button
                    onClick={() => handleRemove(m.memberId)}
                    disabled={removingId === m.memberId}
                    title="Remover da família"
                    style={{
                      width: 18,
                      height: 18,
                      flexShrink: 0,
                      border: "none",
                      background: "transparent",
                      color: "var(--ds-muted)",
                      cursor: "pointer",
                      fontSize: 13,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {removeError && <div style={{ fontSize: 11.5, color: "#b3452c" }}>{removeError}</div>}
          </div>

          {isOwner && (
          <div style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--ds-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Convidar membro
            </div>
            {inviteLink ? (
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ds-text)",
                    background: "var(--ds-soft)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    marginBottom: 8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inviteLink}
                </div>
                <button
                  onClick={copyLink}
                  style={{
                    width: "100%",
                    background: "var(--ds-accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Copiado!" : "Copiar link"}
                </button>
                <p style={{ fontSize: 11.5, color: "var(--ds-muted)", marginTop: 8, marginBottom: 0 }}>
                  O convite também foi enviado por e-mail, se o envio estiver configurado.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    background: "var(--ds-soft)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 12.5,
                    color: "var(--ds-text)",
                    outline: "none",
                  }}
                />
                {inviteError && <div style={{ fontSize: 11.5, color: "#b3452c" }}>{inviteError}</div>}
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{
                    background: "var(--ds-accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {inviteLoading ? "Enviando..." : "Enviar convite"}
                </button>
              </form>
            )}
          </div>
          )}

          <div style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--ds-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Cor de destaque
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  title={a.label}
                  onClick={() => setAccent(a.key)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: a.color,
                    border: accent === a.key ? "2px solid var(--ds-text)" : "2px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {!isOwner && (
            <button
              onClick={handleLeave}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid var(--ds-border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--ds-text)",
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              Sair da família
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleCloseFamily}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid var(--ds-border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#b3452c",
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              Encerrar este espaço
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--ds-border)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--ds-text)",
              cursor: "pointer",
            }}
          >
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}
