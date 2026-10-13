import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { performAction } from "./kumbuflow.functions";
import type { Action } from "./kumbuflow";

export function useAction() {
  const run = useServerFn(performAction);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function act(data: Action, success: string) {
    setBusy(true);
    try {
      await run({ data });
      await qc.invalidateQueries();
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocorreu um erro.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { act, busy };
}
