import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { workspaceQuery } from "@/lib/queries";
import { dateLabel, meta, money, todayLuanda } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, NeedsBusiness, Panel, selectCls } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const methods = ["Dinheiro", "Transferência", "TPA", "Crédito"] as const;
type Method = (typeof methods)[number];

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => meta("Vendas", "Regista novas vendas e consulta o histórico de vendas."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Sales,
});

function Sales() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const { act, busy } = useAction();
  const b = data.business;
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<Method>("Dinheiro");
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState("");
  const [paid, setPaid] = useState("");
  const [due, setDue] = useState(todayLuanda());
  const [request, setRequest] = useState(() => crypto.randomUUID());

  const available = data.products.filter((p) => p.active);
  const lines = Object.entries(cart).map(([id, qty]) => ({ p: data.products.find((x) => x.id === id)!, qty })).filter((l) => l.p);
  const subtotal = lines.reduce((a, l) => a + l.qty * Number(l.p.price), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const credit = method === "Crédito";
  const paidValue = credit ? Number(paid || 0) : total;

  const setQty = (id: string, qty: number) => {
    const stock = Number(data.products.find((p) => p.id === id)?.stock ?? 0);
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[id];
      else n[id] = Math.min(qty, stock);
      return n;
    });
  };

  async function confirm() {
    if (!b || lines.length === 0) return;
    const ok = await act(
      { kind: "sale", b: b.id, customer: customer || null, items: lines.map((l) => ({ product_id: l.p.id, quantity: l.qty })), discount: Number(discount || 0), paid: paidValue, method, due, request },
      "Venda registada.",
    );
    if (ok) {
      setCart({}); setDiscount(""); setPaid(""); setCustomer(""); setMethod("Dinheiro");
      setRequest(crypto.randomUUID());
    }
  }

  async function reverse(id: string) {
    if (!b) return;
    const reason = window.prompt("Motivo da anulação (mínimo 5 caracteres)");
    if (!reason) return;
    await act({ kind: "reverse", b: b.id, id, reason }, "Venda anulada e stock reposto.");
  }

  async function correct(id: string) {
    if (!b) return;
    const sale = data.sales.find((x) => x.id === id);
    if (!sale || !window.confirm("Corrigir esta venda? A venda original é anulada (o stock é reposto) e os produtos voltam ao carrinho para registares de novo.")) return;
    const ok = await act({ kind: "reverse", b: b.id, id, reason: "Correcção da venda pelo utilizador" }, "Venda anulada. Corrige e confirma de novo.");
    if (!ok) return;
    const next: Record<string, number> = {};
    for (const i of data.items.filter((x) => x.sale_id === id)) next[i.product_id] = (next[i.product_id] ?? 0) + Number(i.quantity);
    setCart(next); setCustomer(sale.customer_id ?? ""); setDiscount(Number(sale.discount) ? String(sale.discount) : "");
    if ((methods as readonly string[]).includes(sale.payment_method)) setMethod(sale.payment_method as Method);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AppShell title="Vendas">
      {!b ? <NeedsBusiness /> : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <Panel title="Escolhe os produtos">
              {available.length === 0 ? (
                <Empty>Adiciona produtos primeiro. <Link to="/produtos" className="font-semibold text-primary">Ir para produtos</Link></Empty>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {available.map((p) => {
                    const out = Number(p.stock) <= 0;
                    return (
                      <button key={p.id} type="button" disabled={out} onClick={() => setQty(p.id, (cart[p.id] ?? 0) + 1)} className="flex items-center justify-between rounded-xl border p-3 text-left transition hover:border-primary disabled:opacity-50">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{out ? "Sem stock" : `${Number(p.stock)} disponíveis`}</span>
                        </span>
                        <span className="text-sm font-semibold text-primary">{money(Number(p.price))}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel title="Nova venda">
              {lines.length === 0 ? <Empty>Toca num produto para adicionar.</Empty> : (
                <ul className="mb-4 divide-y">
                  {lines.map((l) => (
                    <li key={l.p.id} className="flex items-center gap-2 py-2 text-sm">
                      <span className="flex-1 truncate">{l.p.name}</span>
                      <Button size="icon" variant="outline" className="size-7" onClick={() => setQty(l.p.id, l.qty - 1)} aria-label="Menos"><Minus /></Button>
                      <span className="w-6 text-center">{l.qty}</span>
                      <Button size="icon" variant="outline" className="size-7" onClick={() => setQty(l.p.id, l.qty + 1)} aria-label="Mais"><Plus /></Button>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => setQty(l.p.id, 0)} aria-label="Remover"><Trash2 /></Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="method">Pagamento</Label>
                  <select id="method" className={selectCls} value={method} onChange={(e) => setMethod(e.target.value as Method)}>{methods.map((m) => <option key={m}>{m === "Crédito" ? "Crédito (fiado)" : m}</option>)}</select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer">Cliente {credit ? "(obrigatório)" : "(opcional)"}</Label>
                  <select id="customer" className={selectCls} value={customer} onChange={(e) => setCustomer(e.target.value)}>
                    <option value="">— Sem cliente —</option>
                    {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discount">Desconto (Kz)</Label>
                  <Input id="discount" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                {credit && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="paid">Pago agora (Kz)</Label>
                      <Input id="paid" type="number" min={0} value={paid} onChange={(e) => setPaid(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="due">Vence a</Label>
                      <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-xl font-bold text-navy">{money(total)}</span>
                </div>
                <Button className="h-11 w-full" disabled={busy || lines.length === 0 || (credit && !customer)} onClick={confirm}>
                  {busy ? "A registar…" : "Confirmar venda"}
                </Button>
              </div>
            </Panel>
          </div>

          <Panel title="Histórico de vendas">
            {data.sales.length === 0 ? <Empty>Ainda não há vendas.</Empty> : (
              <ul className="divide-y">
                {data.sales.slice(0, 50).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{money(Number(s.total))} · {s.payment_method}</p>
                      <p className="text-xs text-muted-foreground">{dateLabel(s.created_at)}{s.customer_id && ` · ${data.customers.find((c) => c.id === s.customer_id)?.name ?? ""}`}</p>
                    </div>
                    {s.status === "confirmed" ? (
                      <div className="flex gap-1"><Button size="sm" variant="outline" disabled={busy} onClick={() => correct(s.id)}>Corrigir</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => reverse(s.id)}>Anular</Button></div>
                    ) : <span className="text-xs font-semibold text-destructive">Anulada</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
