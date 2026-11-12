import { createContext, useContext } from "react";
import type { Session } from "@/lib/session";

export const AgentContext = createContext<Session | null>(null);

export function useAgent() {
  return useContext(AgentContext);
}