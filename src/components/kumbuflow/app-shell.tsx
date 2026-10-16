import { useState, type ReactNode } from "react";
import { useAction } from "@/lib/use-action";
import { dateLabel } from "@/lib/kumbuflow";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Bell, CreditCard, FileSpreadsheet, LayoutDashboard, LogOut, Package, Receipt, ShieldCheck, ShoppingCart, Users } from "lucide-react";
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
          <Link to="/assinatura" className={linkCls} activeProps={{ className: activeCls }}>
            <CreditCard className="size-4" /> Assinatura
          </Link>
          <Link to="/relatorios" className={linkCls} activeProps={{ className: activeCls }}>
            <FileSpreadsheet className="size-4" /> Relatórios
          </Link>
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
            <Notifications />
            <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="Relatórios">
              <Link to="/relatorios"><FileSpreadsheet /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="Assinatura">
              <Link to="/assinatura"><CreditCard /></Link>
            </Button>
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

function Notifications() {
  const { data } = useSuspenseQuery(workspaceQuery);
  const { act } = useAction();
  const [open, setOpen] = useState(false);
  const list = data.notifications;
  const unread = list.filter((n) => !n.read_at).length;
  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0 && data.business) void act({ kind: "readNotifications", b: data.business.id }, "Notificações lidas.");
  }
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Notificações${unread ? ` (${unread} por ler)` : ""}`}>
        <Bell />
        {unread > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{unread}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-80 max-w-[90vw] rounded-xl border bg-card p-2 shadow-soft">
          <p className="px-2 py-1 text-sm font-semibold text-navy">Notificações</p>
          {list.length === 0 ? <p className="px-2 py-4 text-sm text-muted-foreground">Sem notificações.</p> : (
            <ul className="max-h-80 divide-y overflow-auto">
              {list.map((n) => (
                <li key={n.id} className="px-2 py-2 text-sm">
                  <p className={n.read_at ? "text-muted-foreground" : "font-medium"}>{n.message}</p>
                  <p className="text-xs text-muted-foreground">{dateLabel(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
