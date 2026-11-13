import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

const MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Vérifiez votre e-mail et votre mot de passe.",
  INVALID_CREDENTIALS: "E-mail ou mot de passe incorrect.",
  ACCOUNT_SUSPENDED: "Votre compte est suspendu. Contactez l’administration.",
};

export function useConnexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur("Entrez une adresse e-mail valide.");
      return;
    }
    if (!motDePasse) {
      setErreur("Entrez votre mot de passe.");
      return;
    }
    setErreur("");
    setChargement(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), motDePasse }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErreur(MESSAGES[data?.error?.code] ?? "Une erreur est survenue. Réessayez.");
        return;
      }
            saveSession(data);
      const role = data?.utilisateur?.role;
      router.push(role === "AGENT" || role === "ADMINISTRATEUR" ? "/agent/accueil" : "/tableau-de-bord");
    } catch {
      setErreur("Serveur injoignable. Vérifiez votre connexion.");
    } finally {
      setChargement(false);
    }
  }

  return { email, setEmail, motDePasse, setMotDePasse, erreur, chargement, onSubmit };
}