"use client";

import { createCalendarEventAction, deleteCalendarEventAction, updateCalendarEventAction } from "@/app/(dashboard)/calendario/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { matchesQuery, toDateInput, toTimeInput } from "@/lib/format";
import { createCalendarEventSchema, type CreateCalendarEventInput } from "@/server/validators/calendario";
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
import { ChevronLeft, ChevronRight, Plus } from "reicon-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  startsAt: Date;
  endsAt: Date | null;
}

interface CalendarioViewProps {
  weekStart: Date;
  events: CalendarEvent[];
  weekOffset: number;
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CATEGORY_PALETTE = ["#c79a3e", "#4f8a6b", "#c0764f", "#5878a8", "#8a5b86"];

function categoryColor(category: string) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

function formatTime(date: Date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });

export default function CalendarioView({ weekStart, events, weekOffset }: CalendarioViewProps) {
  const { searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCalendarEventInput>({
    resolver: zodResolver(createCalendarEventSchema),
    defaultValues: { title: "", category: "", date: "", startTime: "", endTime: "" },
  });

  async function onSubmit(data: CreateCalendarEventInput) {
    const result = editingEvent
      ? await updateCalendarEventAction(editingEvent.id, data)
      : await createCalendarEventAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editingEvent ? "Evento atualizado." : "Evento criado.");
    reset();
    setEditingEvent(null);
    setOpen(false);
  }

  function openEdit(event: CalendarEvent) {
    setEditingEvent(event);
    reset({
      title: event.title,
      category: event.category,
      date: toDateInput(event.startsAt),
      startTime: toTimeInput(event.startsAt),
      endTime: event.endsAt ? toTimeInput(event.endsAt) : "",
    });
    setOpen(true);
  }

  async function remove(eventId: string) {
    const result = await deleteCalendarEventAction(eventId);
    if (!result.success) toast.error(result.error);
  }

  const days = useMemo(() => {
    const today = new Date().toDateString();
    return DAY_LABELS.map((label, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dayEvents = events
        .filter((e) => new Date(e.startsAt).toDateString() === date.toDateString())
        .filter((e) => matchesQuery(searchQuery, e.title, e.category))
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      return { label, date, hoje: date.toDateString() === today, events: dayEvents };
    });
  }, [weekStart, events, searchQuery]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  return (
    <>
      <TopBar
        title="Calendário"
        subtitle={`${weekStart.getDate()} – ${weekEnd.getDate()} de ${monthFormatter.format(weekEnd)} · Rotina da família`}
        action={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) {
                reset();
                setEditingEvent(null);
              }
            }}
          >
            <DialogTrigger
              render={
                <Button
                  className="gap-2 shadow-sm"
                  onClick={() => {
                    setEditingEvent(null);
                    reset({ title: "", category: "", date: "", startTime: "", endTime: "" });
                  }}
                />
              }
            >
              <Plus className="size-4" />
              Adicionar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Editar evento" : "Novo evento"}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? "Atualize o compromisso da família." : "Adicione um evento à agenda da família."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-title">Título</Label>
                  <Input id="event-title" placeholder="Jantar em família" {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-category">Categoria</Label>
                  <Input id="event-category" placeholder="Casa" {...register("category")} />
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-date">Data</Label>
                  <Input id="event-date" type="date" {...register("date")} />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label htmlFor="event-startTime">Início</Label>
                    <Input id="event-startTime" type="time" {...register("startTime")} />
                    {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label htmlFor="event-endTime">Fim (opcional)</Label>
                    <Input id="event-endTime" type="time" {...register("endTime")} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Salvando..." : editingEvent ? "Salvar" : "Criar evento"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
          {weekOffset !== 0 && (
            <Button render={<Link href="/calendario" />} nativeButton={false} variant="outline" size="sm">
              Semana atual
            </Button>
          )}
          <Button
            render={<Link href={`/calendario?semana=${weekOffset - 1}`} />}
            nativeButton={false}
            variant="outline"
            size="icon-sm"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            render={<Link href={`/calendario?semana=${weekOffset + 1}`} />}
            nativeButton={false}
            variant="outline"
            size="icon-sm"
            aria-label="Próxima semana"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="ds-cols-7" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 12, alignItems: "start" }}>
          {days.map((d) => (
            <div
              key={d.label}
              style={{
                background: "var(--ds-surface)",
                border: `1px solid ${d.hoje ? "var(--ds-accent)" : "var(--ds-border)"}`,
                borderRadius: 14,
                boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                overflow: "hidden",
                minHeight: 260,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 8px 10px",
                  background: d.hoje ? "var(--ds-accent)" : "var(--ds-soft)",
                  color: d.hoje ? "#fff" : "var(--ds-muted)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.8 }}>
                  {d.label}
                </div>
                <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 22, marginTop: 2 }}>
                  {String(d.date.getDate()).padStart(2, "0")}
                </div>
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {d.events.map((e) => (
                  <div
                    key={e.id}
                    style={{ borderLeft: `3px solid ${categoryColor(e.category)}`, background: "var(--ds-soft)", borderRadius: 7, padding: "7px 9px" }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ds-muted)" }}>{formatTime(e.startsAt)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25, marginTop: 2, color: "var(--ds-text)" }}>{e.title}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
                      <QuietAction onClick={() => openEdit(e)}>Editar</QuietAction>
                      <QuietAction danger onClick={() => remove(e.id)}>
                        Apagar
                      </QuietAction>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
