"use client";

import { Book } from "reicon-react";
import Link from "next/link";
import { updateTaskStatusAction } from "@/app/(dashboard)/tarefas/actions";
import TopBar from "@/components/top-bar";
import { useDashboard } from "@/contexts/dashboard-context";
import { firstName, formatCurrency, formatLongDate, formatMonthAbbrev, formatShortDate, greetingForHour, initials, matchesQuery } from "@/lib/format";
import { daysUntil } from "@/lib/calc";
import { toast } from "sonner";

// Mirrors Prisma enums. Duplicated here (instead of importing from
// @bethel/db) so this client component never pulls the Prisma/pg runtime
// into the browser bundle.
const TaskStatus = { TODO: "TODO", IN_PROGRESS: "IN_PROGRESS", DONE: "DONE" } as const;
type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
const PantryLevel = { OK: "OK", LOW: "LOW", OUT: "OUT" } as const;
type PantryLevel = (typeof PantryLevel)[keyof typeof PantryLevel];

const LEVEL_LABELS: Record<PantryLevel, string> = { OK: "OK", LOW: "Baixo", OUT: "Acabou" };
const LEVEL_STYLES: Record<PantryLevel, { bg: string; color: string }> = {
  OK: { bg: "#eaf1ec", color: "#4f8a6b" },
  LOW: { bg: "#f7efe0", color: "#b07d28" },
  OUT: { bg: "#f6e7df", color: "#b3522a" },
};

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
  pct: number;
  over: boolean;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignedTo: { id: string; name: string; avatarColor: string } | null;
}

interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  level: PantryLevel;
}

interface MaintenanceItem {
  id: string;
  title: string;
  nextDueAt: Date;
}

interface DailyVerse {
  reference: string;
  text: string;
  versionLabel: string;
}

interface HomeOverview {
  familyName: string;
  balance: number;
  unpaidBillsCount: number;
  unpaidBillsTotal: number;
  pendingShoppingCount: number;
  shoppingEstimatedTotal: number;
  openTasksCount: number;
  doneTasksCount: number;
  budget: BudgetCategory[];
  upcomingBills: Bill[];
  dailyVerse: DailyVerse | null;
  todayTasks: Task[];
  lowPantryItems: PantryItem[];
  upcomingMaintenance: MaintenanceItem[];
}

interface InícioViewProps {
  overview: HomeOverview;
  userName: string;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(30,28,24,.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function billDueInfo(dueDate: Date) {
  const diffDays = daysUntil(dueDate);
  const tag = diffDays < 0 ? `Venceu há ${Math.abs(diffDays)} dias` : diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays} dias`;
  return { tag, urgent: diffDays <= 5 };
}

function maintenanceUrgent(nextDueAt: Date) {
  return daysUntil(nextDueAt) <= 7;
}

export default function InícioView({ overview, userName }: InícioViewProps) {
  const { maskValue, searchQuery } = useDashboard();
  const now = new Date();
  const name = firstName(userName) || overview.familyName;
  const budget = overview.budget.filter((c) => matchesQuery(searchQuery, c.name));
  const upcomingBills = overview.upcomingBills.filter((b) => matchesQuery(searchQuery, b.name));
  const todayTasks = overview.todayTasks.filter((t) => matchesQuery(searchQuery, t.title, t.assignedTo?.name));
  const lowPantryItems = overview.lowPantryItems.filter((p) => matchesQuery(searchQuery, p.name));
  const upcomingMaintenance = overview.upcomingMaintenance.filter((m) => matchesQuery(searchQuery, m.title));

  const stats = [
    {
      label: "Saldo do mês",
      value: formatCurrency(overview.balance),
      sub: overview.balance >= 0 ? "Saldo positivo" : "Saldo negativo",
      dot: overview.balance >= 0 ? "#4f8a6b" : "#c0764f",
      subCor: overview.balance >= 0 ? "#4f8a6b" : "#c0764f",
    },
    {
      label: "Contas a pagar",
      value: formatCurrency(overview.unpaidBillsTotal),
      sub:
        overview.unpaidBillsCount === 0
          ? "Nenhuma conta pendente"
          : `${overview.unpaidBillsCount} ${overview.unpaidBillsCount === 1 ? "conta" : "contas"} próximas`,
      dot: overview.unpaidBillsCount > 0 ? "#c0764f" : "#4f8a6b",
      subCor: overview.unpaidBillsCount > 0 ? "#c0764f" : "#4f8a6b",
    },
    {
      label: "Lista de compras",
      value: `${overview.pendingShoppingCount} itens`,
      sub: `≈ ${formatCurrency(overview.shoppingEstimatedTotal)}`,
      dot: "#5878a8",
      subCor: "var(--ds-muted)",
      noMask: true,
    },
    {
      label: "Tarefas de hoje",
      value: `${overview.openTasksCount}`,
      sub: `${overview.doneTasksCount} já concluídas`,
      dot: "#c79a3e",
      subCor: "var(--ds-muted)",
      noMask: true,
    },
  ];

  async function handleToggleTask(taskId: string) {
    const result = await updateTaskStatusAction(taskId, TaskStatus.DONE);
    if (!result.success) {
      toast.error(result.error);
    }
  }

  return (
    <>
      <TopBar title={`${greetingForHour(now.getHours())}, ${name}`} subtitle={formatLongDate(now)} />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        {/* Versículo do dia */}
        {overview.dailyVerse && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              borderLeft: "4px solid #c79a3e",
              borderRadius: 16,
              boxShadow: "0 1px 2px rgba(30,28,24,.03)",
              padding: "17px 24px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                background: "rgba(199,154,62,.13)", color: "#c79a3e",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Book size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#c79a3e" }}>
                Versículo do dia
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 600, fontSize: 16.5, letterSpacing: "-0.01em",
                  marginTop: 5, lineHeight: 1.45, color: "var(--ds-text)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {overview.dailyVerse.text}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 4 }}>
                {overview.dailyVerse.reference} · {overview.dailyVerse.versionLabel}
              </div>
            </div>
            <Link
              href="/devocional"
              style={{ fontSize: 13, fontWeight: 700, color: "#c79a3e", whiteSpace: "nowrap", alignSelf: "flex-start", textDecoration: "none" }}
            >
              Abrir
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="ds-cols-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 18 }}>
          {stats.map((s) => (
            <Card key={s.label} style={{ padding: "18px 18px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ds-muted)", fontSize: 12.5, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 700, fontSize: 27, letterSpacing: "-0.02em",
                  marginTop: 12, lineHeight: 1, whiteSpace: "nowrap",
                  color: "var(--ds-text)",
                }}
              >
                {s.noMask ? s.value : maskValue(s.value)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 7, color: s.subCor }}>
                {s.noMask ? s.sub : maskValue(s.sub)}
              </div>
            </Card>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, alignItems: "start" }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Orçamento */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Orçamento do mês</h3>
                <Link href="/financas" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-accent)", textDecoration: "none" }}>
                  Ver finanças
                </Link>
              </div>
              {budget.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--ds-muted)" }}>Nenhuma categoria de orçamento cadastrada.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {budget.map((c) => (
                    <div key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7 }}>
                        <span style={{ fontWeight: 600, color: "var(--ds-text)" }}>{c.name}</span>
                        <span style={{ color: "var(--ds-muted)" }}>
                          <b style={{ color: "var(--ds-text)", fontWeight: 600 }}>{maskValue(formatCurrency(c.spent))}</b> /{" "}
                          {maskValue(formatCurrency(c.limit))}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "var(--ds-track)", borderRadius: 20, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 20, width: `${c.pct}%`, background: c.over ? "#c0764f" : "var(--ds-accent)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Contas */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Próximas contas</h3>
                <Link href="/financas" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-accent)", textDecoration: "none" }}>
                  Ver todas
                </Link>
              </div>
              {upcomingBills.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--ds-muted)", padding: "13px 0" }}>Nenhuma conta pendente.</div>
              ) : (
                upcomingBills.map((b) => {
                  const due = new Date(b.dueDate);
                  const { tag, urgent } = billDueInfo(due);
                  return (
                    <div
                      key={b.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid var(--ds-hover)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                        <div
                          style={{
                            width: 42, height: 42, flexShrink: 0, borderRadius: 11,
                            background: "var(--ds-soft)", display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", lineHeight: 1.1,
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ds-text)" }}>{due.getDate().toString().padStart(2, "0")}</span>
                          <span style={{ fontSize: 9.5, color: "var(--ds-muted)", textTransform: "uppercase" }}>{formatMonthAbbrev(due)}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ds-text)" }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: urgent ? "#c0764f" : "var(--ds-muted)", fontWeight: 600, marginTop: 2 }}>
                            {tag}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ds-text)" }}>{maskValue(formatCurrency(b.amount))}</div>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Versículo do dia */}
            {overview.dailyVerse && (
              <Card style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Versículo do dia</h3>
                  <Link href="/devocional" style={{ fontSize: 12.5, fontWeight: 600, color: "#c79a3e", textDecoration: "none" }}>
                    Abrir
                  </Link>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <div
                    style={{
                      width: 42, height: 42, flexShrink: 0, borderRadius: 11,
                      background: "rgba(199,154,62,.13)", color: "#c79a3e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Book size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ds-text)", lineHeight: 1.45 }}>
                      {overview.dailyVerse.reference}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--ds-muted)",
                        marginTop: 4,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {overview.dailyVerse.text}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Tarefas hoje */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Tarefas em aberto</h3>
                <Link href="/tarefas" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-accent)", textDecoration: "none" }}>
                  Ver tudo
                </Link>
              </div>
              {todayTasks.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--ds-muted)" }}>Nenhuma tarefa em aberto.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {todayTasks.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        onClick={() => handleToggleTask(t.id)}
                        style={{
                          width: 21, height: 21, flexShrink: 0, borderRadius: 7,
                          border: "1.6px solid var(--ds-border)",
                          background: "var(--ds-surface)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "var(--ds-text)" }}>{t.title}</div>
                      <div
                        style={{
                          width: 24, height: 24, borderRadius: "50%", background: t.assignedTo?.avatarColor ?? "#9a958b",
                          color: "#fff", fontSize: 9.5, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {t.assignedTo ? initials(t.assignedTo.name) : "?"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Despensa */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Despensa acabando</h3>
                <Link href="/despensa" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-accent)", textDecoration: "none" }}>
                  Repor
                </Link>
              </div>
              {lowPantryItems.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--ds-muted)" }}>Despensa em dia.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {lowPantryItems.map((p) => {
                    const s = LEVEL_STYLES[p.level];
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ds-text)" }}>{p.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ds-muted)", marginTop: 1 }}>{p.quantity}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                            background: s.bg, color: s.color,
                          }}
                        >
                          {LEVEL_LABELS[p.level]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Manutenções */}
            <Card style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Manutenções</h3>
                <Link href="/manutencao" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-accent)", textDecoration: "none" }}>
                  Ver tudo
                </Link>
              </div>
              {upcomingMaintenance.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--ds-muted)" }}>Nenhuma manutenção agendada.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {upcomingMaintenance.map((u) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 9, height: 9, flexShrink: 0, borderRadius: "50%", background: maintenanceUrgent(u.nextDueAt) ? "#c0764f" : "#c79a3e" }} />
                      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--ds-text)" }}>{u.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ds-muted)", fontWeight: 600 }}>{formatShortDate(new Date(u.nextDueAt))}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
