import type { Pool } from "mysql2/promise";
import { pool } from "@/lib/db";

// Actions sensibles journalisées (SC24 / RM7)
export type ActionJournal =
  | "INSCRIPTION"
  | "CONNEXION"
  | "ECHEC_CONNEXION"
  | "DECONNEXION"
  | "CHANGEMENT_STATUT"
  | "CHANGEMENT_TYPE"
  | "CHANGEMENT_GRAVITE"
  | "SUSPENSION_COMPTE"
  | "REACTIVATION_COMPTE"
  | "DEMANDE_REINITIALISATION"
  | "REINITIALISATION_MDP"
  | "CREATION_AGENT"
  | "ENVOI_PHOTO";

export type TypeEntite = "UTILISATEUR" | "INCIDENT" | "CATEGORIE" | "PHOTO";

type Executor = Pick<Pool, "execute">; // accepte le pool OU une connexion de transaction

export type EntreeJournal = {
  auteurId: number;
  action: ActionJournal;
  typeEntite: TypeEntite;
  idEntite?: number | null;
  ancienneValeur?: string | null;
  nouvelleValeur?: string | null;
};

const coupe = (v?: string | null) => (v == null ? null : String(v).slice(0, 255));

export async function journaliser(e: EntreeJournal, db: Executor = pool) {
  await db.execute(
    `INSERT INTO journal_action
       (auteur_id, action, type_entite, id_entite, ancienne_valeur, nouvelle_valeur)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      e.auteurId,
      e.action,
      e.typeEntite,
      e.idEntite ?? null,
      coupe(e.ancienneValeur),
      coupe(e.nouvelleValeur),
    ]
  );
}