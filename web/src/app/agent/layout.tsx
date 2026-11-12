import { DM_Sans } from "next/font/google";
import AgentShell from "./AgentShell";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={font.className}>
      <AgentShell>{children}</AgentShell>
    </div>
  );
}