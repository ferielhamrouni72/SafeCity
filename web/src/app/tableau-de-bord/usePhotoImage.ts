import { useEffect, useState } from "react";

export function usePhotoImage(token: string, id: number) {
  const [url, setUrl] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    let objectUrl: string | null = null;

    (async () => {
      try {
        const res = await fetch(`/api/photos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setErreur(
            res.status === 401
              ? "Session expirée. Reconnectez-vous."
              : res.status === 404
              ? "Photo introuvable."
              : "Impossible d’afficher la photo."
          );
          return;
        }
        objectUrl = URL.createObjectURL(await res.blob());
        setUrl(objectUrl);
      } catch {
        if (!ctrl.signal.aborted) setErreur("Serveur injoignable.");
      } finally {
        if (!ctrl.signal.aborted) setChargement(false);
      }
    })();

    return () => {
      ctrl.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, id]);

  return { url, erreur, chargement };
}