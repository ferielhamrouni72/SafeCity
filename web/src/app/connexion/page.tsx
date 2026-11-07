"use client";

import Link from "next/link";
import { DM_Sans } from "next/font/google";
import styles from "./connexion.module.css";
import { useConnexion } from "./useConnexion";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function ConnexionPage() {
  const { email, setEmail, motDePasse, setMotDePasse, erreur, chargement, onSubmit } = useConnexion();
console.log(styles);
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
          <p className={styles.subtitle}>
            Signalez, suivez et améliorez votre quartier en quelques secondes.
          </p>
        </header>

        <section className={styles.card}>
          <p className={styles.kicker}>HEUREUX DE VOUS REVOIR</p>
          <h2 className={styles.heading}>Connexion</h2>

          <form onSubmit={onSubmit} noValidate className={styles.form}>
            <div>
              <label htmlFor="email" className={styles.label}>Adresse e-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label htmlFor="mdp" className={styles.label}>Mot de passe</label>
              <input
                id="mdp"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.forgot}>
              <Link href="/mot-de-passe-oublie" className={styles.link}>Mot de passe oublié ?</Link>
            </div>

            {erreur && <p role="alert" className={styles.error}>{erreur}</p>}

            <button type="submit" className={styles.submit} disabled={chargement}>
              {chargement ? "Connexion…" : "Se connecter"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </form>

<<<<<<< HEAD
=======
          <p className={styles.footer}>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className={styles.link}>Créer un compte</Link>
          </p>
>>>>>>> origin/feriel
        </section>
      </div>
    </main>
  );
}