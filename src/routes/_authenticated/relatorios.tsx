import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { adminQuery, workspaceQuery } from "@/lib/queries";
import { dateLabel, meta, money, todayLuanda } from "@/lib/kumbuflow";
import { buildCsv, luandaDay } from "@/lib/csv";
import { AppShell, Empty, Panel, selectCls } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => meta("Relatórios", "Exporta vendas e despesas para Excel (CSV) por período."),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(workspaceQuery); },
  component: Reports,
});

type Sale = { business_id: string; created_at: string; total: number; paid: number; discount?: number; method?: string; status: string; customer_id?: string | null };
type Expense = { business_id: string; expense_date: string; amount: number; category: string; notes?: string | null };

function download(csv: string, name: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function Reports() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const admin = useQuery({ ...adminQuery, enabled: data.isAdmin });
  const today = todayLuanda();
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const [biz, setBiz] = useState<string>(data.business?.id ?? "all");

  const businesses = data.isAdmin && admin.data ? admin.data.businesses : data.business ? [data.business] : [];
  const names = new Map(businesses.map((b) => [b.id, b.name]));
  const customers = new Map(data.customers.map((c) => [c.id, c.name]));
  const allSales = (data.isAdmin && admin.data ? admin.data.sales : data.sales) as Sale[];
  const allExpenses = (data.isAdmin && admin.data ? admin.data.expenses : data.expenses) as Expense[];

  const { sales, expenses } = useMemo(() => {
    const inBiz = (id: string) => biz === "all" || id === biz;
    return {
      sales: allSales.filter((s) => inBiz(s.business_id) && luandaDay(s.created_at) >= from && luandaDay(s.created_at) <= to),
      expenses: allExpenses.filter((e) => inBiz(e.business_id) && e.expense_date >= from && e.expense_date <= to),
    };
  }, [allSales, allExpenses, biz, from, to]);

  const confirmed = sales.filter((s) => s.status === "confirmed");
  const totalSales = confirmed.reduce((a, s) => a + Number(s.total), 0);
  const totalExp = expenses.reduce((a, e) => a + Number(e.amount), 0);
  const suffix = `${from}_${to}`;

  function exportSales() {
    download(buildCsv(["Data", "Negócio", "Cliente", "Método", "Total (Kz)", "Pago (Kz)", "Estado"], sales.map((s) => [dateLabel(s.created_at), names.get(s.business_id) ?? "", s.customer_id ? customers.get(s.customer_id) ?? "" : "", s.method ?? "", Number(s.total), Number(s.paid), s.status === "confirmed" ? "Confirmada" : "Anulada"])), `vendas_${suffix}.csv`);
  }
  function exportExpenses() {
    download(buildCsv(["Data", "Negócio", "Categoria", "Valor (Kz)", "Notas"], expenses.map((e) => [dateLabel(e.expense_date), names.get(e.business_id) ?? "", e.category, Number(e.amount), e.notes ?? ""])), `despesas_${suffix}.csv`);
  }

  return (
    <AppShell title="Relatórios">
      <div className="space-y-6">
        <Panel title="Filtros">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="from">De</Label><Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="to">Até</Label><Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="biz">Negócio</Label>
              <select id="biz" className={selectCls} value={biz} onChange={(e) => setBiz(e.target.value)} disabled={businesses.length <= 1 && !data.isAdmin}>
                {data.isAdmin && <option value="all">Todos os negócios</option>}
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        </Panel>
        {businesses.length === 0 ? <Empty>Cria o teu negócio para ver relatórios.</Empty> : (
          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="Vendas">
              <p className="text-sm text-muted-foreground">{sales.length} vendas · confirmadas</p>
              <p className="font-display text-2xl font-bold text-navy">{money(totalSales)}</p>
              <Button className="mt-4" onClick={exportSales} disabled={sales.length === 0}><Download /> Exportar vendas (CSV)</Button>
            </Panel>
            <Panel title="Despesas">
              <p className="text-sm text-muted-foreground">{expenses.length} despesas</p>
              <p className="font-display text-2xl font-bold text-navy">{money(totalExp)}</p>
              <Button className="mt-4" onClick={exportExpenses} disabled={expenses.length === 0}><Download /> Exportar despesas (CSV)</Button>
            </Panel>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Lucro bruto do período (vendas − despesas): <strong>{money(totalSales - totalExp)}</strong>. Os ficheiros abrem directamente no Excel.</p>
      </div>
    </AppShell>
  );
}
