"use client";

import { Suspense } from "react";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
// On réutilise le style de la page « mot de passe oublié »
import styles from "../mot-de-passe-oublie/motDePasseOublie.module.css";
import { useReinitialiserMotDePasse } from "./useReinitialiserMotDePasse";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

function Contenu() {
  const {
    tokenPresent, motDePasse, setMotDePasse, confirmation, setConfirmation,
    erreur, reussi, chargement, onSubmit,
  } = useReinitialiserMotDePasse();

  if (!tokenPresent) {
    return (
      <div className={styles.form}>
        <p role="alert" className={styles.error}>Lien invalide. Refaites une demande de réinitialisation.</p>
        <Link href="/mot-de-passe-oublie" className={styles.link}>Mot de passe oublié</Link>
      </div>
    );
  }

  if (reussi) {
    return (
      <div className={styles.form}>
        <p className={styles.success}>Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.</p>
        <Link href="/connexion" className={styles.link}>Aller à la connexion</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <p className={styles.hint}>Choisissez un nouveau mot de passe (8 caractères minimum).</p>
      <div>
        <label htmlFor="mdp" className={styles.label}>Nouveau mot de passe</label>
        <input id="mdp" type="password" autoComplete="new-password" value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)} className={styles.input} />
      </div>
      <div>
        <label htmlFor="confirmation" className={styles.label}>Confirmer le mot de passe</label>
        <input id="confirmation" type="password" autoComplete="new-password" value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)} className={styles.input} />
      </div>

      {erreur && <p role="alert" className={styles.error}>{erreur}</p>}

      <button type="submit" className={styles.submit} disabled={chargement}>
        {chargement ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <main className={`${font.className} ${styles.page}`}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <div className={styles.circle} />
          <div className={styles.brand}>
            <div className={styles.logo}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0b6469" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className={styles.brandName}>SafeCity</span>
          </div>
          <p className={styles.eyebrow}>ENSEMBLE, PLUS RÉACTIFS</p>
          <h1 className={styles.title}>Une ville plus sûre commence avec vous.</h1>
          <p className={styles.subtitle}>Signalez, suivez et améliorez votre quartier en quelques secondes.</p>
        </header>

        <section className={styles.card}>
          <p className={styles.kicker}>PRESQUE TERMINÉ</p>
          <h2 className={styles.heading}>Nouveau mot de passe</h2>
          <Suspense fallback={null}>
            <Contenu />
          </Suspense>
          <p className={styles.footer}>
            <Link href="/connexion" className={styles.link}>Retour à la connexion</Link>
          </p>
        </section>
      </div>
    </main>
  );
}