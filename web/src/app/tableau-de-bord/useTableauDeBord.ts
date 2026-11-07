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

export function useTableauDeBord() {
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

  useEffect(() => {
    if (brut !== SSR && !session) router.replace("/connexion");
  }, [brut, session, router]);

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

  return { session, deconnexion };
}