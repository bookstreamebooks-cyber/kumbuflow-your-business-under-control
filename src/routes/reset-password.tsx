import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/kumbuflow/auth-screen";
import { meta } from "@/lib/kumbuflow";

export const Route = createFileRoute("/reset-password")({
  head: () => meta("Nova palavra-passe", "Define uma nova palavra-passe para a tua conta KumbuFlow."),
  component: () => <AuthScreen recovery />,
});
