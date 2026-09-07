"use client";

import { clearCheckedShoppingItemsAction, createShoppingItemAction, deleteShoppingItemAction, toggleShoppingItemAction } from "@/app/(dashboard)/compras/actions";
import TopBar from "@/components/top-bar";
import { QuietAction } from "@/components/quiet-action";
import { useDashboard } from "@/contexts/dashboard-context";
import { formatCurrency, matchesQuery } from "@/lib/format";
import { createShoppingItemSchema, type CreateShoppingItemInput } from "@/server/validators/compras";
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
import { Check, Plus } from "reicon-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  estimatedPrice: number | null;
}

interface ComprasViewProps {
  items: ShoppingItem[];
}

export default function ComprasView({ items }: ComprasViewProps) {
  const { maskValue, searchQuery } = useDashboard();
  const [open, setOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [shoppingMode, setShoppingMode] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateShoppingItemInput>({
    resolver: zodResolver(createShoppingItemSchema),
    defaultValues: { name: "", quantity: "", category: "", estimatedPrice: undefined },
  });

  async function onSubmit(data: CreateShoppingItemInput) {
    const result = await createShoppingItemAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Item adicionado.");
    reset();
    setOpen(false);
  }

  async function toggle(item: ShoppingItem) {
    setPendingItemId(item.id);
    const result = await toggleShoppingItemAction(item.id, !item.checked);
    setPendingItemId(null);
    if (!result.success) toast.error(result.error);
  }

  async function remove(item: ShoppingItem) {
    setPendingItemId(item.id);
    const result = await deleteShoppingItemAction(item.id);
    setPendingItemId(null);
    if (!result.success) toast.error(result.error);
  }

  async function finishShopping() {
    if (checkedCount > 0) {
      const result = await clearCheckedShoppingItemsAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Itens do carrinho saíram da lista.");
    }
    setShoppingMode(false);
  }

  async function clearChecked() {
    const result = await clearCheckedShoppingItemsAction();
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Itens marcados removidos.");
  }

  const queriedItems = useMemo(
    () => items.filter((item) => matchesQuery(searchQuery, item.name, item.category, item.quantity)),
    [items, searchQuery],
  );

  const remainingCount = items.filter((item) => !item.checked).length;
  const remainingItems = queriedItems.filter((item) => !item.checked);
  const displayItems = shoppingMode ? remainingItems : queriedItems;

  const groups = useMemo(() => {
    const byCategory = new Map<string, ShoppingItem[]>();
    for (const item of displayItems) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return Array.from(byCategory.entries()).map(([category, categoryItems]) => ({ category, items: categoryItems }));
  }, [displayItems]);

  const checkedCount = items.filter((i) => i.checked).length;
  const categoryCount = groups.length;
  const estimatedTotal = items.reduce((sum, i) => sum + (i.estimatedPrice ?? 0), 0);

  return (
    <>
      <TopBar
        title="Lista de compras"
        subtitle={
          shoppingMode
            ? `${remainingCount} ${remainingCount === 1 ? "item restante" : "itens restantes"} · modo compra`
            : `${items.length} ${items.length === 1 ? "item" : "itens"} · ${categoryCount} ${categoryCount === 1 ? "categoria" : "categorias"}`
        }
        action={
          shoppingMode ? undefined : (
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
                <DialogDescription>Adicione um item à lista de compras.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-name">Nome</Label>
                  <Input id="item-name" placeholder="Banana prata" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-quantity">Quantidade</Label>
                  <Input id="item-quantity" placeholder="1 cacho" {...register("quantity")} />
                  {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-category">Categoria</Label>
                  <Input id="item-category" placeholder="Hortifrúti" {...register("category")} />
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-price">Preço estimado (opcional)</Label>
                  <Input id="item-price" type="number" step="0.01" min="0" {...register("estimatedPrice")} />
                  {errors.estimatedPrice && <p className="text-sm text-destructive">{errors.estimatedPrice.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Adicionando..." : "Adicionar item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          )
        }
      />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {groups.length === 0 && (
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
                {shoppingMode ? "Tudo no carrinho." : "Nenhum item na lista ainda. Use Adicionar para começar."}
              </div>
            )}
            {groups.map((g) => (
              <div
                key={g.category}
                style={{
                  background: "var(--ds-surface)",
                  border: "1px solid var(--ds-border)",
                  borderRadius: 16,
                  boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                  padding: "18px 22px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ds-muted)" }}>
                    {g.category}
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--ds-muted)", fontWeight: 600 }}>
                    {g.items.length} {g.items.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                {g.items.map((item) => {
                  const done = item.checked;
                  return (
                    <div
                      key={item.id}
                      style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 0", borderBottom: "1px solid var(--ds-soft)", opacity: pendingItemId === item.id ? 0.6 : 1 }}
                    >
                      <div
                        onClick={() => toggle(item)}
                        style={{
                          width: 21, height: 21, flexShrink: 0, borderRadius: 7,
                          border: `1.6px solid ${done ? "var(--ds-accent)" : "var(--ds-border)"}`,
                          background: done ? "var(--ds-accent)" : "var(--ds-surface)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {done && (
                          <Check size={13} color="#fff" />
                        )}
                      </div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: done ? "var(--ds-muted)" : "var(--ds-text)", textDecoration: done ? "line-through" : "none" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ds-muted)", fontWeight: 600 }}>{item.quantity}</div>
                      {!shoppingMode && (
                        <QuietAction danger disabled={pendingItemId === item.id} onClick={() => remove(item)}>
                          Apagar
                        </QuietAction>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Summary sticky */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 96 }}>
            <div
              style={{
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                padding: 22,
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Resumo da compra</h3>
              {[
                { label: "Itens na lista", val: String(items.length) },
                { label: "Já no carrinho", val: String(checkedCount) },
                { label: "Categorias", val: String(categoryCount) },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "9px 0", borderBottom: "1px solid var(--ds-hover)" }}>
                  <span style={{ color: "var(--ds-muted)" }}>{row.label}</span>
                  <b style={{ color: "var(--ds-text)" }}>{row.val}</b>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ds-text)" }}>Estimativa</span>
                <span style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 700, fontSize: 24, color: "var(--ds-accent)" }}>
                  {maskValue(formatCurrency(estimatedTotal))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (shoppingMode) {
                    void finishShopping();
                    return;
                  }
                  setShoppingMode(true);
                }}
                disabled={!shoppingMode && remainingCount === 0}
                style={{
                  marginTop: 16,
                  width: "100%",
                  background: "var(--ds-accent)",
                  color: "#fff",
                  textAlign: "center",
                  borderRadius: 11,
                  padding: 12,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: !shoppingMode && remainingCount === 0 ? "not-allowed" : "pointer",
                  border: "none",
                  fontFamily: "inherit",
                  opacity: !shoppingMode && remainingCount === 0 ? 0.55 : 1,
                }}
              >
                {shoppingMode ? "Finalizar compra" : "Iniciar compra"}
              </button>
              {!shoppingMode && checkedCount > 0 && (
                <button
                  type="button"
                  onClick={() => void clearChecked()}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    background: "transparent",
                    color: "var(--ds-muted)",
                    textAlign: "center",
                    borderRadius: 11,
                    padding: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid var(--ds-border)",
                    fontFamily: "inherit",
                  }}
                >
                  Limpar marcados
                </button>
              )}
            </div>
            <div
              style={{
                background: "var(--ds-accent-soft)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                padding: "18px 20px",
                fontSize: 13,
                color: "var(--ds-muted)",
                lineHeight: 1.5,
              }}
            >
              <b style={{ color: "var(--ds-accent)" }}>Dica:</b>{" "}
              itens Baixo ou Acabou na despensa têm o botão &ldquo;Adicionar à lista&rdquo;.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
