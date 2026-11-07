import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clearSession, type Session } from "@/lib/session";

export type Champ = "prenom" | "nom" | "email" | "telephone" | "motDePasse" | "confirmation";

const VIDE: Record<Champ, string> = {
  prenom: "", nom: "", email: "", telephone: "", motDePasse: "", confirmation: "",
};

const MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Vérifiez les informations saisies.",
  EMAIL_EXISTS: "Cette adresse e-mail est déjà utilisée.",
  FORBIDDEN: "Action réservée aux administrateurs.",
  ACCOUNT_SUSPENDED: "Votre compte est suspendu.",
};

const SSR = "__ssr__";
const subscribe = () => () => {};

function lireBrut(): string {
  try {
    return sessionStorage.getItem("safecity_session") ?? "";
  } catch {
    return "";
  }
}

export function useInscription() {
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

  const autorise = session?.utilisateur.role === "ADMINISTRATEUR";

  // Page réservée à l'administrateur
  useEffect(() => {
    if (brut === SSR) return;
    if (!session) router.replace("/connexion");
    else if (!autorise) router.replace("/tableau-de-bord");
  }, [brut, session, autorise, router]);

  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  function setChamp(champ: Champ, valeur: string) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  function valider(): string {
    if (!form.prenom.trim() || !form.nom.trim()) return "Entrez le prénom et le nom.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Entrez une adresse e-mail valide.";
    if (form.motDePasse.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (form.motDePasse.length > 72) return "Le mot de passe est trop long (72 caractères max).";
    if (form.motDePasse !== form.confirmation) return "Les mots de passe ne correspondent pas.";
    return "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    setSucces("");
    const msg = valider();
    if (msg) {
      setErreur(msg);
      return;
    }
    setErreur("");
    setChargement(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email.trim(),
          motDePasse: form.motDePasse,
          telephone: form.telephone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const code = data?.error?.code;
        if (code === "UNAUTHENTICATED" || code === "INVALID_TOKEN") {
          clearSession();
          router.replace("/connexion");
          return;
        }
        setErreur(MESSAGES[code] ?? "Une erreur est survenue. Réessayez.");
        return;
      }
      setSucces(`L’agent ${form.prenom.trim()} ${form.nom.trim()} a été créé.`);
      setForm(VIDE);
    } catch {
      setErreur("Serveur injoignable. Vérifiez votre connexion.");
    } finally {
      setChargement(false);
    }
  }

  return { autorise, form, setChamp, erreur, succes, chargement, onSubmit };
}