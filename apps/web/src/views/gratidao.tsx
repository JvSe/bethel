"use client";

import { createGratitudeEntryAction, deleteGratitudeEntryAction } from "@/app/(dashboard)/gratidao/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatWeekdayDate, initials, matchesQuery } from "@/lib/format";
import { createGratitudeEntrySchema, type CreateGratitudeEntryInput } from "@/server/validators/gratidao";
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

interface GratitudeEntry {
  id: string;
  text: string;
  date: Date;
  authorName: string | null;
  authorColor: string;
}

interface GratidaoViewProps {
  entries: GratitudeEntry[];
}

export default function GratidaoView({ entries }: GratidaoViewProps) {
  const { searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const visibleEntries = useMemo(
    () => entries.filter((e) => matchesQuery(searchQuery, e.text, e.authorName)),
    [entries, searchQuery],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGratitudeEntryInput>({
    resolver: zodResolver(createGratitudeEntrySchema),
    defaultValues: { text: "" },
  });

  async function onSubmit(data: CreateGratitudeEntryInput) {
    const result = await createGratitudeEntryAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Gratidão registrada.");
    reset();
    setOpen(false);
  }

  async function remove(id: string) {
    const result = await deleteGratitudeEntryAction(id);
    if (!result.success) toast.error(result.error);
  }

  return (
    <>
      <TopBar
        title="Diário de gratidão"
        subtitle="O que agradecemos esta semana"
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
                <DialogTitle>Nova gratidão</DialogTitle>
                <DialogDescription>Registre algo pelo que a família é grata.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gratitude-text">Gratidão</Label>
                  <Textarea id="gratitude-text" placeholder="Pela..." rows={4} {...register("text")} />
                  {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Registrando..." : "Registrar gratidão"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        {visibleEntries.length === 0 ? (
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
            Nenhuma gratidão registrada ainda. Use Adicionar para começar o diário da família.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {visibleEntries.map((g) => (
              <div
                key={g.id}
                style={{
                  background: "var(--ds-surface)",
                  border: "1px solid var(--ds-border)",
                  borderRadius: 16,
                  boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  minHeight: 170,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-bricolage), sans-serif",
                    fontSize: 42,
                    lineHeight: 0.5,
                    color: "#c79a3e",
                    height: 20,
                  }}
                >
                  &ldquo;
                </div>
                <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, lineHeight: 1.5, color: "var(--ds-text)" }}>
                  {g.text}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--ds-hover)", paddingTop: 14 }}>
                  <div
                    style={{
                      width: 28, height: 28, flexShrink: 0, borderRadius: "50%",
                      background: g.authorColor, color: "#fff", fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {g.authorName ? initials(g.authorName) : "?"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>{g.authorName ?? "Alguém da família"}</div>
                  <div style={{ fontSize: 12, color: "var(--ds-muted)", marginLeft: "auto" }}>{formatWeekdayDate(g.date)}</div>
                </div>
                <QuietAction danger onClick={() => remove(g.id)}>
                  Apagar
                </QuietAction>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
