"use client";

import { useState } from "react";
import Link from "next/link";
import { useAgent } from "../AgentContext";
import { IconChevron } from "../icons";
import { PAGES } from "../incidentUi";
import styles from "./accueil.module.css";
import CarteIncidents from "./CarteIncidents";
import NouveauxSignalements from "./NouveauxSignalements";
import StatCards from "./StatCards";
import { useAccueil, type PointCarte } from "./useAccueil";

const AUCUN: PointCarte[] = [];

function Voir({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return actif ? (
    <Link href={href} className={styles.voir}>
      {children}
      <IconChevron />
    </Link>
  ) : (
    <span className={`${styles.voir} ${styles.voirOff}`} aria-disabled="true" title="Bientôt disponible">
      {children}
      <IconChevron />
    </span>
  );
}

export default function AccueilPage() {
  const session = useAgent();
  const [date] = useState(() =>
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
  );
  const { donnees, maintenant, erreur, chargement } = useAccueil(session?.token ?? "");

  if (!session) return null;

  return (
    <>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>Bonjour, {session.utilisateur.prenom}</h1>
          <p className={styles.sous}>Voici l’état de la ville aujourd’hui.</p>
        </div>
        <p className={styles.date}>Aujourd’hui, {date}</p>
      </div>

      {erreur && <p role="alert" className={styles.erreur}>{erreur}</p>}

      <StatCards stats={donnees?.stats ?? null} />

      <div className={styles.grille}>
        <section className={styles.bloc}>
          <div className={styles.blocEntete}>
            <h2 className={styles.blocTitre}>Carte des incidents</h2>
            <Voir href="/agent/carte" actif={PAGES.carte}>Voir la carte</Voir>
          </div>
          <p className={styles.blocSous}>Actualisée automatiquement</p>
          <CarteIncidents points={donnees?.carte ?? AUCUN} />
        </section>

        <section className={styles.bloc}>
          <div className={styles.blocEntete}>
            <h2 className={styles.blocTitre}>Nouveaux signalements</h2>
            <Voir href="/agent/incidents" actif={PAGES.incidents}>Tout voir</Voir>
          </div>
          <p className={styles.blocSous}>Les plus récents</p>
          <NouveauxSignalements
            incidents={donnees?.recents ?? []}
            maintenant={maintenant}
            chargement={chargement}
          />
        </section>
      </div>
    </>
  );
}