import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import type { Gravite, Statut } from "../incidentUi";

export type LigneIncident = {
  id: number;
  titre: string;
  type: string;
  lieu: string | null;
  statut: Statut;
  gravite: Gravite | null;
  priorite: "NORMALE" | "URGENTE";
  dateCreation: string;
};

export type Compteurs = Record<"TOUS" | Statut, number>;

type Reponse = {
  incidents: LigneIncident[];
  total: number;
  page: number;
  limite: number;
  compteurs: Compteurs;
};

export type Filtres = {
  statut: Statut | "";
  gravite: Gravite | "";
  type: string;
  q: string;
  page: number;
};

const INITIAL: Filtres = { statut: "", gravite: "", type: "", q: "", page: 1 };
const LIMITE = 20;
const INTERVALLE_MS = 15000;

export function useIncidents(token: string) {
  const router = useRouter();
  const [filtres, setFiltres] = useState<Filtres>(INITIAL);
  const [qEffective, setQEffective] = useState("");
  const [donnees, setDonnees] = useState<Reponse | null>(null);
  const [maintenant, setMaintenant] = useState(0);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const sequence = useRef(0);

  // Toute modification de filtre ramène à la page 1 (sauf le changement de page lui-même)
  const modifier = useCallback((partiel: Partial<Filtres>) => {
    setFiltres((f) => ({ ...f, page: 1, ...partiel }));
  }, []);

  // Recherche : on attend la fin de la saisie avant d'interroger le serveur
  useEffect(() => {
    const t = setTimeout(() => setQEffective(filtres.q.trim()), 300);
    return () => clearTimeout(t);
  }, [filtres.q]);

  const { statut, gravite, type, page } = filtres;

  const charger = useCallback(async () => {
    if (!token) return;
    const numero = ++sequence.current; // ignore les réponses arrivées en retard
    const p = new URLSearchParams({ page: String(page), limite: String(LIMITE) });
    if (statut) p.set("statut", statut);
    if (gravite) p.set("gravite", gravite);
    if (type) p.set("type", type);
    if (qEffective) p.set("q", qEffective);

    try {
      const res = await fetch(`/api/agent/incidents?${p.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (numero !== sequence.current) return;
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
        setErreur("Impossible de charger les incidents.");
        return;
      }
      setDonnees(await res.json());
      setMaintenant(Date.now());
      setErreur("");
    } catch {
      if (numero === sequence.current) setErreur("Serveur injoignable. Nouvelle tentative automatique.");
    } finally {
      if (numero === sequence.current) setChargement(false);
    }
  }, [token, statut, gravite, type, qEffective, page, router]);

  useEffect(() => {
    const premier = setTimeout(charger, 0);
    const timer = setInterval(() => {
      if (!document.hidden) charger();
    }, INTERVALLE_MS);
    return () => {
      clearTimeout(premier);
      clearInterval(timer);
    };
  }, [charger]);

  const totalPages = donnees ? Math.max(1, Math.ceil(donnees.total / donnees.limite)) : 1;

  return { filtres, modifier, donnees, maintenant, erreur, chargement, totalPages };
}
