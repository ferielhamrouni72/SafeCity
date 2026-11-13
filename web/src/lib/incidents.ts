import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

// Dates MySQL en UTC : on renvoie un "Z" pour que le navigateur les convertisse en heure locale
export const ISO = "%Y-%m-%dT%H:%i:%sZ";

export const STATUTS = ["NOUVEAU", "VALIDE", "EN_COURS", "RESOLU", "REJETE", "A_VERIFIER"] as const;
export const GRAVITES = ["FAIBLE", "MOYENNE", "ELEVEE", "CRITIQUE"] as const;
export const TYPES = [
  "ACCIDENT", "INCENDIE", "INONDATION", "FUITE_EAU",
  "ARBRE_TOMBE", "NID_DE_POULE", "INFRASTRUCTURE", "AUTRE",
] as const;

export function lireId(brut: string): number | null {
  const n = Number(brut);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Un incident complet pour la page de détail.
// Le citoyen n'est identifié que par son numéro : ni nom, ni e-mail, ni téléphone.
export async function chargerIncident(id: number) {
  const [inc] = await pool.query<RowDataPacket[]>(
    `SELECT i.id, i.titre, i.type, i.description, i.lieu, i.latitude, i.longitude,
            i.statut, i.gravite, i.priorite, i.confiance_ia, i.analyse_ia,
            i.nombre_temoins, i.citoyen_id, i.agent_id,
            a.prenom AS agent_prenom, a.nom AS agent_nom,
            DATE_FORMAT(i.date_creation, '${ISO}') AS date_creation,
            DATE_FORMAT(i.date_prise_en_charge, '${ISO}') AS date_prise_en_charge,
            DATE_FORMAT(i.date_resolution, '${ISO}') AS date_resolution
       FROM incident i
       LEFT JOIN utilisateur a ON a.id = i.agent_id
      WHERE i.id = ?`,
    [id]
  );
  const i = inc[0];
  if (!i) return null;

  const [photos] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM photo WHERE incident_id = ? ORDER BY id",
    [id]
  );
  const [notes] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.texte, DATE_FORMAT(c.date_creation, '${ISO}') AS date_creation,
            u.prenom, u.nom
       FROM incident_commentaire c
       JOIN utilisateur u ON u.id = c.auteur_id
      WHERE c.incident_id = ?
      ORDER BY c.date_creation DESC, c.id DESC`,
    [id]
  );

  const [trans] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.service, t.message, t.statut,
            DATE_FORMAT(t.date_creation, '${ISO}') AS date_creation,
            DATE_FORMAT(t.date_maj, '${ISO}') AS date_maj,
            u.prenom, u.nom
       FROM transmission_incident t
       JOIN utilisateur u ON u.id = t.auteur_id
      WHERE t.incident_id = ?
      ORDER BY t.date_creation DESC, t.id DESC`,
    [id]
  );

  return {
    id: Number(i.id),
    titre: String(i.titre),
    type: String(i.type),
    description: (i.description as string | null) ?? null,
    lieu: (i.lieu as string | null) ?? null,
    latitude: Number(i.latitude),
    longitude: Number(i.longitude),
    statut: String(i.statut),
    gravite: (i.gravite as string | null) ?? null,
    priorite: String(i.priorite),
    confianceIa: i.confiance_ia == null ? null : Number(i.confiance_ia),
    analyseIa: (i.analyse_ia as string | null) ?? null,
    nombreTemoins: Number(i.nombre_temoins),
    citoyenId: Number(i.citoyen_id),
    agent: i.agent_id ? `${i.agent_prenom} ${i.agent_nom}` : null,
    dateCreation: String(i.date_creation),
    datePriseEnCharge: (i.date_prise_en_charge as string | null) ?? null,
    dateResolution: (i.date_resolution as string | null) ?? null,
    photoIds: photos.map((p) => Number(p.id)),
    transmissions: trans.map((t) => ({
      id: Number(t.id),
      service: String(t.service),
      message: (t.message as string | null) ?? null,
      statut: String(t.statut),
      dateCreation: String(t.date_creation),
      dateMaj: String(t.date_maj),
      auteur: `${t.prenom} ${t.nom}`,
    })),
    commentaires: notes.map((c) => ({
      id: Number(c.id),
      texte: String(c.texte),
      dateCreation: String(c.date_creation),
      auteur: `${c.prenom} ${c.nom}`,
    })),
  };
}
