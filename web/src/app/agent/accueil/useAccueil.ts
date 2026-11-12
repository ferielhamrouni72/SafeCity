import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import type { Gravite, Statut } from "../incidentUi";

export type Stats = {
  urgents: number;
  urgentsAujourdhui: number;
  enCours: number;
  agentsActifs: number;
  aVerifier: number;
  resolusSemaine: number;
};

export type IncidentResume = {
  id: number;
  titre: string;
  type: string;
  lieu: string | null;
  statut: Statut;
  gravite: Gravite | null;
  priorite: "NORMALE" | "URGENTE";
  dateCreation: string;
};

export type PointCarte = {
  id: number;
  titre: string;
  latitude: number;
  longitude: number;
  gravite: Gravite | null;
};

type Donnees = { stats: Stats; recents: IncidentResume[]; carte: PointCarte[] };

const INTERVALLE_MS = 15000;

export function useAccueil(token: string) {
  const router = useRouter();
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [maintenant, setMaintenant] = useState(0);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/agent/accueil", {
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
        setErreur("Impossible de charger les données.");
        return;
      }
      setDonnees(await res.json());
      setMaintenant(Date.now());
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

  return { donnees, maintenant, erreur, chargement };
}