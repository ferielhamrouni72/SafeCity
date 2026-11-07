import { useState, type FormEvent } from "react";

export function useMotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur("Entrez une adresse e-mail valide.");
      return;
    }
    setErreur("");
    setChargement(true);
    try {
      const res = await fetch("/api/auth/mot-de-passe-oublie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        setErreur("Une erreur est survenue. Réessayez.");
        return;
      }
      setEnvoye(true);
    } catch {
      setErreur("Serveur injoignable. Vérifiez votre connexion.");
    } finally {
      setChargement(false);
    }
  }

  return { email, setEmail, erreur, envoye, chargement, onSubmit };
}
