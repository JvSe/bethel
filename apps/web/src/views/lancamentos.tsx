"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatCurrency, formatLongDate, formatShortDate, matchesQuery, type MoneyCurrency } from "@/lib/format";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@bethel/ui/components/sheet";

const TransactionType = { INCOME: "INCOME", EXPENSE: "EXPENSE" } as const;
type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

const IncomeCategory = { SALARY: "SALARY", FREELANCE: "FREELANCE", RENT: "RENT", OTHER: "OTHER" } as const;
type IncomeCategory = (typeof IncomeCategory)[keyof typeof IncomeCategory];

const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  SALARY: "Salário",
  FREELANCE: "Freelance",
  RENT: "Aluguel",
  OTHER: "Outros",
};

const CURRENCY_LABELS: Record<MoneyCurrency, string> = {
  BRL: "Real (R$)",
  USD: "Dólar (US$)",
};

export interface LancamentoRow {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  categoryName: string | null;
  incomeCategory: IncomeCategory | null;
  accountName: string;
  currency: MoneyCurrency;
  recurring: boolean;
}

interface LancamentosViewProps {
  kind: TransactionType;
  transactions: LancamentoRow[];
}

function categoryLabel(row: LancamentoRow) {
  if (row.type === TransactionType.INCOME) {
    return row.incomeCategory ? INCOME_CATEGORY_LABELS[row.incomeCategory] : "Receita";
  }
  return row.categoryName ?? "Sem categoria";
}

export default function LancamentosView({ kind, transactions }: LancamentosViewProps) {
  const { maskValue, searchQuery } = useDashboard();
  const [selected, setSelected] = useState<LancamentoRow | null>(null);
  const isIncome = kind === TransactionType.INCOME;

  const rows = useMemo(
    () =>
      transactions.filter(
        (row) =>
          row.type === kind &&
          matchesQuery(searchQuery, row.description, row.accountName, categoryLabel(row)),
      ),
    [transactions, kind, searchQuery],
  );

  const title = isIncome ? "Receitas" : "Despesas";
  const emptyLabel = isIncome ? "Nenhuma receita registrada." : "Nenhuma despesa registrada.";

  return (
    <>
      <TopBar
        title={title}
        subtitle={isIncome ? "Todas as entradas da família" : "Todas as saídas da família"}
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/financas"
            style={{ fontSize: 13, fontWeight: 650, color: "var(--ds-accent)", textDecoration: "none" }}
          >
            ← Finanças
          </Link>
        </div>

        <div
          style={{
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 16,
            boxShadow: "0 1px 2px rgba(30,28,24,.03)",
            overflow: "hidden",
          }}
        >
          {rows.length === 0 ? (
            <p style={{ margin: 0, padding: "28px 22px", fontSize: 13.5, color: "var(--ds-muted)" }}>{emptyLabel}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--ds-border)", textAlign: "left" }}>
                    {["Descrição", "Categoria", "Conta", "Data", "Valor", ""].map((heading) => (
                      <th
                        key={heading || "acao"}
                        style={{
                          padding: "14px 16px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--ds-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid var(--ds-hover)" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13.5, fontWeight: 650, color: "var(--ds-text)" }}>
                        {row.description}
                        {row.recurring && (
                          <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 600, color: "var(--ds-muted)" }}>
                            Recorrente
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--ds-text)" }}>{categoryLabel(row)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--ds-text)", whiteSpace: "nowrap" }}>
                        {row.accountName}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--ds-muted)", whiteSpace: "nowrap" }}>
                        {formatShortDate(new Date(row.date))}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: isIncome ? "#4f8a6b" : "var(--ds-text)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isIncome ? "+ " : "− "}
                        {maskValue(formatCurrency(row.amount, row.currency))}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <QuietAction onClick={() => setSelected(row)}>Ver detalhes</QuietAction>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Sheet open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.description}</SheetTitle>
                <SheetDescription>{isIncome ? "Detalhes da receita" : "Detalhes da despesa"}</SheetDescription>
              </SheetHeader>
              <div
                style={{
                  fontFamily: "var(--font-bricolage), sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: isIncome ? "#4f8a6b" : "var(--ds-text)",
                }}
              >
                {isIncome ? "+ " : "− "}
                {maskValue(formatCurrency(selected.amount, selected.currency))}
              </div>
              <div>
                {(
                  [
                    ["Categoria", categoryLabel(selected)],
                    ["Conta", selected.accountName],
                    ["Moeda", CURRENCY_LABELS[selected.currency]],
                    ["Data", formatLongDate(new Date(selected.date))],
                    ["Origem", selected.recurring ? "Recorrente" : "Lançamento único"],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "12px 0",
                      borderBottom: "1px solid var(--ds-hover)",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 650, color: "var(--ds-text)", textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
