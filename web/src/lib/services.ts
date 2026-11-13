// Services d'urgence auxquels un agent peut transmettre un incident.
// Fichier sans dépendance serveur : utilisable côté API et côté navigateur.

export const SERVICES = [
  { cle: "AMBULANCE", label: "Ambulance (SAMU)" },
  { cle: "POLICE", label: "Police" },
  { cle: "POMPIERS", label: "Protection civile (pompiers)" },
  { cle: "SONEDE", label: "SONEDE (eau)" },
  { cle: "STEG", label: "STEG (électricité, gaz)" },
  { cle: "MUNICIPALITE", label: "Municipalité (voirie)" },
] as const;

export type ServiceCle = (typeof SERVICES)[number]["cle"];
export const SERVICE_CLES = SERVICES.map((s) => s.cle) as [ServiceCle, ...ServiceCle[]];
export const LIBELLE_SERVICE: Record<string, string> = Object.fromEntries(
  SERVICES.map((s) => [s.cle, s.label])
);

export const STATUTS_TRANSMISSION = ["ENVOYEE", "EN_INTERVENTION", "TERMINEE"] as const;
export type StatutTransmission = (typeof STATUTS_TRANSMISSION)[number];
export const LIBELLE_STATUT_TRANSMISSION: Record<StatutTransmission, string> = {
  ENVOYEE: "Envoyée",
  EN_INTERVENTION: "En intervention",
  TERMINEE: "Terminée",
};

// Services proposés par défaut selon le type d'incident (l'agent peut modifier)
export const SERVICES_SUGGERES: Record<string, ServiceCle[]> = {
  ACCIDENT: ["AMBULANCE", "POLICE"],
  INCENDIE: ["POMPIERS"],
  INONDATION: ["POMPIERS", "MUNICIPALITE"],
  FUITE_EAU: ["SONEDE"],
  ARBRE_TOMBE: ["MUNICIPALITE"],
  NID_DE_POULE: ["MUNICIPALITE"],
  INFRASTRUCTURE: ["MUNICIPALITE"],
  AUTRE: [],
};
