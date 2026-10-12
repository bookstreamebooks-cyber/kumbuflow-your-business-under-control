import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "./brand";

type Mode = "login" | "signup" | "forgot";

export function AuthScreen({ recovery = false }: { recovery?: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setMessage("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      if (recovery) {
        const password = z.string().min(8).max(100).parse(f.get("password"));
        const { data } = await supabase.auth.getUser();
        if (!data.user) throw new Error("Abre o link de recuperação recebido por email.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error("Não foi possível actualizar a palavra-passe.");
        setMessage("Palavra-passe actualizada. A entrar…");
        await navigate({ to: "/dashboard" });
        return;
      }
      const email = z.string().trim().email().max(255).parse(f.get("email"));
      const password = String(f.get("password") ?? "");
      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        setMessage("Se a conta existir, receberás um email para recuperar a palavra-passe.");
      } else if (mode === "signup") {
        const name = z.string().trim().min(1).max(100).parse(f.get("name"));
        z.string().min(8).max(100).parse(password);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name: name } },
        });
        if (error) throw new Error("Não foi possível criar a conta. Verifica os dados e tenta novamente.");
        if (data.session) await navigate({ to: "/dashboard" });
        else setMessage("Conta criada! Verifica o teu email para confirmar e depois entra.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email ou palavra-passe incorrectos.");
        await navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(
        err instanceof z.ZodError
          ? "Preenche os campos correctamente. A palavra-passe deve ter pelo menos 8 caracteres."
          : err instanceof Error
            ? err.message
            : "Ocorreu um erro.",
      );
    } finally {
      setBusy(false);
    }
  }

  const title = recovery
    ? "Nova palavra-passe"
    : mode === "signup"
      ? "Cria a tua conta"
      : mode === "forgot"
        ? "Recupera a tua conta"
        : "Bom ter-te de volta";
  const subtitle = recovery
    ? "Escolhe uma palavra-passe segura com pelo menos 8 caracteres."
    : mode === "signup"
      ? "Experimenta o KumbuFlow grátis durante 7 dias."
      : mode === "forgot"
        ? "Enviamos-te um link para criares uma nova palavra-passe."
        : "Entra para acompanhar as vendas, o stock e as dívidas.";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-brand-gradient p-12 text-navy-foreground lg:flex lg:flex-col lg:justify-between">
        <Brand inverted />
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">O teu negócio, sob controlo.</h2>
          <p className="mt-4 text-lg opacity-80">Vendas, stock, despesas e dívidas num só lugar — pensado para pequenos negócios em Angola.</p>
          <ul className="mt-8 space-y-3">
            {["Vendas e lucro em Kwanza, em tempo real", "Alertas de stock baixo", "Controlo de quem te deve"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-60">© {new Date().getFullYear()} KumbuFlow · Angola · AOA</p>
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/30 blur-3xl" />
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <span className="text-xs font-bold tracking-[0.18em] text-primary">KUMBUFLOW</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            {mode === "signup" && !recovery && (
              <div className="space-y-1.5">
                <Label htmlFor="name">O teu nome</Label>
                <Input id="name" name="name" autoComplete="name" required maxLength={100} className="h-11" />
              </div>
            )}
            {!recovery && (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="nome@exemplo.com" autoComplete="email" required maxLength={255} className="h-11" />
              </div>
            )}
            {(mode !== "forgot" || recovery) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Palavra-passe</Label>
                  {mode === "login" && !recovery && (
                    <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => switchMode("forgot")}>
                      Esqueceste-te?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={show ? "text" : "password"}
                    autoComplete={mode === "signup" || recovery ? "new-password" : "current-password"}
                    required
                    maxLength={100}
                    className="h-11 pr-11"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0.5 top-0.5" aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"} onClick={() => setShow(!show)}>
                    {show ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
            )}
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
            <Button size="lg" className="h-11 w-full" disabled={busy}>
              {busy ? "Aguarda…" : recovery ? "Guardar palavra-passe" : mode === "signup" ? "Criar conta grátis" : mode === "forgot" ? "Enviar link" : "Entrar"}
              <ArrowRight />
            </Button>
          </form>

          {!recovery && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Ainda não tens conta?" : "Já tens conta?"}{" "}
              <button type="button" className="font-semibold text-primary hover:underline" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Criar conta grátis" : "Entrar"}
              </button>
            </p>
          )}
          {recovery && (
            <Link to="/auth" className="mt-6 text-center text-sm font-semibold text-primary hover:underline">Voltar a entrar</Link>
          )}
          <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="size-3.5" /> Os teus dados ficam seguros e privados.
          </p>
        </div>
      </section>
    </main>
  );
}
