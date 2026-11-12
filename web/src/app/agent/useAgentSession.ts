import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { clearSession, type Session } from "@/lib/session";

const SSR = "__ssr__";
const subscribe = () => () => {};

function lireBrut(): string {
  try {
    return sessionStorage.getItem("safecity_session") ?? "";
  } catch {
    return "";
  }
}

export function useAgentSession() {
  const router = useRouter();
  const brut = useSyncExternalStore(subscribe, lireBrut, () => SSR);

  const session = useMemo<Session | null>(() => {
    if (!brut || brut === SSR) return null;
    try {
      return JSON.parse(brut) as Session;
    } catch {
      return null;
    }
  }, [brut]);

  const role = session?.utilisateur.role;
  const autorise = role === "AGENT" || role === "ADMINISTRATEUR";

  // Redirection d'affichage : la vraie protection reste dans les routes de l'API
  useEffect(() => {
    if (brut === SSR) return;
    if (!session) router.replace("/connexion");
    else if (!autorise) router.replace("/tableau-de-bord");
  }, [brut, session, autorise, router]);

  async function deconnexion() {
    try {
      if (session) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
        });
      }
    } finally {
      clearSession();
      router.replace("/connexion");
    }
  }

  return { session: autorise ? session : null, deconnexion };
}