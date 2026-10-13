import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { workspaceQuery } from "@/lib/queries";
import { dateLabel, meta, money, todayLuanda } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, NeedsBusiness, Panel, selectCls } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field } from "./produtos";

const categories = ["Renda", "Salários", "Transporte", "Energia e água", "Comunicações", "Impostos", "Manutenção", "Outros"];

export const Route = createFileRoute("/_authenticated/despesas")({
  head: () => meta("Despesas", "Regista e acompanha as despesas do teu negócio."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Expenses,
});

function Expenses() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const { act, busy } = useAction();
  const [open, setOpen] = useState(false);
  const b = data.business;
  const total = data.expenses.reduce((a, e) => a + Number(e.amount), 0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!b) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await act(
      { kind: "expense", b: b.id, category: String(f.get("category")), amount: Number(f.get("amount") || 0), date: String(f.get("date")), notes: String(f.get("notes") ?? ""), receipt: null },
      "Despesa registada.",
    );
    if (ok) { form.reset(); setOpen(false); }
  }

  return (
    <AppShell title="Despesas" actions={b && <Button onClick={() => setOpen(!open)}><Plus /> Nova despesa</Button>}>
      {!b ? <NeedsBusiness /> : (
        <div className="space-y-6">
          {open && (
            <Panel title="Nova despesa">
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Categoria</Label>
                  <select id="category" name="category" className={selectCls}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <Field label="Valor (Kz)" name="amount" type="number" required />
                <Field label="Data" name="date" type="date" required defaultValue={todayLuanda()} />
                <Field label="Notas (opcional)" name="notes" maxLength={1000} />
                <div className="flex gap-2 sm:col-span-2">
                  <Button disabled={busy}>{busy ? "A guardar…" : "Guardar despesa"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                </div>
              </form>
            </Panel>
          )}
          <div className="rounded-2xl bg-brand-gradient p-5 text-navy-foreground">
            <p className="text-sm opacity-80">Total de despesas</p>
            <p className="font-display text-2xl font-bold">{money(total)}</p>
          </div>
          <Panel title="Histórico">
            {data.expenses.length === 0 ? <Empty>Ainda não registaste despesas.</Empty> : (
              <ul className="divide-y">
                {data.expenses.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{x.category}</p>
                      <p className="truncate text-xs text-muted-foreground">{dateLabel(x.expense_date)}{x.notes && ` · ${x.notes}`}</p>
                    </div>
                    <span className="font-semibold">{money(Number(x.amount))}</span>
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
