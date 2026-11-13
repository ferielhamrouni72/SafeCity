import { Suspense } from "react";
import AgentShell from "./AgentShell";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AgentShell>{children}</AgentShell>
    </Suspense>
  );
}