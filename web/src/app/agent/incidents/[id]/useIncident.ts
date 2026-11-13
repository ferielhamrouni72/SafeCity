import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import type { Gravite, Statut } from "../../incidentUi";

export type Commentaire = { id: number; texte: string; dateCreation: string; auteur: string };

export type Transmission = {
  id: number;
  service: string;
  message: string | null;
  statut: string;
  dateCreation: string;
  dateMaj: string;
  auteur: string;
};

export type IncidentDetail = {
  id: number;
  titre: string;
  type: string;
  description: string | null;
  lieu: string | null;
  latitude: number;
  longitude: number;
  statut: Statut;
  gravite: Gravite | null;
  priorite: "NORMALE" | "URGENTE";
  confianceIa: number | null;
  analyseIa: string | null;
  nombreTemoins: number;
  citoyenId: number;
  agent: string | null;
  dateCreation: string;
  datePriseEnCharge: string | null;
  dateResolution: string | null;
  photoIds: number[];
  commentaires: Commentaire[];
  transmissions: Transmission[];
};

export type Action = "PRENDRE_EN_CHARGE" | "RESOUDRE" | "REJETER" | "ENREGISTRER";

const INTERVALLE_MS = 15000;

export function useIncident(token: string, id: number) {
  const router = useRouter();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [maintenant, setMaintenant] = useState(0);
  const [introuvable, setIntrouvable] = useState(false);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const occupe = useRef(false);

  const expirer = useCallback(() => {
    clearSession();
    router.replace("/connexion");
  }, [router]);

  const charger = useCallback(async () => {
    if (!token || !Number.isInteger(id) || id <= 0) {
      setIntrouvable(true);
      setChargement(false);
      return;
    }
    try {
      const res = await fetch(`/api/agent/incidents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (occupe.current) return; // une action est en cours : sa réponse fera foi
      if (res.status === 401) return expirer();
      if (res.status === 404) {
        setIntrouvable(true);
        return;
      }
      if (!res.ok) {
        setErreur("Impossible de charger l’incident.");
        return;
      }
      setIncident(await res.json());
      setMaintenant(Date.now());
      setErreur("");
    } catch {
      setErreur("Serveur injoignable. Nouvelle tentative automatique.");
    } finally {
      setChargement(false);
    }
  }, [token, id, expirer]);

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

  // Appel d'écriture générique : la réponse est l'incident complet à jour. Renvoie true si ça a réussi.
  const requete = useCallback(
    async (url: string, methode: "POST" | "PATCH", corps: unknown) => {
      occupe.current = true;
      setEnvoi(true);
      setErreur("");
      try {
        const res = await fetch(url, {
          method: methode,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(corps),
        });
        if (res.status === 401) {
          expirer();
          return false;
        }
        if (res.status === 409) {
          const d = await res.json().catch(() => null);
          occupe.current = false;
          await charger();
          setErreur(d?.error?.message ?? "Cet incident vient d’être modifié. Les données ont été actualisées.");
          return false;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          setErreur(d?.error?.message ?? "Action impossible.");
          return false;
        }
        setIncident(await res.json());
        setMaintenant(Date.now());
        return true;
      } catch {
        setErreur("Serveur injoignable.");
        return false;
      } finally {
        occupe.current = false;
        setEnvoi(false);
      }
    },
    [token, charger, expirer]
  );

  const envoyer = useCallback(
    (action: Action, extra: { gravite?: string; commentaire?: string }) =>
      requete(`/api/agent/incidents/${id}`, "PATCH", { action, ...extra }),
    [requete, id]
  );

  const transmettre = useCallback(
    (services: string[], message: string) =>
      requete(`/api/agent/incidents/${id}/transmissions`, "POST", {
        services,
        ...(message ? { message } : {}),
      }),
    [requete, id]
  );

  const changerStatutTransmission = useCallback(
    (transmissionId: number, statut: string) =>
      requete(`/api/agent/transmissions/${transmissionId}`, "PATCH", { statut }),
    [requete]
  );

  return {
    incident, maintenant, introuvable, erreur, chargement, envoi,
    envoyer, transmettre, changerStatutTransmission,
  };
}
