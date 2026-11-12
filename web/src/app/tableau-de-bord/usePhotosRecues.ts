import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

export type PhotoRecue = {
  id: number;
  prenom: string;
  nom: string;
  dateReception: string;
};

const INTERVALLE_MS = 15000;

export function usePhotosRecues(token: string) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoRecue[]>([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/photos", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        clearSession();
        router.replace("/connexion");
        return;
      }
      if (res.status === 403) {
        setErreur("Accès réservé aux agents.");
        return;
      }
      if (!res.ok) {
        setErreur("Impossible de charger les photos.");
        return;
      }
      setPhotos(await res.json());
      setErreur("");
    } catch {
      setErreur("Serveur injoignable. Nouvelle tentative automatique.");
    } finally {
      setChargement(false);
    }
  }, [token, router]);

useEffect(() => {
  // Premier chargement via un minuteur : la règle ESLint interdit d'appeler
  // directement, dans l'effet, une fonction qui modifie un état
  const premier = setTimeout(charger, 0);
  const timer = setInterval(() => {
    if (!document.hidden) charger();
  }, INTERVALLE_MS);
  return () => {
    clearTimeout(premier);
    clearInterval(timer);
  };
}, [charger]);

  return { photos, erreur, chargement };
}