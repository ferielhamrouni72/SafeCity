export type Statut = "NOUVEAU" | "VALIDE" | "EN_COURS" | "RESOLU" | "REJETE" | "A_VERIFIER";
export type Gravite = "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE";

export const LIBELLE_STATUT: Record<Statut, string> = {
  NOUVEAU: "Nouveau",
  VALIDE: "Validé",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  REJETE: "Rejeté",
  A_VERIFIER: "À vérifier",
};

export const LIBELLE_GRAVITE: Record<Gravite, string> = {
  CRITIQUE: "Critique",
  ELEVEE: "Élevée",
  MOYENNE: "Moyenne",
  FAIBLE: "Faible",
};

export const COULEUR_GRAVITE: Record<Gravite, string> = {
  CRITIQUE: "#d64545",
  ELEVEE: "#e8833a",
  MOYENNE: "#e0a82e",
  FAIBLE: "#2f9e7a",
};

export const LIBELLE_TYPE: Record<string, string> = {
  ACCIDENT: "Accident",
  INCENDIE: "Incendie",
  INONDATION: "Inondation",
  FUITE_EAU: "Fuite d’eau",
  ARBRE_TOMBE: "Arbre tombé",
  NID_DE_POULE: "Nid-de-poule",
  INFRASTRUCTURE: "Infrastructure",
  AUTRE: "Autre",
};

export const COULEUR_NON_EVALUEE = "#c3cecf";

export function couleurGravite(g: Gravite | null): string {
  return g ? COULEUR_GRAVITE[g] : COULEUR_NON_EVALUEE;
}

// Passer à true quand la page correspondante existe : les liens deviennent cliquables
export const PAGES = { incidents: true, carte: false };

export function tempsRelatif(iso: string, maintenant: number): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  const minutes = Math.floor((maintenant - t.getTime()) / 60000);
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const heure = t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const jour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const ecart = Math.round((jour(new Date(maintenant)) - jour(t)) / 86400000);
  if (ecart <= 0) return `Aujourd’hui, ${heure}`;
  if (ecart === 1) return `Hier, ${heure}`;
  return `${t.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}, ${heure}`;
}