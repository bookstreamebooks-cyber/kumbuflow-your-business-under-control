import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/kumbuflow/auth-screen";
import { meta } from "@/lib/kumbuflow";

export const Route = createFileRoute("/auth")({
  head: () => meta("Entrar", "Entra ou cria a tua conta KumbuFlow e controla as vendas, o stock e as dívidas do teu negócio."),
  component: () => <AuthScreen />,
});
