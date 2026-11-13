"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useAgent } from "../AgentContext";
import { IconAlert, IconChevron, IconPin, IconSearch } from "../icons";
import StatutPastille from "../StatutPastille";
import {
  LIBELLE_GRAVITE, LIBELLE_STATUT, LIBELLE_TYPE,
  couleurGravite, tempsRelatif, type Gravite, type Statut,
} from "../incidentUi";
import styles from "./incidents.module.css";
import { useIncidents } from "./useIncidents";

const ONGLETS: { cle: Statut | ""; label: string }[] = [
  { cle: "", label: "Tous" },
  { cle: "NOUVEAU", label: "Nouveau" },
  { cle: "EN_COURS", label: "En cours" },
  { cle: "A_VERIFIER", label: "À vérifier" },
  { cle: "RESOLU", label: "Résolu" },
];

const STATUTS = Object.keys(LIBELLE_STATUT) as Statut[];
const GRAVITES = Object.keys(LIBELLE_GRAVITE) as Gravite[];

function IconFiltre() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}

export default function IncidentsPage() {
  const session = useAgent();
  const [date] = useState(() =>
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
  );
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const { filtres, modifier, donnees, maintenant, erreur, chargement, totalPages } =
    useIncidents(session?.token ?? "");

  if (!session) return null;

  const incidents = donnees?.incidents ?? [];
  const filtresActifs = [filtres.gravite, filtres.type].filter(Boolean).length;

  return (
    <>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>Incidents</h1>
          <p className={styles.sous}>Suivez et traitez les signalements.</p>
        </div>
        <p className={styles.date}>Aujourd’hui, {date}</p>
      </div>

      {erreur && <p role="alert" className={styles.erreur}>{erreur}</p>}

      <section className={styles.bloc}>
        <div className={styles.outils}>
          <label className={styles.recherche}>
            <IconSearch />
            <input
              type="search"
              value={filtres.q}
              onChange={(e) => modifier({ q: e.target.value })}
              placeholder="Rechercher un incident…"
              aria-label="Rechercher un incident"
            />
          </label>
          <button
            type="button"
            className={styles.boutonFiltres}
            onClick={() => setFiltresOuverts((v) => !v)}
            aria-expanded={filtresOuverts}
          >
            <IconFiltre />
            Filtres{filtresActifs > 0 ? ` (${filtresActifs})` : ""}
          </button>
        </div>

        {filtresOuverts && (
          <div className={styles.panneau}>
            <label className={styles.champ}>
              Statut
              <select value={filtres.statut} onChange={(e) => modifier({ statut: e.target.value as Statut | "" })}>
                <option value="">Tous</option>
                {STATUTS.map((s) => <option key={s} value={s}>{LIBELLE_STATUT[s]}</option>)}
              </select>
            </label>
            <label className={styles.champ}>
              Gravité
              <select value={filtres.gravite} onChange={(e) => modifier({ gravite: e.target.value as Gravite | "" })}>
                <option value="">Toutes</option>
                {GRAVITES.map((g) => <option key={g} value={g}>{LIBELLE_GRAVITE[g]}</option>)}
              </select>
            </label>
            <label className={styles.champ}>
              Type
              <select value={filtres.type} onChange={(e) => modifier({ type: e.target.value })}>
                <option value="">Tous</option>
                {Object.entries(LIBELLE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <button
              type="button"
              className={styles.reinit}
              onClick={() => modifier({ statut: "", gravite: "", type: "", q: "" })}
            >
              Réinitialiser
            </button>
          </div>
        )}

        <div className={styles.onglets} role="tablist" aria-label="Filtrer par statut">
          {ONGLETS.map(({ cle, label }) => {
            const actif = filtres.statut === cle;
            const nombre = donnees?.compteurs[cle === "" ? "TOUS" : cle];
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={actif}
                className={`${styles.onglet} ${actif ? styles.ongletActif : ""}`}
                onClick={() => modifier({ statut: cle })}
              >
                {label}
                {nombre !== undefined && <span className={styles.compteur}>{nombre}</span>}
              </button>
            );
          })}
        </div>

        {chargement ? (
          <p className={styles.vide}>Chargement…</p>
        ) : incidents.length === 0 ? (
          <p className={styles.vide}>Aucun incident ne correspond à votre recherche.</p>
        ) : (
          <ul className={styles.liste}>
            {incidents.map((i) => (
              <li key={i.id}>
                <Link href={`/agent/incidents/${i.id}`} className={styles.ligne}>
                  <span className={styles.icone} style={{ "--c": couleurGravite(i.gravite) } as CSSProperties}>
                    <IconAlert />
                  </span>
                  <div className={styles.texte}>
                    <p className={styles.titreLigne}>{i.titre}</p>
                    <p className={styles.lieu}>
                      <IconPin />
                      {i.lieu ?? LIBELLE_TYPE[i.type] ?? "Lieu non précisé"} • #{i.id}
                    </p>
                  </div>
                  <div className={styles.droite}>
                    <span className={styles.temps}>{tempsRelatif(i.dateCreation, maintenant)}</span>
                    <StatutPastille statut={i.statut} />
                  </div>
                  <span className={styles.chevron}><IconChevron /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button type="button" disabled={filtres.page <= 1} onClick={() => modifier({ page: filtres.page - 1 })}>
              Précédent
            </button>
            <span>Page {filtres.page} sur {totalPages}</span>
            <button type="button" disabled={filtres.page >= totalPages} onClick={() => modifier({ page: filtres.page + 1 })}>
              Suivant
            </button>
          </div>
        )}
      </section>
    </>
  );
}
