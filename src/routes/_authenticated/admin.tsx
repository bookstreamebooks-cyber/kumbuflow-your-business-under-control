import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { adminQuery, workspaceQuery } from "@/lib/queries";
import { dateLabel, meta, money } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, Panel } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => meta("Administração", "Painel de administração do KumbuFlow."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Admin,
});

function Admin() {
  const { data: ws } = useSuspenseQuery(workspaceQuery);
  const admin = useQuery({ ...adminQuery, enabled: ws.isAdmin });
  const { act, busy } = useAction();

  if (!ws.isAdmin) return <AppShell title="Administração"><Empty>Acesso reservado ao administrador.</Empty></AppShell>;
  if (admin.isLoading || !admin.data) return <AppShell title="Administração"><Empty>{admin.error ? admin.error.message : "A carregar…"}</Empty></AppShell>;
  const d = admin.data;
  const name = (id: string) => d.businesses.find((b) => b.id === id)?.name ?? "—";
  const pending = d.requests.filter((r) => r.status === "pending");

  async function review(id: string, approve: boolean) {
    const note = window.prompt(approve ? "Nota (confirmaste o pagamento no banco?)" : "Motivo da rejeição", approve ? "Pagamento confirmado no extracto bancário" : "");
    if (!note) return;
    await act({ kind: "review", id, approve, note, verified: approve }, approve ? "Pagamento aprovado." : "Pagamento rejeitado.");
  }

  return (
    <AppShell title="Administração">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[["Negócios", d.businesses.length], ["Pagamentos pendentes", pending.length], ["Vendas totais", d.sales.filter((s) => s.status === "confirmed").length]].map(([l, v]) => (
            <div key={l} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-2xl font-bold text-navy">{v}</p></div>
          ))}
        </div>
        <Panel title="Pagamentos pendentes">
          {pending.length === 0 ? <Empty>Sem pedidos pendentes.</Empty> : (
            <ul className="divide-y">{pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div><p className="font-medium">{name(r.business_id)} · {d.plans.find((p) => p.id === r.plan_id)?.name}</p><p className="text-xs text-muted-foreground">Ref. {r.reference} · {dateLabel(r.created_at)}</p></div>
                <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => review(r.id, true)}>Aprovar</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => review(r.id, false)}>Rejeitar</Button></div>
              </li>))}</ul>
          )}
        </Panel>
        <Panel title="Negócios">
          {d.businesses.length === 0 ? <Empty>Sem negócios.</Empty> : (
            <ul className="divide-y">{d.businesses.map((b) => {
              const sub = d.subscriptions.find((s) => s.business_id === b.id);
              const active = sub && new Date(sub.expires_at) > new Date();
              return <li key={b.id} className="flex items-center justify-between py-3 text-sm"><div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.sector} · desde {dateLabel(b.created_at)}</p></div><span className={`text-xs font-semibold ${active ? "text-success" : "text-destructive"}`}>{sub ? `${active ? "Activo" : "Expirado"} até ${dateLabel(sub.expires_at)}` : "Sem plano"}</span></li>;
            })}</ul>
          )}
        </Panel>
        <Panel title="Planos">
          <ul className="divide-y">{d.plans.map((p) => <li key={p.id} className="flex justify-between py-2.5 text-sm"><span>{p.name} · {p.duration_days} dias</span><span className="font-semibold">{money(Number(p.price))}</span></li>)}</ul>
        </Panel>
      </div>
    </AppShell>
  );
}
