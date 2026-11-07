"use client";

import Link from "next/link";
import { DM_Sans } from "next/font/google";
import styles from "./inscription.module.css";
import { useInscription, type Champ } from "./useInscription";

const font = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type ChampConfig = { label: string; type: string; autoComplete: string; placeholder: string };

const CHAMPS: Record<Champ, ChampConfig> = {
  prenom: { label: "Prénom", type: "text", autoComplete: "given-name", placeholder: "Votre prénom" },
  nom: { label: "Nom", type: "text", autoComplete: "family-name", placeholder: "Votre nom" },
  email: { label: "Adresse e-mail", type: "email", autoComplete: "email", placeholder: "vous@email.com" },
  telephone: { label: "Téléphone (facultatif)", type: "tel", autoComplete: "tel", placeholder: "20 123 456" },
  motDePasse: { label: "Mot de passe", type: "password", autoComplete: "new-password", placeholder: "8 caractères min." },
  confirmation: { label: "Confirmation", type: "password", autoComplete: "new-password", placeholder: "Répétez-le" },
};

// Champs affichés côte à côte sur grand écran
const LIGNES: Champ[][] = [
  ["prenom", "nom"],
  ["email"],
  ["telephone"],
  ["motDePasse", "confirmation"],
];

export default function InscriptionPage() {
  const { autorise, form, setChamp, erreur, succes, chargement, onSubmit } = useInscription();

  if (!autorise) return null;

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
          <p className={styles.kicker}>ADMINISTRATION</p>
          <h2 className={styles.heading}>Ajouter un agent</h2>

          <form onSubmit={onSubmit} noValidate className={styles.form}>
            {LIGNES.map((ligne) => (
              <div key={ligne.join("-")} className={styles.row}>
                {ligne.map((nom) => {
                  const c = CHAMPS[nom];
                  return (
                    <div key={nom}>
                      <label htmlFor={nom} className={styles.label}>{c.label}</label>
                      <input
                        id={nom}
                        type={c.type}
                        autoComplete={c.autoComplete}
                        placeholder={c.placeholder}
                        value={form[nom]}
                        onChange={(e) => setChamp(nom, e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {erreur && <p role="alert" className={styles.error}>{erreur}</p>}
            {succes && <p role="status" className={styles.success}>{succes}</p>}

            <button type="submit" className={styles.submit} disabled={chargement}>
              {chargement ? "Création…" : "Créer l’agent"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <p className={styles.footer}>
            <Link href="/tableau-de-bord" className={styles.link}>Retour au tableau de bord</Link>
          </p>
        </section>
      </div>
    </main>
  );
}