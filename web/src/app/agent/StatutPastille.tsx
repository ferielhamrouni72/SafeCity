import styles from "./statut.module.css";
import { LIBELLE_STATUT, type Statut } from "./incidentUi";

const CLASSE: Record<Statut, string> = {
  NOUVEAU: styles.nouveau,
  VALIDE: styles.valide,
  EN_COURS: styles.enCours,
  RESOLU: styles.resolu,
  REJETE: styles.rejete,
  A_VERIFIER: styles.verifier,
};

export default function StatutPastille({ statut }: { statut: Statut }) {
  return <span className={`${styles.pastille} ${CLASSE[statut]}`}>{LIBELLE_STATUT[statut]}</span>;
}
