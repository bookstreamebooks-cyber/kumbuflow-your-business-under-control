import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { workspaceQuery } from "@/lib/queries";
import { dateLabel, meta, money } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, NeedsBusiness, Panel, selectCls } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field } from "./produtos";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => meta("Clientes e dívidas", "Gere clientes, fornecedores e dívidas a receber."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Clients,
});

function Clients() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const { act, busy } = useAction();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<{ id: string; type: "customer" | "supplier" } | null>(null);
  const b = data.business;
  const editing = edit ? (edit.type === "customer" ? data.customers : data.suppliers).find((c) => c.id === edit.id) ?? null : null;
  const customerName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? "Cliente";
  const openDebts = data.debts.filter((d) => !d.cancelled && Number(d.amount) - Number(d.paid) > 0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!b) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const type = edit ? edit.type : f.get("type") === "supplier" ? "supplier" : "customer";
    const fields = { b: b.id, type, name: String(f.get("name")).trim(), phone: String(f.get("phone") ?? ""), email: String(f.get("email") ?? "").trim() } as const;
    const ok = edit
      ? await act({ kind: "contactEdit", id: edit.id, ...fields }, "Contacto actualizado.")
      : await act({ kind: "contact", ...fields }, type === "customer" ? "Cliente adicionado." : "Fornecedor adicionado.");
    if (ok) { form.reset(); setOpen(false); setEdit(null); }
  }

  async function remove(id: string, type: "customer" | "supplier", name: string) {
    if (!b || !window.confirm(`Remover «${name}»?`)) return;
    await act({ kind: "contactRemove", b: b.id, id, type }, "Contacto removido.");
  }
  function startEdit(id: string, type: "customer" | "supplier") { setEdit({ id, type }); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function close() { setOpen(false); setEdit(null); }
  const row = (c: { id: string; name: string; phone: string; email: string }, type: "customer" | "supplier") => (
    <li key={c.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
      <div className="min-w-0"><p className="truncate font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.phone || c.email || "—"}</p></div>
      <div className="flex">
        <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => startEdit(c.id, type)}><Pencil /></Button>
        <Button size="icon" variant="ghost" aria-label="Remover" disabled={busy} onClick={() => remove(c.id, type, c.name)}><Trash2 className="text-destructive" /></Button>
      </div>
    </li>
  );

  async function receive(id: string, remaining: number) {
    if (!b) return;
    const v = window.prompt(`Valor recebido (em falta: ${money(remaining)})`, String(remaining));
    if (!v) return;
    await act({ kind: "debt", b: b.id, id, amount: Number(v.replace(",", ".")), method: "Dinheiro", request: crypto.randomUUID() }, "Pagamento registado.");
  }

  return (
    <AppShell title="Clientes" actions={b && <Button onClick={() => { setEdit(null); setOpen(!open); }}><Plus /> Novo contacto</Button>}>
      {!b ? <NeedsBusiness /> : (
        <div className="space-y-6">
          {open && (
            <Panel title={editing ? "Editar contacto" : "Novo contacto"}>
              <form key={editing?.id ?? "new"} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                {!edit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="type">Tipo</Label>
                    <select id="type" name="type" className={selectCls}><option value="customer">Cliente</option><option value="supplier">Fornecedor</option></select>
                  </div>
                )}
                <Field label="Nome" name="name" required maxLength={100} defaultValue={editing?.name} />
                <Field label="Telefone" name="phone" type="tel" maxLength={30} defaultValue={editing?.phone} />
                <Field label="Email (opcional)" name="email" type="email" maxLength={255} defaultValue={editing?.email} />
                <div className="flex gap-2 sm:col-span-2">
                  <Button disabled={busy}>{busy ? "A guardar…" : "Guardar"}</Button>
                  <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
                </div>
              </form>
            </Panel>
          )}
          <Panel title="Dívidas a receber">
            {openDebts.length === 0 ? <Empty>Ninguém te deve neste momento.</Empty> : (
              <ul className="divide-y">
                {openDebts.map((d) => {
                  const rem = Number(d.amount) - Number(d.paid);
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium">{customerName(d.customer_id)}</p>
                        <p className="text-xs text-muted-foreground">Vence a {dateLabel(d.due_date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-warning">{money(rem)}</span>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => receive(d.id, rem)}>Receber</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title={`Clientes (${data.customers.length})`}>
              {data.customers.length === 0 ? <Empty>Sem clientes.</Empty> : (
                <ul className="divide-y">{data.customers.map((c) => row(c, "customer"))}</ul>
              )}
            </Panel>
            <Panel title={`Fornecedores (${data.suppliers.length})`}>
              {data.suppliers.length === 0 ? <Empty>Sem fornecedores.</Empty> : (
                <ul className="divide-y">{data.suppliers.map((c) => row(c, "supplier"))}</ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
}
