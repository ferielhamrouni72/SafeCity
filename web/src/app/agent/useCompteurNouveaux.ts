import { useEffect, useState } from "react";

const INTERVALLE_MS = 15000;

// Nombre d'incidents au statut NOUVEAU, pour le badge rouge de la barre latérale
export function useCompteurNouveaux(token: string) {
  const [nombre, setNombre] = useState(0);

  useEffect(() => {
    if (!token) return;
    let actif = true;

    const charger = async () => {
      try {
        const res = await fetch("/api/agent/incidents?limite=1", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const d = await res.json();
        if (actif) setNombre(Number(d?.compteurs?.NOUVEAU ?? 0));
      } catch {
        // on garde l'ancienne valeur
      }
    };

    const premier = setTimeout(charger, 0);
    const timer = setInterval(() => {
      if (!document.hidden) charger();
    }, INTERVALLE_MS);
    return () => {
      actif = false;
      clearTimeout(premier);
      clearInterval(timer);
    };
  }, [token]);

  return nombre;
}
