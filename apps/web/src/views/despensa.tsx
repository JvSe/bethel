"use client";

import { addPantryToShoppingAction, createPantryItemAction, deletePantryItemAction, updatePantryItemAction } from "@/app/(dashboard)/despensa/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { matchesQuery } from "@/lib/format";
import { createPantryItemSchema, updatePantryItemSchema, type CreatePantryItemInput, type UpdatePantryItemInput } from "@/server/validators/despensa";
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
import { Plus } from "reicon-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// Mirrors the Prisma `PantryLevel` enum. Duplicated here (instead of
// importing from @bethel/db) so this client component never pulls the
// Prisma/pg runtime into the browser bundle.
const PantryLevel = { OK: "OK", LOW: "LOW", OUT: "OUT" } as const;
type PantryLevel = (typeof PantryLevel)[keyof typeof PantryLevel];

const LEVEL_LABELS: Record<PantryLevel, string> = { OK: "OK", LOW: "Baixo", OUT: "Acabou" };
const LEVEL_STYLES: Record<PantryLevel, { bg: string; color: string }> = {
  OK: { bg: "#eaf1ec", color: "#4f8a6b" },
  LOW: { bg: "#f7efe0", color: "#b07d28" },
  OUT: { bg: "#f6e7df", color: "#b3522a" },
};

interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  level: PantryLevel;
  onShoppingList: boolean;
}

interface DespensaViewProps {
  items: PantryItem[];
}

export default function DespensaView({ items }: DespensaViewProps) {
  const { searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const visibleItems = useMemo(
    () => items.filter((item) => matchesQuery(searchQuery, item.name, item.category, item.quantity)),
    [items, searchQuery],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePantryItemInput>({
    resolver: zodResolver(createPantryItemSchema),
    defaultValues: { name: "", quantity: "", category: "", level: PantryLevel.OK },
  });

  const editForm = useForm<UpdatePantryItemInput>({
    resolver: zodResolver(updatePantryItemSchema),
    defaultValues: { quantity: "", level: PantryLevel.OK },
  });

  async function onSubmit(data: CreatePantryItemInput) {
    const result = await createPantryItemAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Item adicionado à despensa.");
    reset();
    setOpen(false);
  }

  async function addToShopping(item: PantryItem) {
    setPendingId(item.id);
    const result = await addPantryToShoppingAction(item.id);
    setPendingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Adicionado à lista de compras.");
  }

  function openEdit(item: PantryItem) {
    setEditing(item);
    editForm.reset({ quantity: item.quantity, level: item.level });
  }

  async function onEdit(data: UpdatePantryItemInput) {
    if (!editing) return;
    const result = await updatePantryItemAction(editing.id, data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Item atualizado.");
    setEditing(null);
  }

  async function remove(item: PantryItem) {
    setPendingId(item.id);
    const result = await deletePantryItemAction(item.id);
    setPendingId(null);
    if (!result.success) toast.error(result.error);
  }

  const restockCount = items.filter((i) => i.level !== PantryLevel.OK).length;

  return (
    <>
      <TopBar
        title="Despensa"
        subtitle={restockCount === 0 ? "Despensa em dia" : `${restockCount} ${restockCount === 1 ? "item" : "itens"} para repor`}
        action={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) reset();
            }}
          >
            <DialogTrigger render={<Button className="gap-2 shadow-sm" />}>
              <Plus className="size-4" />
              Adicionar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo item</DialogTitle>
                <DialogDescription>Adicione um item à despensa.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pantry-name">Nome</Label>
                  <Input id="pantry-name" placeholder="Arroz" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pantry-quantity">Quantidade</Label>
                  <Input id="pantry-quantity" placeholder="5 kg" {...register("quantity")} />
                  {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pantry-category">Categoria</Label>
                  <Input id="pantry-category" placeholder="Grãos" {...register("category")} />
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pantry-level">Nível</Label>
                  <Controller
                    control={control}
                    name="level"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="pantry-level" className="w-full">
                          <SelectValue placeholder="Nível">
                            {(value: string) => LEVEL_LABELS[value as PantryLevel]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(LEVEL_LABELS) as PantryLevel[]).map((level) => (
                            <SelectItem key={level} value={level}>
                              {LEVEL_LABELS[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Adicionando..." : "Adicionar item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        {visibleItems.length === 0 ? (
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
            Nenhum item na despensa ainda. Use Adicionar para cadastrar o que tem em casa.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
            {visibleItems.map((d) => {
              const s = LEVEL_STYLES[d.level];
              const needsRestock = d.level !== PantryLevel.OK;
              return (
                <div
                  key={d.id}
                  style={{
                    background: "var(--ds-surface)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: 14,
                    boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                    padding: "17px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ds-text)" }}>{d.name}</div>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, marginTop: 5, flexShrink: 0 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ds-muted)", fontWeight: 600, marginTop: 2 }}>{d.category}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                      <span style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 18, whiteSpace: "nowrap", color: "var(--ds-text)" }}>
                        {d.quantity}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
                        {LEVEL_LABELS[d.level]}
                      </span>
                    </div>
                  </div>
                  {needsRestock && (
                    <button
                      type="button"
                      disabled={d.onShoppingList || pendingId === d.id}
                      onClick={() => addToShopping(d)}
                      style={{
                        width: "100%",
                        marginTop: "auto",
                        border: "1px solid var(--ds-border)",
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 12.5,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        background: d.onShoppingList ? "var(--ds-soft)" : "var(--ds-accent-soft)",
                        color: d.onShoppingList ? "var(--ds-muted)" : "var(--ds-accent)",
                        cursor: d.onShoppingList || pendingId === d.id ? "default" : "pointer",
                        opacity: pendingId === d.id ? 0.6 : 1,
                      }}
                    >
                      {d.onShoppingList ? "Já na lista" : pendingId === d.id ? "Adicionando..." : "Adicionar à lista"}
                    </button>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <QuietAction onClick={() => openEdit(d)}>Editar</QuietAction>
                    <QuietAction danger disabled={pendingId === d.id} onClick={() => remove(d)}>
                      Apagar
                    </QuietAction>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={!!editing} onOpenChange={(next) => { if (!next) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar {editing?.name}</DialogTitle>
            <DialogDescription>Atualize a quantidade e o nível na despensa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-quantity">Quantidade</Label>
              <Input id="edit-quantity" {...editForm.register("quantity")} />
              {editForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">{editForm.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-level">Nível</Label>
              <Controller
                control={editForm.control}
                name="level"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-level" className="w-full">
                      <SelectValue placeholder="Nível">
                        {(value: string) => LEVEL_LABELS[value as PantryLevel]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LEVEL_LABELS) as PantryLevel[]).map((level) => (
                        <SelectItem key={level} value={level}>
                          {LEVEL_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editForm.formState.isSubmitting} className="w-full">
                {editForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
