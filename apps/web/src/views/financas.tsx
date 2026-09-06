"use client";

import { createBillAction, createBudgetCategoryAction, createContributionAction, createTransactionAction, deleteBillAction, deleteBudgetCategoryAction, deleteContributionAction, deleteTransactionAction, markBillPaidAction, unmarkBillPaidAction, updateBillAction, updateBudgetCategoryAction, updateTransactionAction } from "@/app/(dashboard)/financas/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatCurrency, formatMonthAbbrev, formatShortDate, matchesQuery, toDateInput } from "@/lib/format";
import { daysUntil } from "@/lib/calc";
import {
  createBillSchema,
  createBudgetCategorySchema,
  createContributionSchema,
  createTransactionSchema,
  type CreateBillInput,
  type CreateBudgetCategoryInput,
  type CreateContributionInput,
  type CreateTransactionInput,
} from "@/server/validators/financas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@bethel/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bethel/ui/components/dialog";
import { Input } from "@bethel/ui/components/input";
import { Label } from "@bethel/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bethel/ui/components/select";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// Mirrors the Prisma `TransactionType` enum. Duplicated here (instead of
// importing from @bethel/db) so this client component never pulls the
// Prisma/pg runtime into the browser bundle.
const TransactionType = { INCOME: "INCOME", EXPENSE: "EXPENSE" } as const;
type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
const ContributionType = { TITHE: "TITHE", OFFERING: "OFFERING", MISSIONS: "MISSIONS" } as const;
type ContributionType = (typeof ContributionType)[keyof typeof ContributionType];

const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  TITHE: "Dízimo",
  OFFERING: "Oferta de gratidão",
  MISSIONS: "Missões",
};

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
  pct: number;
  over: boolean;
}

interface ContributionItem {
  type: string;
  label: string;
  amount: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  categoryId: string | null;
  categoryName: string | null;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  paid: boolean;
}

interface ContributionEntry {
  id: string;
  type: string;
  label: string;
  amount: number;
  date: Date;
}

interface FinancasViewProps {
  balance: number;
  income: number;
  expense: number;
  budget: BudgetCategory[];
  dizimo: { total: number; pct: number; items: ContributionItem[] };
  transactions: Transaction[];
  bills: Bill[];
  contributions: ContributionEntry[];
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

export default function FinancasView({ balance, income, expense, budget, dizimo, transactions, bills, contributions }: FinancasViewProps) {
  const { maskValue, searchQuery } = useDashboard();
  const visibleBills = useMemo(
    () => bills.filter((b) => matchesQuery(searchQuery, b.name)),
    [bills, searchQuery],
  );
  const visibleBudget = useMemo(
    () => budget.filter((c) => matchesQuery(searchQuery, c.name)),
    [budget, searchQuery],
  );
  const visibleTransactions = useMemo(
    () => transactions.filter((t) => matchesQuery(searchQuery, t.description, t.categoryName)),
    [transactions, searchQuery],
  );
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  const transactionForm = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().slice(0, 10),
      categoryId: "",
    },
  });

  const billForm = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: { name: "", amount: 0, dueDate: new Date().toISOString().slice(0, 10) },
  });

  const contributionForm = useForm<CreateContributionInput>({
    resolver: zodResolver(createContributionSchema),
    defaultValues: { type: ContributionType.TITHE, amount: 0, date: new Date().toISOString().slice(0, 10) },
  });

  const categoryForm = useForm<CreateBudgetCategoryInput>({
    resolver: zodResolver(createBudgetCategorySchema),
    defaultValues: { name: "", monthlyLimit: 0 },
  });

  async function onSubmitTransaction(data: CreateTransactionInput) {
    const result = editingTransaction
      ? await updateTransactionAction(editingTransaction.id, data)
      : await createTransactionAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingTransaction ? "Transação atualizada." : "Transação registrada.");
    transactionForm.reset();
    setEditingTransaction(null);
    setTransactionOpen(false);
  }

  function openEditTransaction(t: Transaction) {
    setEditingTransaction(t);
    transactionForm.reset({
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: toDateInput(t.date),
      categoryId: t.categoryId ?? "",
    });
    setTransactionOpen(true);
  }

  async function onSubmitBill(data: CreateBillInput) {
    const result = editingBill ? await updateBillAction(editingBill.id, data) : await createBillAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingBill ? "Conta atualizada." : "Conta criada.");
    billForm.reset();
    setEditingBill(null);
    setBillOpen(false);
  }

  function openEditBill(b: Bill) {
    setEditingBill(b);
    billForm.reset({ name: b.name, amount: b.amount, dueDate: toDateInput(b.dueDate) });
    setBillOpen(true);
  }

  async function payBill(billId: string) {
    setPayingBillId(billId);
    const result = await markBillPaidAction(billId);
    setPayingBillId(null);
    if (!result.success) toast.error(result.error);
  }

  async function unpayBill(billId: string) {
    setPayingBillId(billId);
    const result = await unmarkBillPaidAction(billId);
    setPayingBillId(null);
    if (!result.success) toast.error(result.error);
  }

  async function onSubmitContribution(data: CreateContributionInput) {
    const result = await createContributionAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Contribuição registrada.");
    contributionForm.reset();
    setContributionOpen(false);
  }

  async function onSubmitCategory(data: CreateBudgetCategoryInput) {
    const result = editingCategory
      ? await updateBudgetCategoryAction(editingCategory.id, data)
      : await createBudgetCategoryAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingCategory ? "Categoria atualizada." : "Categoria criada.");
    categoryForm.reset();
    setEditingCategory(null);
    setCategoryOpen(false);
  }

  function openEditCategory(c: BudgetCategory) {
    setEditingCategory(c);
    categoryForm.reset({ name: c.name, monthlyLimit: c.limit });
    setCategoryOpen(true);
  }

  async function removeTransaction(id: string) {
    setPendingId(id);
    const result = await deleteTransactionAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  async function removeBill(id: string) {
    setPendingId(id);
    const result = await deleteBillAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  async function removeContribution(id: string) {
    setPendingId(id);
    const result = await deleteContributionAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  async function removeCategory(id: string) {
    setPendingId(id);
    const result = await deleteBudgetCategoryAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  const despesasPct = income > 0 ? Math.round((expense / income) * 100) : 0;

  return (
    <>
      <TopBar
        title="Finanças"
        subtitle="Visão geral financeira da família"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Dialog
              open={contributionOpen}
              onOpenChange={(next) => {
                setContributionOpen(next);
                if (!next) contributionForm.reset();
              }}
            >
              <DialogTrigger render={<Button variant="outline" />}>Registrar dízimo</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dízimo e ofertas</DialogTitle>
                  <DialogDescription>Registre o que a família entregou neste mês.</DialogDescription>
                </DialogHeader>
                <form onSubmit={contributionForm.handleSubmit(onSubmitContribution)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contrib-type">Tipo</Label>
                    <Controller
                      control={contributionForm.control}
                      name="type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="contrib-type" className="w-full">
                            <SelectValue placeholder="Tipo">
                              {(value: string) => CONTRIBUTION_LABELS[value as ContributionType]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(CONTRIBUTION_LABELS) as ContributionType[]).map((type) => (
                              <SelectItem key={type} value={type}>
                                {CONTRIBUTION_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contrib-amount">Valor</Label>
                    <Input id="contrib-amount" type="number" step="0.01" min="0" {...contributionForm.register("amount")} />
                    {contributionForm.formState.errors.amount && (
                      <p className="text-sm text-destructive">{contributionForm.formState.errors.amount.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contrib-date">Data</Label>
                    <Input id="contrib-date" type="date" {...contributionForm.register("date")} />
                    {contributionForm.formState.errors.date && (
                      <p className="text-sm text-destructive">{contributionForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={contributionForm.formState.isSubmitting} className="w-full">
                      {contributionForm.formState.isSubmitting ? "Salvando..." : "Registrar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={categoryOpen}
              onOpenChange={(next) => {
                setCategoryOpen(next);
                if (!next) {
                  categoryForm.reset();
                  setEditingCategory(null);
                }
              }}
            >
              <DialogTrigger render={<Button variant="outline" />}>Nova categoria</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Editar categoria" : "Categoria de orçamento"}</DialogTitle>
                  <DialogDescription>Defina um limite mensal para acompanhar os gastos.</DialogDescription>
                </DialogHeader>
                <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cat-name">Nome</Label>
                    <Input id="cat-name" placeholder="Educação" {...categoryForm.register("name")} />
                    {categoryForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{categoryForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cat-limit">Limite mensal</Label>
                    <Input id="cat-limit" type="number" step="0.01" min="0" {...categoryForm.register("monthlyLimit")} />
                    {categoryForm.formState.errors.monthlyLimit && (
                      <p className="text-sm text-destructive">{categoryForm.formState.errors.monthlyLimit.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={categoryForm.formState.isSubmitting} className="w-full">
                      {categoryForm.formState.isSubmitting ? "Salvando..." : editingCategory ? "Salvar" : "Criar categoria"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={billOpen}
              onOpenChange={(next) => {
                setBillOpen(next);
                if (!next) {
                  billForm.reset();
                  setEditingBill(null);
                }
              }}
            >
              <DialogTrigger render={<Button variant="outline" />}>Nova conta</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBill ? "Editar conta" : "Nova conta a pagar"}</DialogTitle>
                  <DialogDescription>Cadastre uma conta para acompanhar o vencimento.</DialogDescription>
                </DialogHeader>
                <form onSubmit={billForm.handleSubmit(onSubmitBill)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-name">Nome</Label>
                    <Input id="bill-name" placeholder="Energia elétrica" {...billForm.register("name")} />
                    {billForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{billForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-amount">Valor</Label>
                    <Input id="bill-amount" type="number" step="0.01" min="0" {...billForm.register("amount")} />
                    {billForm.formState.errors.amount && (
                      <p className="text-sm text-destructive">{billForm.formState.errors.amount.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-dueDate">Vencimento</Label>
                    <Input id="bill-dueDate" type="date" {...billForm.register("dueDate")} />
                    {billForm.formState.errors.dueDate && (
                      <p className="text-sm text-destructive">{billForm.formState.errors.dueDate.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={billForm.formState.isSubmitting} className="w-full">
                      {billForm.formState.isSubmitting ? "Salvando..." : editingBill ? "Salvar" : "Criar conta"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={transactionOpen}
              onOpenChange={(next) => {
                setTransactionOpen(next);
                if (!next) {
                  transactionForm.reset();
                  setEditingTransaction(null);
                }
              }}
            >
              <DialogTrigger render={<Button className="gap-2 shadow-sm" />}>
                <PlusIcon className="size-4" />
                Nova transação
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? "Editar transação" : "Nova transação"}</DialogTitle>
                  <DialogDescription>Registre uma receita ou despesa da família.</DialogDescription>
                </DialogHeader>
                <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-description">Descrição</Label>
                    <Input id="tx-description" placeholder="Supermercado" {...transactionForm.register("description")} />
                    {transactionForm.formState.errors.description && (
                      <p className="text-sm text-destructive">{transactionForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-amount">Valor</Label>
                    <Input id="tx-amount" type="number" step="0.01" min="0" {...transactionForm.register("amount")} />
                    {transactionForm.formState.errors.amount && (
                      <p className="text-sm text-destructive">{transactionForm.formState.errors.amount.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-type">Tipo</Label>
                    <Controller
                      control={transactionForm.control}
                      name="type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="tx-type" className="w-full">
                            <SelectValue placeholder="Tipo">
                              {(value: string) => (value === TransactionType.INCOME ? "Receita" : "Despesa")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                            <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-category">Categoria</Label>
                    <Controller
                      control={transactionForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select
                          value={field.value || "none"}
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                        >
                          <SelectTrigger id="tx-category" className="w-full">
                            <SelectValue placeholder="Sem categoria">
                              {(value: string) =>
                                !value || value === "none" ? "Sem categoria" : budget.find((c) => c.id === value)?.name
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem categoria</SelectItem>
                            {budget.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-date">Data</Label>
                    <Input id="tx-date" type="date" {...transactionForm.register("date")} />
                    {transactionForm.formState.errors.date && (
                      <p className="text-sm text-destructive">{transactionForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={transactionForm.formState.isSubmitting} className="w-full">
                      {transactionForm.formState.isSubmitting ? "Salvando..." : editingTransaction ? "Salvar" : "Registrar transação"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        {/* Top 3 cards */}
        <div className="ds-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 18 }}>
          <div style={{ background: "var(--ds-accent)", borderRadius: 16, padding: 22, color: "#fff" }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Saldo do mês</div>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 30, marginTop: 10, letterSpacing: "-0.02em" }}>
              {maskValue(formatCurrency(balance))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>Receitas menos despesas do mês</div>
          </div>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>Receitas</div>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 30, marginTop: 10, letterSpacing: "-0.02em", color: "#4f8a6b" }}>
              {maskValue(formatCurrency(income))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 6 }}>Total de entradas no mês</div>
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>Despesas</div>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 30, marginTop: 10, letterSpacing: "-0.02em", color: "#c0764f" }}>
              {maskValue(formatCurrency(expense))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 6 }}>{despesasPct}% da receita</div>
          </Card>
        </div>

        {/* Dízimos */}
        <Card style={{ padding: "20px 22px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: "rgba(199,154,62,.13)", color: "#c79a3e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 4 V20" /><path d="M7 9 H17" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Dízimos &amp; Ofertas</h3>
            </div>
            <span style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--ds-muted)" }}>
              &ldquo;Cada um dê conforme propôs no coração&rdquo; · 2 Coríntios 9.7
            </span>
          </div>
          <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>Entregue neste mês</div>
              <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: "-0.02em", color: "#c79a3e" }}>
                {maskValue(formatCurrency(dizimo.total))}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 8 }}>
                Dízimo — {dizimo.pct}% da meta de 10%
              </div>
              <div style={{ height: 8, background: "var(--ds-track)", borderRadius: 20, overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", borderRadius: 20, background: "#c79a3e", width: `${dizimo.pct}%` }} />
              </div>
            </div>
            <div>
              {dizimo.items.map((item) => (
                <div key={item.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--ds-hover)" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ds-text)" }}>{item.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ds-text)" }}>{maskValue(formatCurrency(item.amount))}</span>
                </div>
              ))}
              {contributions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  {contributions.map((entry) => (
                    <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                      <span style={{ fontSize: 12.5, color: "var(--ds-muted)" }}>
                        {entry.label} · {formatShortDate(new Date(entry.date))}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{maskValue(formatCurrency(entry.amount))}</span>
                        <QuietAction danger disabled={pendingId === entry.id} onClick={() => removeContribution(entry.id)}>
                          Apagar
                        </QuietAction>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Contas a pagar */}
        <Card style={{ padding: "20px 22px", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Contas a pagar</h3>
          {visibleBills.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ds-muted)", padding: "12px 0" }}>
              Nenhuma conta cadastrada. Use o botão Nova conta para começar.
            </p>
          )}
          {visibleBills.map((b) => {
            const { tag, urgent } = billDueInfo(b.dueDate);
            const due = new Date(b.dueDate);
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid var(--ds-hover)" }}>
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
                    <div style={{ fontSize: 14, fontWeight: 600, color: b.paid ? "var(--ds-muted)" : "var(--ds-text)", textDecoration: b.paid ? "line-through" : "none" }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: b.paid ? "#4f8a6b" : urgent ? "#c0764f" : "var(--ds-muted)", fontWeight: 600, marginTop: 2 }}>
                      {b.paid ? "Paga" : tag}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ds-text)" }}>{maskValue(formatCurrency(b.amount))}</div>
                  {!b.paid && (
                    <Button size="sm" variant="outline" disabled={payingBillId === b.id} onClick={() => payBill(b.id)}>
                      {payingBillId === b.id ? "..." : "Marcar como paga"}
                    </Button>
                  )}
                  {b.paid && (
                    <Button size="sm" variant="outline" disabled={payingBillId === b.id} onClick={() => unpayBill(b.id)}>
                      {payingBillId === b.id ? "..." : "Desmarcar"}
                    </Button>
                  )}
                  <QuietAction disabled={pendingId === b.id} onClick={() => openEditBill(b)}>
                    Editar
                  </QuietAction>
                  <QuietAction danger disabled={pendingId === b.id} onClick={() => removeBill(b.id)}>
                    Apagar
                  </QuietAction>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Budget + Transactions */}
        <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 16, alignItems: "start" }}>
          <Card style={{ padding: "20px 22px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Orçamento por categoria</h3>
            {visibleBudget.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ds-muted)" }}>
                Nenhuma categoria ainda. Use Nova categoria para definir o orçamento da casa.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {visibleBudget.map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7, gap: 8 }}>
                    <span style={{ fontWeight: 600, color: "var(--ds-text)" }}>{c.name}</span>
                    <span style={{ color: "var(--ds-muted)", display: "flex", alignItems: "center", gap: 10 }}>
                      <span>
                        <b style={{ color: "var(--ds-text)", fontWeight: 600 }}>{maskValue(formatCurrency(c.spent))}</b> / {maskValue(formatCurrency(c.limit))}
                      </span>
                      <QuietAction disabled={pendingId === c.id} onClick={() => openEditCategory(c)}>
                        Editar
                      </QuietAction>
                      <QuietAction danger disabled={pendingId === c.id} onClick={() => removeCategory(c.id)}>
                        Apagar
                      </QuietAction>
                    </span>
                  </div>
                  <div style={{ height: 8, background: "var(--ds-track)", borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 20, width: `${c.pct}%`, background: c.over ? "#c0764f" : "var(--ds-accent)" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: "20px 22px" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Movimentações recentes</h3>
            {visibleTransactions.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ds-muted)", padding: "12px 0" }}>
                Nenhuma transação registrada. Use Nova transação para lançar receita ou despesa.
              </p>
            )}
            <div>
              {visibleTransactions.map((t) => {
                const entrada = t.type === TransactionType.INCOME;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--ds-hover)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36, height: 36, flexShrink: 0, borderRadius: 10,
                          background: entrada ? "#eaf1ec" : "var(--ds-soft)",
                          color: entrada ? "#4f8a6b" : "var(--ds-muted)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          {entrada
                            ? <><path d="M7 13 L12 8 L17 13" /><path d="M12 8 V18" /></>
                            : <><path d="M7 11 L12 16 L17 11" /><path d="M12 16 V6" /></>
                          }
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ds-text)" }}>{t.description}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ds-muted)", marginTop: 1 }}>
                          {t.categoryName ?? (entrada ? "Receita" : "Sem categoria")} · {formatShortDate(new Date(t.date))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: entrada ? "#4f8a6b" : "var(--ds-text)" }}>
                        {entrada ? "+ " : "− "}
                        {maskValue(formatCurrency(t.amount))}
                      </div>
                      <QuietAction disabled={pendingId === t.id} onClick={() => openEditTransaction(t)}>
                        Editar
                      </QuietAction>
                      <QuietAction danger disabled={pendingId === t.id} onClick={() => removeTransaction(t.id)}>
                        Apagar
                      </QuietAction>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
