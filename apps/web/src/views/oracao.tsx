"use client";

import { createPrayerRequestAction, deletePrayerRequestAction, updatePrayerRequestStatusAction } from "@/app/(dashboard)/oracao/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatRelativeDate, initials, matchesQuery } from "@/lib/format";
import { createPrayerRequestSchema, type CreatePrayerRequestInput } from "@/server/validators/oracao";
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
import { Label } from "@bethel/ui/components/label";
import { Textarea } from "@bethel/ui/components/textarea";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Mirrors the Prisma `PrayerStatus` enum, kept local so this client
// component never pulls the Prisma/pg runtime into the browser bundle.
const PrayerStatus = { PRAYING: "PRAYING", ANSWERED: "ANSWERED" } as const;
type PrayerStatus = (typeof PrayerStatus)[keyof typeof PrayerStatus];

const STATUS_LABELS: Record<PrayerStatus, string> = { PRAYING: "Orando", ANSWERED: "Respondido" };
const STATUS_STYLES: Record<PrayerStatus, { bg: string; color: string }> = {
  PRAYING: { bg: "#f7efe0", color: "#b07d28" },
  ANSWERED: { bg: "#eaf1ec", color: "#4f8a6b" },
};

interface PrayerRequest {
  id: string;
  text: string;
  status: PrayerStatus;
  createdAt: Date;
  authorName: string | null;
  authorColor: string;
}

interface OracaoViewProps {
  requests: PrayerRequest[];
}

export default function OracaoView({ requests }: OracaoViewProps) {
  const { searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const visibleRequests = useMemo(
    () => requests.filter((r) => matchesQuery(searchQuery, r.text, r.authorName)),
    [requests, searchQuery],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePrayerRequestInput>({
    resolver: zodResolver(createPrayerRequestSchema),
    defaultValues: { text: "" },
  });

  async function onSubmit(data: CreatePrayerRequestInput) {
    const result = await createPrayerRequestAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Pedido de oração adicionado.");
    reset();
    setOpen(false);
  }

  async function toggleStatus(request: PrayerRequest) {
    const nextStatus = request.status === PrayerStatus.PRAYING ? PrayerStatus.ANSWERED : PrayerStatus.PRAYING;
    const result = await updatePrayerRequestStatusAction(request.id, nextStatus);
    if (!result.success) {
      toast.error(result.error);
    }
  }

  async function remove(id: string) {
    const result = await deletePrayerRequestAction(id);
    if (!result.success) toast.error(result.error);
  }

  const answeredCount = requests.filter((r) => r.status === PrayerStatus.ANSWERED).length;

  return (
    <>
      <TopBar
        title="Mural de oração"
        subtitle={`${requests.length} ${requests.length === 1 ? "pedido" : "pedidos"} · ${answeredCount} respondidos`}
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
                <DialogTitle>Novo pedido de oração</DialogTitle>
                <DialogDescription>Compartilhe um pedido com a família.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prayer-text">Pedido</Label>
                  <Textarea id="prayer-text" placeholder="Pela..." rows={4} {...register("text")} />
                  {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Adicionando..." : "Adicionar pedido"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        {visibleRequests.length === 0 ? (
          <div
            style={{
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              borderRadius: 16,
              padding: 22,
              fontSize: 13.5,
              color: "var(--ds-muted)",
              textAlign: "center",
            }}
          >
            Nenhum pedido de oração ainda. Use Adicionar para compartilhar com a família.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
            {visibleRequests.map((p) => {
              const s = STATUS_STYLES[p.status];
              return (
                <div
                  key={p.id}
                  style={{
                    background: "var(--ds-surface)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: 16,
                    boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                    padding: "20px 21px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 15,
                    minHeight: 160,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 30, height: 30, flexShrink: 0, borderRadius: "50%",
                          background: p.authorColor, color: "#fff", fontSize: 10.5, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {p.authorName ? initials(p.authorName) : "?"}
                      </div>
                      <div style={{ lineHeight: 1.2 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>{p.authorName ?? "Alguém da família"}</div>
                        <div style={{ fontSize: 11, color: "var(--ds-muted)" }}>{formatRelativeDate(p.createdAt)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStatus(p)}
                      title="Alternar status"
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20,
                        background: s.bg, color: s.color, border: "none", cursor: "pointer",
                      }}
                    >
                      {STATUS_LABELS[p.status]}
                    </button>
                  </div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: "var(--ds-text)" }}>
                    {p.text}
                  </div>
                  <QuietAction danger onClick={() => remove(p.id)}>
                    Apagar
                  </QuietAction>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
