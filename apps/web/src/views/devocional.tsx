"use client";

import { startDevotionalPlanAction, toggleDevotionalDayAction } from "@/app/(dashboard)/devocional/actions";
import TopBar from "@/components/top-bar";
import { useDashboard } from "@/contexts/dashboard-context";
import { matchesQuery } from "@/lib/format";
import { Button } from "@bethel/ui/components/button";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function BookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 H10 A2 2 0 0 1 12 7 V20 A2 2 0 0 0 10 18 H4 Z" />
      <path d="M20 5 H14 A2 2 0 0 0 12 7 V20 A2 2 0 0 1 14 18 H20 Z" />
    </svg>
  );
}

interface DevotionalDay {
  day: number;
  reference: string;
  done: boolean;
  isToday: boolean;
}

interface DevotionalOverview {
  planTitle: string;
  currentDay: number;
  total: number;
  progressPct: number;
  todayReference: string | null;
  days: DevotionalDay[];
}

interface DevocionalViewProps {
  overview: DevotionalOverview | null;
}

function dayStyle(d: DevotionalDay) {
  if (d.done) return { boxBg: "#c79a3e", boxBorder: "#c79a3e", checkOp: 1, dotOp: 0, txt: "var(--ds-text)", tag: "Concluído", tagCor: "var(--ds-muted)" };
  if (d.isToday) return { boxBg: "rgba(199,154,62,.13)", boxBorder: "#c79a3e", checkOp: 0, dotOp: 1, txt: "var(--ds-text)", tag: "Hoje", tagCor: "#c79a3e" };
  return { boxBg: "var(--ds-surface)", boxBorder: "var(--ds-border)", checkOp: 0, dotOp: 0, txt: "var(--ds-muted)", tag: "A ler", tagCor: "var(--ds-muted)" };
}

export default function DevocionalView({ overview }: DevocionalViewProps) {
  const { searchQuery } = useDashboard();
  const [starting, setStarting] = useState(false);
  const visibleDays = useMemo(
    () => (overview?.days ?? []).filter((d) => matchesQuery(searchQuery, d.reference, `Dia ${d.day}`)),
    [overview, searchQuery],
  );

  async function handleToggle(day: number) {
    const result = await toggleDevotionalDayAction(day);
    if (!result.success) {
      toast.error(result.error);
    }
  }

  async function startPlan() {
    setStarting(true);
    const result = await startDevotionalPlanAction();
    setStarting(false);
    if (!result.success) toast.error(result.error);
    else toast.success("Plano iniciado. Provérbios em 31 dias.");
  }

  if (!overview) {
    return (
      <>
        <TopBar title="Devocional em família" subtitle="Nenhum plano em andamento" />
        <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
          <div
            style={{
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              borderRadius: 16,
              padding: 28,
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ds-muted)", lineHeight: 1.5 }}>
              A família ainda não iniciou um plano. Comece Provérbios em 31 dias — um capítulo por dia.
            </p>
            <Button disabled={starting} onClick={startPlan}>
              {starting ? "Iniciando..." : "Começar plano"}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Devocional em família" subtitle={`Plano: ${overview.planTitle} · Dia ${overview.currentDay}`} />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 16, alignItems: "start" }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Leitura de hoje */}
            <div
              style={{
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderLeft: "4px solid #c79a3e",
                borderRadius: 18,
                boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                padding: "30px 34px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#c79a3e" }}>
                <BookIcon size={15} />
                Leitura de hoje
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 600, fontSize: 25, letterSpacing: "-0.01em",
                  lineHeight: 1.45, marginTop: 14, color: "var(--ds-text)",
                }}
              >
                {overview.todayReference ?? "—"}
              </div>
            </div>

            {/* Plano */}
            <div
              style={{
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>{overview.planTitle}</h3>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)" }}>
                  Dia {overview.currentDay} de {overview.total}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--ds-track)", borderRadius: 20, overflow: "hidden", margin: "10px 0 16px" }}>
                <div style={{ height: "100%", borderRadius: 20, background: "#c79a3e", width: `${overview.progressPct}%` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {visibleDays.map((d) => {
                  const s = dayStyle(d);
                  return (
                    <button
                      key={d.day}
                      onClick={() => handleToggle(d.day)}
                      style={{
                        display: "flex", alignItems: "center", gap: 13, padding: "11px 0",
                        borderBottom: "1px solid var(--ds-hover)", border: "none", borderBottomWidth: 1,
                        background: "transparent", cursor: "pointer", width: "100%", textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 24, height: 24, flexShrink: 0, borderRadius: 8,
                          border: `1.6px solid ${s.boxBorder}`,
                          background: s.boxBg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        {s.checkOp === 1 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute" }}>
                            <path d="M5 12 L10 17 L19 7" />
                          </svg>
                        )}
                        {s.dotOp === 1 && (
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#c79a3e" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: s.txt }}>
                        Dia {d.day} <span style={{ fontWeight: 500, color: "var(--ds-muted)" }}>· {d.reference}</span>
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: s.tagCor }}>{s.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "rgba(199,154,62,.1)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                padding: "22px 24px",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Para refletir hoje</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ds-text)" }}>
                Em que área da nossa casa precisamos confiar mais em Deus esta semana?
              </p>
            </div>
            <div
              style={{
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                padding: "22px 24px",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Momento em família</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.6, color: "var(--ds-muted)" }}>
                Depois do jantar, leiam juntos a passagem do dia e cada um compartilha uma palavra que tocou o coração.
              </p>
              <Link
                href="/oracao"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#c79a3e", color: "#fff", borderRadius: 11, padding: 11,
                  fontSize: 13.5, fontWeight: 600, cursor: "pointer", textDecoration: "none",
                }}
              >
                Ir para o mural de oração
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
