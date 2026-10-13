import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { workspaceQuery } from "@/lib/queries";
import { meta, money } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, NeedsBusiness, Panel } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => meta("Produtos", "Gere os produtos, preços e stock do teu negócio."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Products,
});

function Products() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const { act, busy } = useAction();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const b = data.business;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!b) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const num = (k: string) => Number(f.get(k) || 0);
    const ok = await act(
      { kind: "product", b: b.id, name: String(f.get("name")).trim(), sku: String(f.get("sku") ?? ""), category: String(f.get("category") || "Geral").trim(), cost: num("cost"), price: num("price"), stock: num("stock"), min_stock: num("min") },
      "Produto adicionado.",
    );
    if (ok) { form.reset(); setOpen(false); }
  }

  const list = data.products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell title="Produtos" actions={b && <Button onClick={() => setOpen(!open)}><Plus /> Novo produto</Button>}>
      {!b ? <NeedsBusiness /> : (
        <div className="space-y-6">
          {open && (
            <Panel title="Novo produto">
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" name="name" required />
                <Field label="Código (opcional)" name="sku" />
                <Field label="Categoria" name="category" placeholder="Geral" />
                <Field label="Preço de venda (Kz)" name="price" type="number" required />
                <Field label="Custo (Kz)" name="cost" type="number" />
                <Field label="Stock inicial" name="stock" type="number" />
                <Field label="Stock mínimo" name="min" type="number" defaultValue="5" />
                <div className="flex items-end gap-2">
                  <Button disabled={busy} className="flex-1">{busy ? "A guardar…" : "Guardar"}</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                </div>
              </form>
            </Panel>
          )}
          <Panel>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar produto" className="pl-9" />
            </div>
            {list.length === 0 ? <Empty>Ainda não tens produtos. Adiciona o primeiro.</Empty> : (
              <ul className="divide-y">
                {list.map((p) => {
                  const low = Number(p.stock) <= Number(p.min_stock);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}{p.sku && ` · ${p.sku}`} · custo {money(Number(p.cost))}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{money(Number(p.price))}</p>
                        <p className={`text-xs ${low ? "font-semibold text-warning" : "text-muted-foreground"}`}>{Number(p.stock)} em stock</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

export function Field({ label, name, ...rest }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} min={rest.type === "number" ? 0 : undefined} step={rest.type === "number" ? "any" : undefined} {...rest} />
    </div>
  );
}
