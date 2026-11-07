"use client";

import Link from "next/link";
import styles from "./tableau.module.css";
import { useTableauDeBord } from "./useTableauDeBord";

export default function TableauDeBordPage() {
  const { session, deconnexion } = useTableauDeBord();

  if (!session) return null;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Bonjour {session.utilisateur.prenom}</h1>
      <p className={styles.role}>Rôle : {session.utilisateur.role}</p>
      {session.utilisateur.role === "ADMINISTRATEUR" && (
        <Link href="/inscription" className={`${styles.button} ${styles.lien}`}>
          Ajouter un agent
        </Link>
      )}
      <button onClick={deconnexion} className={styles.button}>Se déconnecter</button>
    </main>
  );
}