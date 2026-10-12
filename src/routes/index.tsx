import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Package, Wallet } from "lucide-react";
import { Brand } from "@/components/kumbuflow/brand";
import { Button } from "@/components/ui/button";
import { meta } from "@/lib/kumbuflow";

export const Route = createFileRoute("/")({
  head: () => meta("O teu negócio, sob controlo", "KumbuFlow ajuda pequenos negócios em Angola a controlar vendas, stock, despesas e dívidas em Kwanza."),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="relative mt-4 overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-navy-foreground sm:px-12 sm:py-20">
          <span className="text-xs font-bold tracking-[0.2em] opacity-80">FEITO PARA ANGOLA</span>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">O teu negócio, sob controlo.</h1>
          <p className="mt-5 max-w-xl text-lg opacity-85">Regista vendas, acompanha o stock e sabe quem te deve — tudo em Kwanza, no telemóvel ou no computador.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary"><Link to="/auth">Começar 7 dias grátis <ArrowRight /></Link></Button>
          </div>
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-primary/40 blur-3xl" />
        </section>
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BarChart3, t: "Vendas e lucro", d: "Vê quanto vendeste e quanto ganhaste, todos os dias." },
            { icon: Package, t: "Stock", d: "Recebe alertas antes de os produtos acabarem." },
            { icon: Wallet, t: "Dívidas", d: "Controla o que os clientes te devem e quando pagam." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-6">
              <f.icon className="size-6 text-primary" />
              <h2 className="mt-4 font-display font-semibold text-navy">{f.t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
