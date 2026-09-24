"use client";

import {
  createBillAction,
  createBudgetCategoryAction,
  createContributionAction,
  createFinancialAccountAction,
  createRecurringIncomeAction,
  createTransactionAction,
  deleteBillAction,
  deleteBudgetCategoryAction,
  deleteContributionAction,
  deleteFinancialAccountAction,
  deleteRecurringIncomeAction,
  deleteTransactionAction,
  markBillPaidAction,
  unmarkBillPaidAction,
  updateBillAction,
  updateBudgetCategoryAction,
  updateFinancialAccountAction,
  updateRecurringIncomeAction,
  updateTransactionAction,
} from "@/app/(dashboard)/financas/actions";
import { FloatingComposeMenu, type ComposeGroup } from "@/components/floating-compose-menu";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatCurrency, formatMonthAbbrev, formatShortDate, matchesQuery, toDateInput, type MoneyCurrency } from "@/lib/format";
import { daysUntil } from "@/lib/calc";
import {
  createBillSchema,
  createBudgetCategorySchema,
  createContributionSchema,
  createFinancialAccountSchema,
  createRecurringIncomeSchema,
  createTransactionSchema,
  type CreateBillInput,
  type CreateBudgetCategoryInput,
  type CreateContributionInput,
  type CreateFinancialAccountInput,
  type CreateRecurringIncomeInput,
  type CreateTransactionInput,
} from "@/server/validators/financas";
import { Button } from "@bethel/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bethel/ui/components/dialog";
import { Input } from "@bethel/ui/components/input";
import { Label } from "@bethel/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bethel/ui/components/select";
import { ArrowDown, ArrowUp, Bill, Candle, Card as CardIcon, Category, Repeat } from "reicon-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { ZodTypeAny } from "zod";

function applyZodErrors<T extends Record<string, unknown>>(
  form: { setError: (name: never, error: { message: string }) => void },
  schema: ZodTypeAny,
  values: T,
): { success: true; data: T } | { success: false } {
  const parsed = schema.safeParse(values);
  if (parsed.success) return { success: true, data: parsed.data as T };
  const issue = parsed.error.issues[0];
  if (issue?.path[0] != null) {
    form.setError(String(issue.path[0]) as never, { message: issue.message });
  }
  toast.error(issue?.message ?? "Dados inválidos.");
  return { success: false };
}

const TransactionType = { INCOME: "INCOME", EXPENSE: "EXPENSE" } as const;
type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
const ContributionType = { TITHE: "TITHE", OFFERING: "OFFERING", MISSIONS: "MISSIONS" } as const;
type ContributionType = (typeof ContributionType)[keyof typeof ContributionType];
const IncomeCategory = { SALARY: "SALARY", FREELANCE: "FREELANCE", RENT: "RENT", OTHER: "OTHER" } as const;
type IncomeCategory = (typeof IncomeCategory)[keyof typeof IncomeCategory];

const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  TITHE: "Dízimo",
  OFFERING: "Oferta de gratidão",
  MISSIONS: "Missões",
};

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

interface FinancialAccountRow {
  id: string;
  name: string;
  currency: MoneyCurrency;
  income: number;
  expense: number;
  balance: number;
}

interface CurrencyTotals {
  income: number;
  expense: number;
  balance: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
  pct: number;
  over: boolean;
  currency: MoneyCurrency;
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
  incomeCategory: IncomeCategory | null;
  accountId: string;
  accountName: string;
  currency: MoneyCurrency;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  paid: boolean;
  accountId: string;
  accountName: string;
  currency: MoneyCurrency;
}

interface ContributionEntry {
  id: string;
  type: string;
  label: string;
  amount: number;
  date: Date;
  accountId: string;
  accountName: string;
  currency: MoneyCurrency;
}

interface RecurringIncomeRow {
  id: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  category: IncomeCategory;
  active: boolean;
  accountId: string;
  accountName: string;
  currency: MoneyCurrency;
}

interface FinancasViewProps {
  balance: number;
  income: number;
  expense: number;
  byCurrency: Record<MoneyCurrency, CurrencyTotals>;
  accounts: FinancialAccountRow[];
  budget: BudgetCategory[];
  dizimo: { total: number; pct: number; items: ContributionItem[] };
  transactions: Transaction[];
  bills: Bill[];
  contributions: ContributionEntry[];
  recurringIncomes: RecurringIncomeRow[];
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

function defaultAccountId(accounts: FinancialAccountRow[], preferred?: MoneyCurrency) {
  if (preferred) {
    const match = accounts.find((a) => a.currency === preferred);
    if (match) return match.id;
  }
  return accounts[0]?.id ?? "";
}

export default function FinancasView({
  byCurrency,
  accounts,
  budget,
  dizimo,
  transactions,
  bills,
  contributions,
  recurringIncomes,
}: FinancasViewProps) {
  const { maskValue, searchQuery } = useDashboard();
  const visibleBills = useMemo(() => bills.filter((b) => matchesQuery(searchQuery, b.name, b.accountName)), [bills, searchQuery]);
  const visibleBudget = useMemo(() => budget.filter((c) => matchesQuery(searchQuery, c.name)), [budget, searchQuery]);
  const visibleTransactions = useMemo(
    () => transactions.filter((t) => matchesQuery(searchQuery, t.description, t.categoryName, t.accountName)),
    [transactions, searchQuery],
  );
  const visibleAccounts = useMemo(() => accounts.filter((a) => matchesQuery(searchQuery, a.name)), [accounts, searchQuery]);
  const visibleRecurring = useMemo(
    () => recurringIncomes.filter((r) => matchesQuery(searchQuery, r.description, r.accountName)),
    [recurringIncomes, searchQuery],
  );

  const [transactionOpen, setTransactionOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [editingAccount, setEditingAccount] = useState<FinancialAccountRow | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringIncomeRow | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const defaultAcc = defaultAccountId(accounts, "BRL");

  const transactionForm = useForm<CreateTransactionInput>({
    defaultValues: {
      description: "",
      amount: undefined as unknown as number,
      type: TransactionType.EXPENSE,
      date: today,
      accountId: defaultAcc,
      categoryId: "",
      incomeCategory: IncomeCategory.SALARY,
    },
  });

  const billForm = useForm<CreateBillInput>({
    defaultValues: { name: "", amount: undefined as unknown as number, dueDate: today, accountId: defaultAcc },
  });

  const contributionForm = useForm<CreateContributionInput>({
    defaultValues: { type: ContributionType.TITHE, amount: undefined as unknown as number, date: today, accountId: defaultAcc },
  });

  const categoryForm = useForm<CreateBudgetCategoryInput>({
    defaultValues: { name: "", monthlyLimit: undefined as unknown as number, currency: "BRL" },
  });

  const accountForm = useForm<CreateFinancialAccountInput>({
    defaultValues: { name: "", currency: "BRL" },
  });

  const recurringForm = useForm<CreateRecurringIncomeInput>({
    defaultValues: {
      description: "",
      amount: undefined as unknown as number,
      accountId: defaultAcc,
      dayOfMonth: 5,
      category: IncomeCategory.SALARY,
    },
  });

  const watchedType = useWatch({ control: transactionForm.control, name: "type" });
  const watchedAccountId = useWatch({ control: transactionForm.control, name: "accountId" });
  const selectedAccountCurrency = accounts.find((a) => a.id === watchedAccountId)?.currency;
  const budgetForAccount = budget.filter((c) => !selectedAccountCurrency || c.currency === selectedAccountCurrency);

  function openNewFinancialAccount() {
    setEditingAccount(null);
    accountForm.reset({ name: "", currency: "BRL" });
    setAccountOpen(true);
  }

  function openTransactionDialog(type: TransactionType) {
    setEditingTransaction(null);
    transactionForm.reset({
      description: "",
      amount: undefined as unknown as number,
      type,
      date: today,
      accountId: defaultAccountId(accounts, type === TransactionType.INCOME ? undefined : "BRL"),
      categoryId: "",
      incomeCategory: IncomeCategory.SALARY,
    });
    setTransactionOpen(true);
  }

  async function onSubmitTransaction(raw: CreateTransactionInput) {
    const parsed = applyZodErrors(transactionForm, createTransactionSchema, raw);
    if (!parsed.success) return;
    const data = parsed.data;
    const result = editingTransaction
      ? await updateTransactionAction(editingTransaction.id, data)
      : await createTransactionAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingTransaction ? "Transação atualizada." : data.type === "INCOME" ? "Receita registrada." : "Despesa registrada.");
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
      accountId: t.accountId,
      categoryId: t.categoryId ?? "",
      incomeCategory: t.incomeCategory ?? IncomeCategory.OTHER,
    });
    setTransactionOpen(true);
  }

  async function onSubmitBill(raw: CreateBillInput) {
    const parsed = applyZodErrors(billForm, createBillSchema, raw);
    if (!parsed.success) return;
    const data = parsed.data;
    const result = editingBill ? await updateBillAction(editingBill.id, data) : await createBillAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingBill ? "Conta atualizada." : "Conta criada.");
    billForm.reset({ name: "", amount: undefined as unknown as number, dueDate: today, accountId: defaultAcc });
    setEditingBill(null);
    setBillOpen(false);
  }

  function openEditBill(b: Bill) {
    setEditingBill(b);
    billForm.reset({ name: b.name, amount: b.amount, dueDate: toDateInput(b.dueDate), accountId: b.accountId });
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

  async function onSubmitContribution(raw: CreateContributionInput) {
    const parsed = applyZodErrors(contributionForm, createContributionSchema, raw);
    if (!parsed.success) return;
    const data = parsed.data;
    const result = await createContributionAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Contribuição registrada.");
    contributionForm.reset({ type: ContributionType.TITHE, amount: undefined as unknown as number, date: today, accountId: defaultAcc });
    setContributionOpen(false);
  }

  async function onSubmitCategory(raw: CreateBudgetCategoryInput) {
    const parsed = applyZodErrors(categoryForm, createBudgetCategorySchema, raw);
    if (!parsed.success) return;
    const data = parsed.data;
    const result = editingCategory
      ? await updateBudgetCategoryAction(editingCategory.id, data)
      : await createBudgetCategoryAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingCategory ? "Categoria atualizada." : "Categoria criada.");
    categoryForm.reset({ name: "", monthlyLimit: undefined as unknown as number, currency: "BRL" });
    setEditingCategory(null);
    setCategoryOpen(false);
  }

  function openEditCategory(c: BudgetCategory) {
    setEditingCategory(c);
    categoryForm.reset({ name: c.name, monthlyLimit: c.limit, currency: c.currency });
    setCategoryOpen(true);
  }

  async function onSubmitAccount(raw: CreateFinancialAccountInput) {
    const parsed = applyZodErrors(accountForm, createFinancialAccountSchema, raw);
    if (!parsed.success) return;
    const data = parsed.data;
    const result = editingAccount
      ? await updateFinancialAccountAction(editingAccount.id, data)
      : await createFinancialAccountAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingAccount ? "Conta atualizada." : "Conta criada.");
    accountForm.reset({ name: "", currency: "BRL" });
    setEditingAccount(null);
    setAccountOpen(false);
  }

  function openEditAccount(a: FinancialAccountRow) {
    setEditingAccount(a);
    accountForm.reset({ name: a.name, currency: a.currency });
    setAccountOpen(true);
  }

  async function onSubmitRecurring(raw: CreateRecurringIncomeInput) {
    const parsed = applyZodErrors(recurringForm, createRecurringIncomeSchema, raw);
    if (!parsed.success) return;
    const data = parsed.data;
    const result = editingRecurring
      ? await updateRecurringIncomeAction(editingRecurring.id, { ...data, active: editingRecurring.active })
      : await createRecurringIncomeAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingRecurring ? "Receita recorrente atualizada." : "Receita recorrente criada.");
    recurringForm.reset({
      description: "",
      amount: undefined as unknown as number,
      accountId: defaultAcc,
      dayOfMonth: 5,
      category: IncomeCategory.SALARY,
    });
    setEditingRecurring(null);
    setRecurringOpen(false);
  }

  function openEditRecurring(r: RecurringIncomeRow) {
    setEditingRecurring(r);
    recurringForm.reset({
      description: r.description,
      amount: r.amount,
      accountId: r.accountId,
      dayOfMonth: r.dayOfMonth,
      category: r.category,
    });
    setRecurringOpen(true);
  }

  function openNewRecurring() {
    setEditingRecurring(null);
    recurringForm.reset({
      description: "",
      amount: undefined as unknown as number,
      accountId: defaultAcc,
      dayOfMonth: 5,
      category: IncomeCategory.SALARY,
    });
    setRecurringOpen(true);
  }

  const composeGroups: ComposeGroup[] = [
    {
      id: "actions",
      actions: [
        {
          id: "income",
          label: "Registrar receita",
          description: "Salário, freelance ou outra entrada",
          icon: <ArrowUp size={18} />,
          onSelect: () => openTransactionDialog(TransactionType.INCOME),
        },
        {
          id: "expense",
          label: "Nova despesa",
          description: "Gasto do dia a dia na conta certa",
          icon: <ArrowDown size={18} />,
          onSelect: () => openTransactionDialog(TransactionType.EXPENSE),
        },
        {
          id: "financial-account",
          label: "Nova conta financeira",
          description: "Conta em real ou dólar para lançamentos",
          icon: <CardIcon size={18} />,
          onSelect: openNewFinancialAccount,
        },
        {
          id: "bill",
          label: "Nova conta a pagar",
          description: "Conta com vencimento e valor",
          icon: <Bill size={18} />,
          onSelect: () => {
            setEditingBill(null);
            billForm.reset({ name: "", amount: undefined as unknown as number, dueDate: today, accountId: defaultAcc });
            setBillOpen(true);
          },
        },
        {
          id: "category",
          label: "Nova categoria",
          description: "Limite mensal de orçamento",
          icon: <Category size={18} />,
          onSelect: () => {
            setEditingCategory(null);
            categoryForm.reset({ name: "", monthlyLimit: undefined as unknown as number, currency: "BRL" });
            setCategoryOpen(true);
          },
        },
        {
          id: "contribution",
          label: "Registrar dízimo",
          description: "Dízimo, oferta ou missões",
          icon: <Candle size={18} />,
          onSelect: () => {
            contributionForm.reset({ type: ContributionType.TITHE, amount: undefined as unknown as number, date: today, accountId: defaultAcc });
            setContributionOpen(true);
          },
        },
        {
          id: "recurring",
          label: "Receita recorrente",
          description: "Entrada automática todo mês",
          icon: <Repeat size={18} />,
          onSelect: openNewRecurring,
        },
      ],
    },
  ];

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

  async function removeAccount(id: string) {
    if (accounts.length <= 1) {
      toast.error("Mantenha pelo menos uma conta financeira.");
      return;
    }
    const account = accounts.find((a) => a.id === id);
    const name = account?.name ?? "esta conta";
    if (
      !window.confirm(
        `Apagar "${name}" também remove os lançamentos, contas a pagar, contribuições e receitas recorrentes ligados a ela. Esta ação não tem volta.`,
      )
    ) {
      return;
    }
    setPendingId(id);
    const result = await deleteFinancialAccountAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  async function removeRecurring(id: string) {
    setPendingId(id);
    const result = await deleteRecurringIncomeAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  async function toggleRecurring(r: RecurringIncomeRow) {
    setPendingId(r.id);
    const result = await updateRecurringIncomeAction(r.id, {
      description: r.description,
      amount: r.amount,
      accountId: r.accountId,
      dayOfMonth: r.dayOfMonth,
      category: r.category,
      active: !r.active,
    });
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  const brl = byCurrency?.BRL ?? { income: 0, expense: 0, balance: 0 };
  const usd = byCurrency?.USD ?? { income: 0, expense: 0, balance: 0 };
  const hasUsd = accounts.some((a) => a.currency === "USD") || usd.income > 0 || usd.expense > 0;
  const despesasPct = brl.income > 0 ? Math.round((brl.expense / brl.income) * 100) : 0;

  function AccountSelectField({
    id,
    value,
    onChange,
    error,
  }: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }) {
    const accountItems = Object.fromEntries(
      accounts.map((a) => [a.id, `${a.name} · ${CURRENCY_LABELS[a.currency]}`]),
    );

    return (
      <div className="flex flex-col gap-1.5">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Label htmlFor={id}>Conta financeira</Label>
          <button
            type="button"
            onClick={openNewFinancialAccount}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ds-accent)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Nova conta
          </button>
        </div>
        <Select
          items={accountItems}
          value={value || undefined}
          onValueChange={(next) => onChange(next ?? "")}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.length === 0 ? (
              <SelectItem value="__none" disabled>
                Nenhuma conta financeira
              </SelectItem>
            ) : (
              accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} · {CURRENCY_LABELS[a.currency]}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ds-muted)" }}>
          Escolha onde o valor entra ou sai (ex.: conta em real ou em dólar).
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <TopBar title="Finanças" subtitle="Visão geral financeira da família" />

      <Dialog
              open={contributionOpen}
              onOpenChange={(next) => {
                setContributionOpen(next);
                if (!next) contributionForm.reset({ type: ContributionType.TITHE, amount: undefined as unknown as number, date: today, accountId: defaultAcc });
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dízimo e ofertas</DialogTitle>
                  <DialogDescription>A meta de 10% usa a receita em reais do mês.</DialogDescription>
                </DialogHeader>
                <form onSubmit={contributionForm.handleSubmit(onSubmitContribution)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="contrib-type">Tipo</Label>
                    <Controller
                      control={contributionForm.control}
                      name="type"
                      render={({ field }) => (
                        <Select
                          items={CONTRIBUTION_LABELS}
                          value={field.value}
                          onValueChange={(value) => {
                          if (value != null) field.onChange(value);
                        }}>
                          <SelectTrigger id="contrib-type" className="w-full">
                            <SelectValue placeholder="Tipo" />
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
                  <Controller
                    control={contributionForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <AccountSelectField id="contrib-account" value={field.value} onChange={field.onChange} error={contributionForm.formState.errors.accountId?.message} />
                    )}
                  />
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
                  categoryForm.reset({ name: "", monthlyLimit: undefined as unknown as number, currency: "BRL" });
                  setEditingCategory(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Editar categoria" : "Categoria de orçamento"}</DialogTitle>
                  <DialogDescription>Defina um limite mensal na moeda da categoria.</DialogDescription>
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
                    <Label htmlFor="cat-currency">Moeda</Label>
                    <Controller
                      control={categoryForm.control}
                      name="currency"
                      render={({ field }) => (
                        <Select
                          items={CURRENCY_LABELS}
                          value={field.value}
                          onValueChange={(value) => {
                          if (value != null) field.onChange(value);
                        }}>
                          <SelectTrigger id="cat-currency" className="w-full">
                            <SelectValue placeholder="Moeda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">{CURRENCY_LABELS.BRL}</SelectItem>
                            <SelectItem value="USD">{CURRENCY_LABELS.USD}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
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
                  billForm.reset({ name: "", amount: undefined as unknown as number, dueDate: today, accountId: defaultAcc });
                  setEditingBill(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBill ? "Editar conta" : "Nova conta a pagar"}</DialogTitle>
                  <DialogDescription>Cadastre uma conta vinculada a uma conta financeira.</DialogDescription>
                </DialogHeader>
                <form onSubmit={billForm.handleSubmit(onSubmitBill)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-name">Nome</Label>
                    <Input id="bill-name" placeholder="Energia elétrica" {...billForm.register("name")} />
                    {billForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{billForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <Controller
                    control={billForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <AccountSelectField id="bill-account" value={field.value} onChange={field.onChange} error={billForm.formState.errors.accountId?.message} />
                    )}
                  />
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction
                      ? "Editar transação"
                      : watchedType === TransactionType.INCOME
                        ? "Registrar receita"
                        : "Nova despesa"}
                  </DialogTitle>
                  <DialogDescription>
                    {watchedType === TransactionType.INCOME
                      ? "Lance uma entrada na conta financeira correta."
                      : "Lance um gasto vinculado à conta e à categoria."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-description">Descrição</Label>
                    <Input
                      id="tx-description"
                      placeholder={watchedType === TransactionType.INCOME ? "Salário" : "Supermercado"}
                      {...transactionForm.register("description")}
                    />
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
                  <input type="hidden" {...transactionForm.register("type")} />
                  <Controller
                    control={transactionForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <AccountSelectField id="tx-account" value={field.value} onChange={field.onChange} error={transactionForm.formState.errors.accountId?.message} />
                    )}
                  />
                  {watchedType === TransactionType.INCOME ? (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tx-income-category">Categoria da receita</Label>
                      <Controller
                        control={transactionForm.control}
                        name="incomeCategory"
                        render={({ field }) => (
                          <Select
                            items={INCOME_CATEGORY_LABELS}
                            value={field.value ?? IncomeCategory.SALARY}
                            onValueChange={(value) => {
                          if (value != null) field.onChange(value);
                        }}>
                            <SelectTrigger id="tx-income-category" className="w-full">
                              <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {INCOME_CATEGORY_LABELS[cat]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {transactionForm.formState.errors.incomeCategory && (
                        <p className="text-sm text-destructive">{transactionForm.formState.errors.incomeCategory.message}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tx-category">Categoria</Label>
                      <Controller
                        control={transactionForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <Select
                            items={{
                              none: "Sem categoria",
                              ...Object.fromEntries(budgetForAccount.map((c) => [c.id, c.name])),
                            }}
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(!value || value === "none" ? "" : value)}
                          >
                            <SelectTrigger id="tx-category" className="w-full">
                              <SelectValue placeholder="Sem categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem categoria</SelectItem>
                              {budgetForAccount.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tx-date">Data</Label>
                    <Input id="tx-date" type="date" {...transactionForm.register("date")} />
                    {transactionForm.formState.errors.date && (
                      <p className="text-sm text-destructive">{transactionForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={transactionForm.formState.isSubmitting} className="w-full">
                      {transactionForm.formState.isSubmitting
                        ? "Salvando..."
                        : editingTransaction
                          ? "Salvar"
                          : watchedType === TransactionType.INCOME
                            ? "Registrar receita"
                            : "Registrar despesa"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div
          className="ds-cols-3"
          style={{ display: "grid", gridTemplateColumns: hasUsd ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: 16, marginBottom: 18 }}
        >
          <div style={{ background: "var(--ds-accent)", borderRadius: 16, padding: 22, color: "#fff" }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Saldo do mês · R$</div>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 28, marginTop: 10, letterSpacing: "-0.02em" }}>
              {maskValue(formatCurrency(brl.balance, "BRL"))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>Receitas − despesas em reais</div>
          </div>
          {hasUsd && (
            <div style={{ background: "#3d5a80", borderRadius: 16, padding: 22, color: "#fff" }}>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>Saldo do mês · US$</div>
              <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 28, marginTop: 10, letterSpacing: "-0.02em" }}>
                {maskValue(formatCurrency(usd.balance, "USD"))}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>Receitas − despesas em dólar</div>
            </div>
          )}
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>Receitas · R$</div>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 28, marginTop: 10, letterSpacing: "-0.02em", color: "#4f8a6b" }}>
              {maskValue(formatCurrency(brl.income, "BRL"))}
            </div>
            {hasUsd && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#4f8a6b", marginTop: 6 }}>
                + {maskValue(formatCurrency(usd.income, "USD"))}
              </div>
            )}
            {!hasUsd && <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 6 }}>Total de entradas no mês</div>}
          </Card>
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>Despesas · R$</div>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 28, marginTop: 10, letterSpacing: "-0.02em", color: "#c0764f" }}>
              {maskValue(formatCurrency(brl.expense, "BRL"))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 6 }}>
              {hasUsd ? `+ ${maskValue(formatCurrency(usd.expense, "USD"))}` : `${despesasPct}% da receita`}
            </div>
          </Card>
        </div>

        {/* Contas financeiras */}
        <Card style={{ padding: "20px 22px", marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Contas financeiras</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ds-muted)" }}>
              Cadastre aqui contas em real e em dólar. Elas aparecem ao lançar receita ou despesa.
            </p>
          </div>
          <Dialog
            open={accountOpen}
            onOpenChange={(next) => {
              setAccountOpen(next);
              if (!next) {
                accountForm.reset({ name: "", currency: "BRL" });
                setEditingAccount(null);
              }
            }}
          >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAccount ? "Editar conta financeira" : "Nova conta financeira"}</DialogTitle>
                  <DialogDescription>Separe contas em real e em dólar para não misturar saldos.</DialogDescription>
                </DialogHeader>
                <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="acc-name">Nome</Label>
                    <Input id="acc-name" placeholder="Ex.: Nubank, Wise USD" {...accountForm.register("name")} />
                    {accountForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{accountForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="acc-currency">Moeda</Label>
                    <Controller
                      control={accountForm.control}
                      name="currency"
                      render={({ field }) => (
                        <Select
                          items={CURRENCY_LABELS}
                          value={field.value}
                          onValueChange={(value) => {
                          if (value != null) field.onChange(value);
                        }} disabled={Boolean(editingAccount)}>
                          <SelectTrigger id="acc-currency" className="w-full">
                            <SelectValue placeholder="Moeda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">{CURRENCY_LABELS.BRL}</SelectItem>
                            <SelectItem value="USD">{CURRENCY_LABELS.USD}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {editingAccount && (
                      <p style={{ fontSize: 12, color: "var(--ds-muted)" }}>A moeda não pode ser alterada depois de criada.</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={accountForm.formState.isSubmitting} className="w-full">
                      {accountForm.formState.isSubmitting ? "Salvando..." : editingAccount ? "Salvar" : "Criar conta financeira"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
          </Dialog>
          {visibleAccounts.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ds-muted)", padding: "8px 0" }}>Nenhuma conta financeira ainda.</p>
          )}
          {visibleAccounts.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--ds-hover)", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ds-text)" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "var(--ds-muted)", marginTop: 2, fontWeight: 600 }}>
                  {CURRENCY_LABELS[a.currency]} · saldo do mês {maskValue(formatCurrency(a.balance, a.currency))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <QuietAction disabled={pendingId === a.id} onClick={() => openEditAccount(a)}>
                  Editar
                </QuietAction>
                <QuietAction danger disabled={pendingId === a.id} onClick={() => removeAccount(a.id)}>
                  Apagar
                </QuietAction>
              </div>
            </div>
          ))}
        </Card>

        {/* Receitas recorrentes */}
        <Card style={{ padding: "20px 22px", marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Receitas recorrentes</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ds-muted)" }}>
              Geram o lançamento do mês. Apagar a receita interrompe os próximos meses. O lançamento já gerado continua na lista e, se for apagado, não volta neste mês.
            </p>
          </div>
          <Dialog
              open={recurringOpen}
              onOpenChange={(next) => {
                setRecurringOpen(next);
                if (!next) {
                  recurringForm.reset({
                    description: "",
                    amount: undefined as unknown as number,
                    accountId: defaultAcc,
                    dayOfMonth: 5,
                    category: IncomeCategory.SALARY,
                  });
                  setEditingRecurring(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRecurring ? "Editar receita recorrente" : "Receita recorrente"}</DialogTitle>
                  <DialogDescription>Ideal para salário ou entradas fixas todo mês.</DialogDescription>
                </DialogHeader>
                <form onSubmit={recurringForm.handleSubmit(onSubmitRecurring)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rec-description">Descrição</Label>
                    <Input id="rec-description" placeholder="Salário — João" {...recurringForm.register("description")} />
                    {recurringForm.formState.errors.description && (
                      <p className="text-sm text-destructive">{recurringForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  <Controller
                    control={recurringForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <AccountSelectField id="rec-account" value={field.value} onChange={field.onChange} error={recurringForm.formState.errors.accountId?.message} />
                    )}
                  />
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rec-amount">Valor</Label>
                    <Input id="rec-amount" type="number" step="0.01" min="0" {...recurringForm.register("amount")} />
                    {recurringForm.formState.errors.amount && (
                      <p className="text-sm text-destructive">{recurringForm.formState.errors.amount.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rec-day">Dia do mês</Label>
                    <Input id="rec-day" type="number" min={1} max={28} {...recurringForm.register("dayOfMonth")} />
                    {recurringForm.formState.errors.dayOfMonth && (
                      <p className="text-sm text-destructive">{recurringForm.formState.errors.dayOfMonth.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rec-category">Categoria</Label>
                    <Controller
                      control={recurringForm.control}
                      name="category"
                      render={({ field }) => (
                        <Select
                          items={INCOME_CATEGORY_LABELS}
                          value={field.value}
                          onValueChange={(value) => {
                          if (value != null) field.onChange(value);
                        }}>
                          <SelectTrigger id="rec-category" className="w-full">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {INCOME_CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={recurringForm.formState.isSubmitting} className="w-full">
                      {recurringForm.formState.isSubmitting ? "Salvando..." : editingRecurring ? "Salvar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
          </Dialog>
          {visibleRecurring.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ds-muted)", padding: "8px 0" }}>
              Nenhuma receita recorrente. Cadastre o salário para não esquecer de lançar todo mês.
            </p>
          )}
          {visibleRecurring.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--ds-hover)", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: r.active ? "var(--ds-text)" : "var(--ds-muted)" }}>
                  {r.description}
                  {!r.active && " · pausada"}
                </div>
                <div style={{ fontSize: 12, color: "var(--ds-muted)", marginTop: 2, fontWeight: 600 }}>
                  Dia {r.dayOfMonth} · {INCOME_CATEGORY_LABELS[r.category]} · {r.accountName}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#4f8a6b" }}>{maskValue(formatCurrency(r.amount, r.currency))}</div>
                <QuietAction disabled={pendingId === r.id} onClick={() => toggleRecurring(r)}>
                  {r.active ? "Pausar" : "Ativar"}
                </QuietAction>
                <QuietAction disabled={pendingId === r.id} onClick={() => openEditRecurring(r)}>
                  Editar
                </QuietAction>
                <QuietAction danger disabled={pendingId === r.id} onClick={() => removeRecurring(r.id)}>
                  Apagar
                </QuietAction>
              </div>
            </div>
          ))}
        </Card>

        {/* Dízimos */}
        <Card style={{ padding: "20px 22px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: "rgba(199,154,62,.13)", color: "#c79a3e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Candle size={19} />
              </div>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Dízimos &amp; Ofertas</h3>
            </div>
            <span style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--ds-muted)" }}>
              &ldquo;Cada um dê conforme propôs no coração&rdquo; · 2 Coríntios 9.7
            </span>
          </div>
          <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-muted)" }}>Entregue neste mês (R$)</div>
              <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: "-0.02em", color: "#c79a3e" }}>
                {maskValue(formatCurrency(dizimo.total, "BRL"))}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ds-muted)", marginTop: 8 }}>
                Dízimo — {dizimo.pct}% da meta de 10% da receita em R$
              </div>
              <div style={{ height: 8, background: "var(--ds-track)", borderRadius: 20, overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", borderRadius: 20, background: "#c79a3e", width: `${dizimo.pct}%` }} />
              </div>
            </div>
            <div>
              {dizimo.items.map((item) => (
                <div key={item.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--ds-hover)" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ds-text)" }}>{item.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ds-text)" }}>{maskValue(formatCurrency(item.amount, "BRL"))}</span>
                </div>
              ))}
              {contributions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ds-muted)", marginBottom: 4 }}>
                    Todos os lançamentos
                  </div>
                  {contributions.map((entry) => (
                    <div key={entry.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                      <span style={{ fontSize: 12.5, color: "var(--ds-muted)" }}>
                        {entry.label} · {entry.accountName} · {formatShortDate(new Date(entry.date))}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{maskValue(formatCurrency(entry.amount, entry.currency))}</span>
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
              Nenhuma conta cadastrada. Use Adicionar no canto da tela para começar.
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
                      {b.paid ? "Paga" : tag} · {b.accountName}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ds-text)" }}>{maskValue(formatCurrency(b.amount, b.currency))}</div>
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
                    <span style={{ fontWeight: 600, color: "var(--ds-text)" }}>
                      {c.name} <span style={{ color: "var(--ds-muted)", fontWeight: 500 }}>· {CURRENCY_LABELS[c.currency]}</span>
                    </span>
                    <span style={{ color: "var(--ds-muted)", display: "flex", alignItems: "center", gap: 10 }}>
                      <span>
                        <b style={{ color: "var(--ds-text)", fontWeight: 600 }}>{maskValue(formatCurrency(c.spent, c.currency))}</b> / {maskValue(formatCurrency(c.limit, c.currency))}
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
            <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Movimentações</h3>
            <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "var(--ds-muted)" }}>
              Todas as entradas e saídas da família, inclusive de meses anteriores.
            </p>
            {visibleTransactions.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--ds-muted)", padding: "12px 0" }}>
                Nenhuma transação registrada. Use Registrar receita ou Nova despesa.
              </p>
            )}
            <div>
              {visibleTransactions.map((t) => {
                const entrada = t.type === TransactionType.INCOME;
                const categoryLabel = entrada
                  ? (t.incomeCategory ? INCOME_CATEGORY_LABELS[t.incomeCategory] : "Receita")
                  : (t.categoryName ?? "Sem categoria");
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
                        {entrada ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ds-text)" }}>{t.description}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ds-muted)", marginTop: 1 }}>
                          {categoryLabel} · {t.accountName} · {formatShortDate(new Date(t.date))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: entrada ? "#4f8a6b" : "var(--ds-text)" }}>
                        {entrada ? "+ " : "− "}
                        {maskValue(formatCurrency(t.amount, t.currency))}
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

      <FloatingComposeMenu groups={composeGroups} />
    </>
  );
}
