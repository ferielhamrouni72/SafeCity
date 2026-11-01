"use client";

import Link from "next/link";
import { DM_Sans } from "next/font/google";
import styles from "./motDePasseOublie.module.css";
import { useMotDePasseOublie } from "./useMotDePasseOublie";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function MotDePasseOubliePage() {
  const { email, setEmail, erreur, envoye, chargement, onSubmit } = useMotDePasseOublie();

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
          <p className={styles.kicker}>PAS DE PANIQUE</p>
          <h2 className={styles.heading}>Mot de passe oublié</h2>

          {envoye ? (
            <div className={styles.form}>
              <p className={styles.success}>
                Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.
                Il est valable 1 heure.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className={styles.form}>
              <p className={styles.hint}>
                Entrez votre e-mail : nous vous enverrons un lien pour choisir un nouveau mot de passe.
              </p>
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

              {erreur && <p role="alert" className={styles.error}>{erreur}</p>}

              <button type="submit" className={styles.submit} disabled={chargement}>
                {chargement ? "Envoi…" : "Envoyer le lien"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </form>
          )}

          <p className={styles.footer}>
            <Link href="/connexion" className={styles.link}>Retour à la connexion</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
