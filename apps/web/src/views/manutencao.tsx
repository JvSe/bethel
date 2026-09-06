"use client";

import { createMaintenanceItemAction, deleteMaintenanceItemAction, markMaintenanceDoneAction } from "@/app/(dashboard)/manutencao/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatShortDate, matchesQuery } from "@/lib/format";
import { daysUntil } from "@/lib/calc";
import { createMaintenanceItemSchema, type CreateMaintenanceItemInput } from "@/server/validators/manutencao";
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

// Mirrors the Prisma `MaintenanceFrequency` enum. Duplicated here (instead of
// importing from @bethel/db) so this client component never pulls the
// Prisma/pg runtime into the browser bundle.
const MaintenanceFrequency = { MONTHLY: "MONTHLY", QUARTERLY: "QUARTERLY", SEMIANNUAL: "SEMIANNUAL", ANNUAL: "ANNUAL" } as const;
type MaintenanceFrequency = (typeof MaintenanceFrequency)[keyof typeof MaintenanceFrequency];

const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "A cada 3 meses",
  SEMIANNUAL: "A cada 6 meses",
  ANNUAL: "Anual",
};

interface MaintenanceItem {
  id: string;
  title: string;
  type: string;
  frequency: MaintenanceFrequency;
  nextDueAt: Date;
}

interface ManutencaoViewProps {
  items: MaintenanceItem[];
}

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 4 V6.5" /><path d="M12 17.5 V20" />
      <path d="M4 12 H6.5" /><path d="M17.5 12 H20" />
      <path d="M6.3 6.3 L8 8" /><path d="M16 16 L17.7 17.7" />
      <path d="M17.7 6.3 L16 8" /><path d="M8 16 L6.3 17.7" />
    </svg>
  );
}

function dueInfo(nextDueAt: Date) {
  const diffDays = daysUntil(nextDueAt);
  const tag = diffDays < 0 ? `Atrasado há ${Math.abs(diffDays)} dias` : diffDays === 0 ? "Vence hoje" : `Em ${diffDays} dias`;
  return { tag, urgent: diffDays <= 7 };
}

export default function ManutencaoView({ items }: ManutencaoViewProps) {
  const { searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const visibleItems = useMemo(
    () => items.filter((item) => matchesQuery(searchQuery, item.title, item.type)),
    [items, searchQuery],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaintenanceItemInput>({
    resolver: zodResolver(createMaintenanceItemSchema),
    defaultValues: { title: "", type: "", frequency: MaintenanceFrequency.MONTHLY, nextDueAt: "" },
  });

  async function onSubmit(data: CreateMaintenanceItemInput) {
    const result = await createMaintenanceItemAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Manutenção cadastrada.");
    reset();
    setOpen(false);
  }

  async function markDone(id: string) {
    setPendingId(id);
    const result = await markMaintenanceDoneAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
    else toast.success("Manutenção marcada como feita.");
  }

  async function remove(id: string) {
    setPendingId(id);
    const result = await deleteMaintenanceItemAction(id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  return (
    <>
      <TopBar
        title="Manutenção"
        subtitle={`${items.length} ${items.length === 1 ? "item agendado" : "itens agendados"}`}
        action={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) reset();
            }}
          >
            <DialogTrigger render={<Button className="gap-2 shadow-sm" />}>
              <PlusIcon className="size-4" />
              Adicionar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova manutenção</DialogTitle>
                <DialogDescription>Cadastre um item para acompanhar a manutenção.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mnt-title">Título</Label>
                  <Input id="mnt-title" placeholder="Limpeza do ar-condicionado" {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mnt-type">Tipo</Label>
                  <Input id="mnt-type" placeholder="Climatização" {...register("type")} />
                  {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mnt-frequency">Frequência</Label>
                  <Controller
                    control={control}
                    name="frequency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="mnt-frequency" className="w-full">
                          <SelectValue placeholder="Frequência">
                            {(value: string) => FREQUENCY_LABELS[value as MaintenanceFrequency]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(FREQUENCY_LABELS) as MaintenanceFrequency[]).map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {FREQUENCY_LABELS[freq]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mnt-nextDueAt">Próxima data</Label>
                  <Input id="mnt-nextDueAt" type="date" {...register("nextDueAt")} />
                  {errors.nextDueAt && <p className="text-sm text-destructive">{errors.nextDueAt.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Salvando..." : "Cadastrar manutenção"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div
          style={{
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 16,
            boxShadow: "0 1px 2px rgba(30,28,24,.03)",
            padding: "8px 24px",
          }}
        >
          {visibleItems.length === 0 && (
            <p style={{ fontSize: 13.5, color: "var(--ds-muted)", padding: "22px 0", textAlign: "center" }}>
              Nenhuma manutenção cadastrada ainda. Use Adicionar para acompanhar a casa.
            </p>
          )}
          {visibleItems.map((m) => {
            const { tag, urgent } = dueInfo(m.nextDueAt);
            return (
              <div
                key={m.id}
                style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderBottom: "1px solid var(--ds-hover)" }}
              >
                <div
                  style={{
                    width: 46, height: 46, flexShrink: 0, borderRadius: 12,
                    background: urgent ? "#f6ece4" : "var(--ds-soft)",
                    color: urgent ? "#c0764f" : "var(--ds-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <GearIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-text)" }}>{m.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ds-muted)", marginTop: 3 }}>
                    {m.type} · {FREQUENCY_LABELS[m.frequency]}
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ds-text)" }}>{formatShortDate(new Date(m.nextDueAt))}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: urgent ? "#c0764f" : "var(--ds-muted)", marginTop: 3 }}>
                      {tag}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Button size="sm" variant="outline" disabled={pendingId === m.id} onClick={() => markDone(m.id)}>
                      {pendingId === m.id ? "..." : "Feito"}
                    </Button>
                    <QuietAction danger disabled={pendingId === m.id} onClick={() => remove(m.id)}>
                      Apagar
                    </QuietAction>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
