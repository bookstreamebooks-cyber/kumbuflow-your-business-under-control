import { queryOptions } from "@tanstack/react-query";
import { getAdminData, getWorkspace } from "./kumbuflow.functions";

export const workspaceQuery = queryOptions({ queryKey: ["workspace"], queryFn: () => getWorkspace() });
export const adminQuery = queryOptions({ queryKey: ["admin"], queryFn: () => getAdminData() });
