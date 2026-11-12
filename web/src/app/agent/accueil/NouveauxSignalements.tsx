import Link from "next/link";
import styles from "./accueil.module.css";
import { IconAlert, IconChevron, IconPin } from "../icons";
import { LIBELLE_STATUT, PAGES, couleurGravite, tempsRelatif, type Statut } from "../incidentUi";
import type { IncidentResume } from "./useAccueil";

const CLASSE_STATUT: Record<Statut, string> = {
  NOUVEAU: styles.pNouveau,
  VALIDE: styles.pValide,
  EN_COURS: styles.pEnCours,
  RESOLU: styles.pResolu,
  REJETE: styles.pRejete,
  A_VERIFIER: styles.pVerifier,
};

function Ligne({ incident, maintenant }: { incident: IncidentResume; maintenant: number }) {
  const contenu = (
    <>
      <span className={styles.icone} style={{ "--c": couleurGravite(incident.gravite) } as React.CSSProperties}>
        <IconAlert />
      </span>
      <div className={styles.texte}>
        <p className={styles.titreLigne}>{incident.titre}</p>
        <p className={styles.lieu}>
          <IconPin />
          {incident.lieu ?? "Lieu non précisé"} • #{incident.id}
        </p>
      </div>
      <div className={styles.droite}>
        <span className={styles.temps}>{tempsRelatif(incident.dateCreation, maintenant)}</span>
        <span className={`${styles.pastille} ${CLASSE_STATUT[incident.statut]}`}>
          {LIBELLE_STATUT[incident.statut]}
        </span>
      </div>
      <span className={styles.chevron}><IconChevron /></span>
    </>
  );

  return PAGES.incidents ? (
    <Link href={`/agent/incidents?ouvrir=${incident.id}`} className={`${styles.ligne} ${styles.lienLigne}`}>
      {contenu}
    </Link>
  ) : (
    <div className={styles.ligne}>{contenu}</div>
  );
}

export default function NouveauxSignalements({
  incidents,
  maintenant,
  chargement,
}: {
  incidents: IncidentResume[];
  maintenant: number;
  chargement: boolean;
}) {
  if (chargement) return <p className={styles.vide}>Chargement…</p>;
  if (incidents.length === 0) return <p className={styles.vide}>Aucun signalement pour le moment.</p>;

  return (
    <ul className={styles.liste}>
      {incidents.map((i) => (
        <li key={i.id}>
          <Ligne incident={i} maintenant={maintenant} />
        </li>
      ))}
    </ul>
  );
}