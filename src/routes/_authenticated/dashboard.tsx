import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, Banknote, LogOut, Package, Receipt, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace, performAction } from "@/lib/kumbuflow.functions";
import { calculateSummary, dateLabel, meta, money } from "@/lib/kumbuflow";
import { Brand } from "@/components/kumbuflow/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const workspaceQuery = queryOptions({ queryKey: ["workspace"], queryFn: () => getWorkspace() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => meta("Painel", "Resumo diário das vendas, lucro, caixa, stock e dívidas do teu negócio."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const firstName = (data.profile?.display_name || "").split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut /> <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {data.business ? <Overview data={data} firstName={firstName ?? ""} /> : <Onboarding firstName={firstName ?? ""} />}
      </main>
    </div>
  );
}

function Onboarding({ firstName }: { firstName: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await performAction({
        data: { kind: "onboard", name: String(f.get("name") ?? "").trim(), sector: String(f.get("sector") ?? "Comércio"), phone: String(f.get("phone") ?? "") },
      });
      await qc.invalidateQueries({ queryKey: ["workspace"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o negócio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
      <span className="text-xs font-bold tracking-[0.18em] text-primary">PRIMEIRO PASSO</span>
      <h1 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">Olá{firstName ? `, ${firstName}` : ""}! Vamos registar o teu negócio.</h1>
      <p className="mt-2 text-muted-foreground">Começas com 7 dias grátis. Leva menos de um minuto.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bname">Nome do negócio</Label>
          <Input id="bname" name="name" required minLength={2} maxLength={100} placeholder="Ex.: Loja da Esperança" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sector">Sector</Label>
          <select id="sector" name="sector" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            {["Comércio", "Restauração", "Serviços", "Beleza", "Agricultura", "Outro"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input id="phone" name="phone" type="tel" maxLength={30} placeholder="+244 9XX XXX XXX" className="h-11" />
        </div>
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button size="lg" className="h-11 w-full" disabled={busy}>{busy ? "A criar…" : "Criar o meu negócio"}</Button>
      </form>
    </section>
  );
}

type Workspace = Awaited<ReturnType<typeof getWorkspace>>;

function Overview({ data, firstName }: { data: Workspace; firstName: string }) {
  const s = calculateSummary(
    data.sales.map((x) => ({ total: Number(x.total), paid: Number(x.paid), status: x.status })),
    data.expenses.map((x) => ({ amount: Number(x.amount) })),
    data.items.map((x) => ({ quantity: Number(x.quantity), unit_cost: Number(x.unit_cost) })),
    data.debts.map((x) => ({ amount: Number(x.amount), paid: Number(x.paid), cancelled: x.cancelled })),
    data.payments.map((x) => ({ amount: Number(x.amount) })),
    data.purchases.map((x) => ({ paid: Number(x.paid) })),
  );
  const sub = [...data.subscriptions].sort((a, b) => b.expires_at.localeCompare(a.expires_at))[0];
  const daysLeft = sub ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000) : 0;
  const lowStock = data.products.filter((p) => p.active && Number(p.stock) <= Number(p.min_stock));
  const recent = [...data.sales].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  const kpis = [
    { label: "Vendas", value: s.revenue, icon: TrendingUp, tone: "text-primary bg-primary/10" },
    { label: "Lucro", value: s.profit, icon: ArrowUpRight, tone: "text-success bg-success/10" },
    { label: "Caixa", value: s.cash, icon: Wallet, tone: "text-navy bg-secondary" },
    { label: "A receber", value: s.debt, icon: Banknote, tone: "text-warning bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{data.business?.name}</p>
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Olá{firstName ? `, ${firstName}` : ""} 👋</h1>
        </div>
        {sub && (
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${daysLeft > 3 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {daysLeft > 0 ? `${sub.is_trial ? "Ensaio grátis" : "Plano activo"} · ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} restantes` : "Subscrição expirada"}
          </span>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl bg-brand-gradient p-6 text-navy-foreground shadow-soft sm:p-8">
        <p className="text-sm opacity-80">Lucro total</p>
        <p className="mt-1 font-display text-3xl font-bold sm:text-4xl">{money(s.profit)}</p>
        <p className="mt-3 text-sm opacity-80">{data.sales.filter((x) => x.status === "confirmed").length} vendas confirmadas · {data.products.length} produtos</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <span className={`inline-flex size-9 items-center justify-center rounded-lg ${k.tone}`}><k.icon className="size-4.5" /></span>
            <p className="mt-3 text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-0.5 truncate font-display text-base font-bold text-navy sm:text-lg">{money(k.value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Nova venda", icon: ShoppingCart },
          { label: "Produtos", icon: Package },
          { label: "Despesas", icon: Receipt },
          { label: "Clientes", icon: Users },
        ].map((a) => (
          <div key={a.label} className="flex items-center gap-3 rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
            <a.icon className="size-5 text-primary" />
            <span className="font-medium text-foreground">{a.label}</span>
            <span className="ml-auto text-xs">Em breve</span>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display font-semibold text-navy">Vendas recentes</h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Ainda não registaste vendas.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    {dateLabel(r.created_at)} · {r.payment_method}
                    {r.status !== "confirmed" && <span className="ml-2 text-destructive">Anulada</span>}
                  </span>
                  <span className="font-semibold">{money(Number(r.total))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold text-navy"><AlertTriangle className="size-4 text-warning" /> Stock baixo</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum produto com stock baixo.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold text-warning">{Number(p.stock)} un.</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
