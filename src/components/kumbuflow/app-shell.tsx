import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Package, Receipt, ShieldCheck, ShoppingCart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { workspaceQuery } from "@/lib/queries";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/clientes", label: "Clientes", icon: Users },
] as const;

export function AppShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const { data } = useSuspenseQuery(workspaceQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground";
  const activeCls = "bg-primary/10 text-primary";

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-card lg:flex lg:flex-col lg:p-4">
        <div className="px-2 py-3"><Brand /></div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: activeCls }}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
          {data.isAdmin && (
            <Link to="/admin" className={`${linkCls} mt-4`} activeProps={{ className: activeCls }}>
              <ShieldCheck className="size-4" /> Administração
            </Link>
          )}
        </nav>
        <Button variant="ghost" className="justify-start" onClick={signOut}><LogOut /> Sair</Button>
      </aside>

      <div className="pb-24 lg:pb-0">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden"><Brand /></div>
          <h1 className="hidden font-display text-lg font-semibold text-navy lg:block">{title}</h1>
          <div className="flex items-center gap-1">
            {data.isAdmin && (
              <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="Administração">
                <Link to="/admin"><ShieldCheck /></Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={signOut} aria-label="Sair"><LogOut /></Button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-navy lg:hidden">{title}</h2>
            <div className="ml-auto flex gap-2">{actions}</div>
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card lg:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <n.icon className="size-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function NeedsBusiness() {
  return (
    <div className="rounded-2xl border bg-card p-6 text-center">
      <p className="text-muted-foreground">Primeiro regista o teu negócio no painel.</p>
      <Button asChild className="mt-4"><Link to="/dashboard">Ir para o painel</Link></Button>
    </div>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      {title && <h3 className="mb-4 font-display font-semibold text-navy">{title}</h3>}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
