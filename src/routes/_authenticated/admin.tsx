import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminQuery, workspaceQuery } from "@/lib/queries";
import { receiptUrl } from "@/lib/kumbuflow.functions";
import { dateLabel, meta, money } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, Panel } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Field } from "./produtos";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => meta("Administração", "Painel de administração do KumbuFlow."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Admin,
});

const statusLabel: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };

function Admin() {
  const { data: ws } = useSuspenseQuery(workspaceQuery);
  const admin = useQuery({ ...adminQuery, enabled: ws.isAdmin });
  const { act, busy } = useAction();
  const openReceipt = useServerFn(receiptUrl);
  const [selected, setSelected] = useState<string | null>(null);

  if (!ws.isAdmin) return <AppShell title="Administração"><Empty>Acesso reservado ao administrador.</Empty></AppShell>;
  if (admin.isLoading || !admin.data) return <AppShell title="Administração"><Empty>{admin.error ? admin.error.message : "A carregar…"}</Empty></AppShell>;
  const d = admin.data;
  const name = (id: string | null) => d.businesses.find((b) => b.id === id)?.name ?? "—";
  const pending = d.requests.filter((r) => r.status === "pending");
  const confirmed = d.sales.filter((s) => s.status === "confirmed");

  async function review(id: string, approve: boolean) {
    if (approve && !window.confirm("Confirmas que verificaste esta transferência no teu extracto bancário?")) return;
    const note = window.prompt(approve ? "Nota da aprovação" : "Motivo da rejeição (mínimo 5 caracteres)", approve ? "Pagamento confirmado no extracto bancário" : "");
    if (!note) return;
    await act({ kind: "review", id, approve, note, verified: approve }, approve ? "Pagamento aprovado e assinatura activada." : "Pagamento rejeitado.");
  }

  async function viewReceipt(path: string) {
    try { window.open(await openReceipt({ data: { path } }), "_blank", "noopener"); }
    catch { toast.error("Sem acesso ao comprovativo."); }
  }

  async function saveBank(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await act({ kind: "bank", bank: String(f.get("bank")).trim(), holder: String(f.get("holder")).trim(), iban: String(f.get("iban")).trim() }, "Dados bancários guardados.");
  }

  async function savePlan(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await act({ kind: "plan", id, name: String(f.get("name")).trim(), price: Number(f.get("price")), days: Number(f.get("days")), enabled: f.get("enabled") === "on" }, "Plano actualizado.");
  }

  const sel = d.businesses.find((b) => b.id === selected);
  const of = <T extends { business_id: string }>(rows: T[]) => rows.filter((r) => r.business_id === selected);

  return (
    <AppShell title="Administração">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["Negócios", d.businesses.length], ["Pagamentos pendentes", pending.length], ["Vendas registadas", confirmed.length], ["Volume de vendas", money(confirmed.reduce((a, s) => a + Number(s.total), 0))]] as const).map(([l, v]) => (
            <div key={l} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-xl font-bold text-navy">{v}</p></div>
          ))}
        </div>

        <Panel title="Pagamentos a verificar">
          {pending.length === 0 ? <Empty>Sem pedidos pendentes.</Empty> : (
            <ul className="divide-y">{pending.map((r) => {
              const plan = d.plans.find((p) => p.id === r.plan_id);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div><p className="font-medium">{name(r.business_id)} · {plan?.name} · {money(Number(plan?.price ?? 0))}</p><p className="text-xs text-muted-foreground">Ref. {r.reference} · {dateLabel(r.created_at)}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {r.receipt_path && <Button size="sm" variant="ghost" onClick={() => viewReceipt(r.receipt_path!)}>Ver comprovativo</Button>}
                    <Button size="sm" disabled={busy} onClick={() => review(r.id, true)}>Aprovar</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => review(r.id, false)}>Rejeitar</Button>
                  </div>
                </li>
              );
            })}</ul>
          )}
        </Panel>

        <Panel title="Negócios e assinaturas">
          {d.businesses.length === 0 ? <Empty>Sem negócios.</Empty> : (
            <ul className="divide-y">{d.businesses.map((b) => {
              const sub = d.subscriptions.find((s) => s.business_id === b.id);
              const active = sub && new Date(sub.expires_at) > new Date();
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.sector}{b.phone ? ` · ${b.phone}` : ""} · desde {dateLabel(b.created_at)}</p></div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${active ? "text-success" : "text-destructive"}`}>{sub ? `${active ? (sub.is_trial ? "Ensaio" : "Activo") : "Expirado"} até ${dateLabel(sub.expires_at)}` : "Sem plano"}</span>
                    <Button size="sm" variant="outline" onClick={() => setSelected(selected === b.id ? null : b.id)}>{selected === b.id ? "Fechar" : "Ver dados"}</Button>
                  </div>
                </li>
              );
            })}</ul>
          )}
        </Panel>

        {sel && (
          <Panel title={`Dados de ${sel.name}`}>
            {(() => {
              const sales = of(d.sales).filter((s) => s.status === "confirmed");
              const expenses = of(d.expenses);
              const debt = of(d.debts).filter((r) => !r.cancelled).reduce((a, r) => a + Number(r.amount) - Number(r.paid), 0);
              return (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div><p className="text-xs text-muted-foreground">Vendas</p><p className="font-semibold">{money(sales.reduce((a, s) => a + Number(s.total), 0))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Despesas</p><p className="font-semibold">{money(expenses.reduce((a, e) => a + Number(e.amount), 0))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Dívidas a receber</p><p className="font-semibold">{money(debt)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Produtos / Clientes</p><p className="font-semibold">{of(d.products).filter((p) => p.active).length} / {of(d.customers).length}</p></div>
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Últimas vendas</p>
                    {sales.length === 0 ? <p className="text-muted-foreground">Sem vendas.</p> : <ul className="divide-y">{sales.slice(0, 10).map((s) => <li key={s.id} className="flex justify-between py-1.5"><span>{dateLabel(s.created_at)} · {s.payment_method}</span><span className="font-medium">{money(Number(s.total))}</span></li>)}</ul>}
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Pagamentos de assinatura</p>
                    {of(d.requests).length === 0 ? <p className="text-muted-foreground">Sem pedidos.</p> : <ul className="divide-y">{of(d.requests).map((r) => <li key={r.id} className="flex justify-between py-1.5"><span>{dateLabel(r.created_at)} · Ref. {r.reference}</span><span>{statusLabel[r.status] ?? r.status}</span></li>)}</ul>}
                  </div>
                </div>
              );
            })()}
          </Panel>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Dados bancários para transferência">
            <form onSubmit={saveBank} className="grid gap-3">
              <Field label="Banco" name="bank" required maxLength={100} defaultValue={d.bank?.bank_name} />
              <Field label="Titular da conta" name="holder" required maxLength={150} defaultValue={d.bank?.account_holder} />
              <Field label="IBAN" name="iban" required maxLength={100} defaultValue={d.bank?.iban} />
              <Button disabled={busy}>Guardar dados bancários</Button>
            </form>
          </Panel>
          <Panel title="Planos">
            <div className="space-y-4">{d.plans.map((p) => (
              <form key={p.id} onSubmit={(e) => savePlan(e, p.id)} className="grid grid-cols-2 gap-3 rounded-xl border p-3">
                <Field label="Nome" name="name" required defaultValue={p.name} />
                <Field label="Preço (Kz)" name="price" type="number" required defaultValue={String(p.price)} />
                <Field label="Dias" name="days" type="number" required defaultValue={String(p.duration_days)} />
                <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={p.enabled} /> Disponível</label>
                <Button size="sm" disabled={busy} className="col-span-2">Guardar plano</Button>
              </form>
            ))}</div>
          </Panel>
        </div>

        <Panel title="Histórico de pagamentos">
          {d.requests.length === 0 ? <Empty>Sem pedidos.</Empty> : (
            <ul className="divide-y">{d.requests.filter((r) => r.status !== "pending").map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div><p className="font-medium">{name(r.business_id)} · Ref. {r.reference}</p><p className="text-xs text-muted-foreground">{dateLabel(r.created_at)}{r.review_note ? ` · ${r.review_note}` : ""}</p></div>
                <span className={`text-xs font-semibold ${r.status === "approved" ? "text-success" : "text-destructive"}`}>{statusLabel[r.status]}</span>
              </li>))}</ul>
          )}
        </Panel>

        <Panel title="Registo de auditoria (últimos 50)">
          {d.audit.length === 0 ? <Empty>Sem eventos.</Empty> : (
            <ul className="divide-y">{d.audit.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2 text-xs"><span className="font-mono">{a.event}</span><span className="text-muted-foreground">{name(a.business_id)} · {dateLabel(a.created_at)}</span></li>
            ))}</ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
