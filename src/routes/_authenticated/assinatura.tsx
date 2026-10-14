import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { workspaceQuery } from "@/lib/queries";
import { dateLabel, meta, money } from "@/lib/kumbuflow";
import { useAction } from "@/lib/use-action";
import { AppShell, Empty, NeedsBusiness, Panel } from "@/components/kumbuflow/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assinatura")({
  head: () => meta("Assinatura", "Renova a tua assinatura KumbuFlow por transferência bancária."),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceQuery);
  },
  component: Subscription,
});

const statusLabel: Record<string, string> = { pending: "A aguardar verificação", approved: "Aprovado", rejected: "Rejeitado" };

function Subscription() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const { act, busy } = useAction();
  const [plan, setPlan] = useState("");
  const [uploading, setUploading] = useState(false);
  const b = data.business;
  const plans = data.plans.filter((p) => p.enabled);
  const bank = data.bank;
  const bankReady = !!bank && !!bank.bank_name && !!bank.account_holder && !!bank.iban;
  const sub = [...data.subscriptions].sort((a, c) => c.expires_at.localeCompare(a.expires_at))[0];
  const active = sub && new Date(sub.expires_at) > new Date(data.serverTime);
  const pending = data.requests.some((r) => r.status === "pending");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!b || !plan) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("receipt");
    let receipt: string | null = null;
    if (file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return toast.error("O comprovativo deve ter no máximo 5 MB.");
      setUploading(true);
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${data.userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
      setUploading(false);
      if (error) return toast.error("Não foi possível enviar o comprovativo.");
      receipt = path;
    }
    const ok = await act({ kind: "subscription", b: b.id, plan, reference: String(f.get("reference")), receipt }, "Pedido enviado. Vamos verificar a transferência.");
    if (ok) { form.reset(); setPlan(""); }
  }

  return (
    <AppShell title="Assinatura">
      {!b ? <NeedsBusiness /> : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-brand-gradient p-5 text-navy-foreground">
            <p className="text-sm opacity-80">Estado actual</p>
            <p className="font-display text-xl font-bold">
              {sub ? `${active ? (sub.is_trial ? "Ensaio grátis" : "Plano activo") : "Expirado"} · até ${dateLabel(sub.expires_at)}` : "Sem assinatura"}
            </p>
            <p className="mt-1 text-xs opacity-80">Os teus dados ficam guardados mesmo quando a assinatura expira.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="1. Escolhe o plano">
              <div className="grid gap-3">
                {plans.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPlan(p.id)} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${plan === p.id ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}>
                    <span><span className="block font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{p.duration_days} dias</span></span>
                    <span className="font-display text-lg font-bold text-navy">{money(Number(p.price))}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="2. Faz a transferência">
              {!bankReady ? <Empty>Os dados bancários ainda não foram configurados. Tenta mais tarde.</Empty> : (
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Banco</dt><dd className="font-medium">{bank.bank_name}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Titular</dt><dd className="font-medium">{bank.account_holder}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">IBAN</dt><dd className="break-all font-mono font-medium">{bank.iban}</dd></div>
                  {plan && <div><dt className="text-xs text-muted-foreground">Valor a transferir</dt><dd className="font-display text-lg font-bold text-primary">{money(Number(plans.find((p) => p.id === plan)?.price ?? 0))}</dd></div>}
                </dl>
              )}
            </Panel>
          </div>

          <Panel title="3. Envia o comprovativo">
            {pending ? <Empty>Já tens um pedido a aguardar verificação.</Empty> : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Referência da transferência</Label>
                  <Input id="reference" name="reference" required minLength={3} maxLength={100} placeholder="Nº da operação" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="receipt">Comprovativo (imagem ou PDF, opcional)</Label>
                  <Input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" />
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={busy || uploading || !plan || !bankReady}>{uploading ? "A enviar ficheiro…" : busy ? "A enviar…" : plan ? "Enviar pedido" : "Escolhe um plano primeiro"}</Button>
                  <p className="mt-2 text-xs text-muted-foreground">A assinatura só é activada depois de confirmarmos a transferência no banco.</p>
                </div>
              </form>
            )}
          </Panel>

          <Panel title="Pedidos anteriores">
            {data.requests.length === 0 ? <Empty>Ainda não fizeste pedidos.</Empty> : (
              <ul className="divide-y">{data.requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div><p className="font-medium">{data.plans.find((p) => p.id === r.plan_id)?.name} · Ref. {r.reference}</p><p className="text-xs text-muted-foreground">{dateLabel(r.created_at)}{r.review_note && r.status === "rejected" ? ` · ${r.review_note}` : ""}</p></div>
                  <span className={`text-xs font-semibold ${r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-warning"}`}>{statusLabel[r.status] ?? r.status}</span>
                </li>))}</ul>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
