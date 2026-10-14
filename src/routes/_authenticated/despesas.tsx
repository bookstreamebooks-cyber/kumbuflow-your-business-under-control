import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  const [editId, setEditId] = useState<string | null>(null);
  const b = data.business;
  const editing = data.expenses.find((x) => x.id === editId) ?? null;
  const total = data.expenses.reduce((a, e) => a + Number(e.amount), 0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!b) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const fields = { b: b.id, category: String(f.get("category")), amount: Number(f.get("amount") || 0), date: String(f.get("date")), notes: String(f.get("notes") ?? "") };
    const ok = editing
      ? await act({ kind: "expenseEdit", id: editing.id, ...fields }, "Despesa actualizada.")
      : await act({ kind: "expense", ...fields, receipt: null }, "Despesa registada.");
    if (ok) { form.reset(); setOpen(false); setEditId(null); }
  }

  async function remove(id: string) {
    if (!b || !window.confirm("Remover esta despesa? A remoção fica registada no histórico de auditoria.")) return;
    await act({ kind: "expenseRemove", b: b.id, id }, "Despesa removida.");
  }
  function close() { setOpen(false); setEditId(null); }

  return (
    <AppShell title="Despesas" actions={b && <Button onClick={() => { setEditId(null); setOpen(!open); }}><Plus /> Nova despesa</Button>}>
      {!b ? <NeedsBusiness /> : (
        <div className="space-y-6">
          {open && (
            <Panel title={editing ? "Editar despesa" : "Nova despesa"}>
              <form key={editing?.id ?? "new"} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Categoria</Label>
                  <select id="category" name="category" className={selectCls} defaultValue={editing?.category}>{(editing && !categories.includes(editing.category) ? [...categories, editing.category] : categories).map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <Field label="Valor (Kz)" name="amount" type="number" required defaultValue={editing ? String(editing.amount) : undefined} />
                <Field label="Data" name="date" type="date" required defaultValue={editing?.expense_date ?? todayLuanda()} />
                <Field label="Notas (opcional)" name="notes" maxLength={1000} defaultValue={editing?.notes} />
                <div className="flex gap-2 sm:col-span-2">
                  <Button disabled={busy}>{busy ? "A guardar…" : editing ? "Guardar alterações" : "Guardar despesa"}</Button>
                  <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
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
                    <div className="flex items-center gap-1">
                      <span className="mr-2 font-semibold">{money(Number(x.amount))}</span>
                      <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { setEditId(x.id); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil /></Button>
                      <Button size="icon" variant="ghost" aria-label="Remover" disabled={busy} onClick={() => remove(x.id)}><Trash2 className="text-destructive" /></Button>
                    </div>
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
