import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  INVALID_TOKEN: "Ce lien est invalide ou expiré. Refaites une demande.",
  VALIDATION_ERROR: "Le mot de passe doit contenir entre 8 et 72 caractères.",
};

export function useReinitialiserMotDePasse() {
  const token = useSearchParams().get("token") ?? "";
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [reussi, setReussi] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setErreur("");
    setChargement(true);
    try {
      const res = await fetch("/api/auth/reinitialiser-mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, motDePasse }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErreur(MESSAGES[data?.error?.code] ?? "Une erreur est survenue. Réessayez.");
        return;
      }
      setReussi(true);
    } catch {
      setErreur("Serveur injoignable. Vérifiez votre connexion.");
    } finally {
      setChargement(false);
    }
  }

  return {
    tokenPresent: token.length > 0,
    motDePasse, setMotDePasse,
    confirmation, setConfirmation,
    erreur, reussi, chargement, onSubmit,
  };
}