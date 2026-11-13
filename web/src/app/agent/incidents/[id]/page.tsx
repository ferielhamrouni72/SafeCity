"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAgent } from "../../AgentContext";
import { IconChevron, IconPin, IconUser } from "../../icons";
import StatutPastille from "../../StatutPastille";
import {
  LIBELLE_GRAVITE, LIBELLE_TYPE, tempsRelatif, type Gravite,
} from "../../incidentUi";
import { usePhotoImage } from "@/app/tableau-de-bord/usePhotoImage";
import styles from "./detail.module.css";
import TransmissionCarte from "./TransmissionCarte";
import { useIncident, type Action } from "./useIncident";

const GRAVITES = Object.keys(LIBELLE_GRAVITE) as Gravite[];

function Photo({ token, ids }: { token: string; ids: number[] }) {
  const [choix, setChoix] = useState(0);
  const id = ids[choix];
  return (
    <div className={styles.photoBloc}>
      <PhotoImage key={id} token={token} id={id} />
      {ids.length > 1 && (
        <div className={styles.miniatures}>
          {ids.map((_, n) => (
            <button
              key={n}
              type="button"
              className={`${styles.miniature} ${n === choix ? styles.miniatureActive : ""}`}
              onClick={() => setChoix(n)}
              aria-label={`Photo ${n + 1}`}
            >
              {n + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoImage({ token, id }: { token: string; id: number }) {
  const { url, erreur, chargement } = usePhotoImage(token, id);
  return (
    <div className={styles.photo}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Photo transmise par le citoyen" />
      ) : (
        <p className={styles.photoMessage}>{chargement ? "Chargement de la photo…" : erreur}</p>
      )}
      {url && <span className={styles.photoLegende}>Photo transmise par le citoyen</span>}
    </div>
  );
}

export default function IncidentDetailPage() {
  const session = useAgent();
  const params = useParams<{ id: string }>();
  const {
    incident, maintenant, introuvable, erreur, chargement, envoi,
    envoyer, transmettre, changerStatutTransmission,
  } = useIncident(session?.token ?? "", Number(params.id));

  const [graviteEdit, setGraviteEdit] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");

  if (!session) return null;

  const retour = (
    <Link href="/agent/incidents" className={styles.retour}>
      <span className={styles.retourIcone}><IconChevron /></span>
      Retour aux incidents
    </Link>
  );

  if (introuvable) {
    return (
      <>
        {retour}
        <p className={styles.etat}>Incident introuvable.</p>
      </>
    );
  }
  if (chargement || !incident) {
    return (
      <>
        {retour}
        {erreur ? <p role="alert" className={styles.erreur}>{erreur}</p> : <p className={styles.etat}>Chargement…</p>}
      </>
    );
  }

  const i = incident;
  const peutPrendre = ["NOUVEAU", "VALIDE", "A_VERIFIER"].includes(i.statut);
  const peutResoudre = i.statut === "EN_COURS";
  const termine = i.statut === "RESOLU" || i.statut === "REJETE";

  const graviteAffichee = graviteEdit ?? i.gravite ?? "";
  const graviteModifiee = graviteEdit !== null && graviteEdit !== "" && graviteEdit !== i.gravite;
  const noteSaisie = commentaire.trim() !== "";
  const modifications = graviteModifiee || noteSaisie;

  async function agir(action: Action) {
    const ok = await envoyer(action, {
      ...(graviteModifiee ? { gravite: graviteEdit as string } : {}),
      ...(noteSaisie ? { commentaire: commentaire.trim() } : {}),
    });
    if (ok) {
      setGraviteEdit(null);
      setCommentaire("");
    }
  }

  function rejeter() {
    if (window.confirm("Rejeter ce signalement (fausse alerte ou doublon) ?")) agir("REJETER");
  }

  const lieu = i.lieu ?? `${i.latitude.toFixed(5)}, ${i.longitude.toFixed(5)}`;
  const osm = `https://www.openstreetmap.org/?mlat=${i.latitude}&mlon=${i.longitude}#map=17/${i.latitude}/${i.longitude}`;
  const confiance = i.confianceIa === null ? null : Math.round(i.confianceIa * (i.confianceIa <= 1 ? 100 : 1));

  return (
    <>
      {retour}

      <div className={styles.entete}>
        <div>
          <p className={styles.reference}>SIGNALEMENT #{i.id}</p>
          <h1 className={styles.titre}>{i.titre}</h1>
          <p className={styles.meta}>
            <IconPin />
            <a href={osm} target="_blank" rel="noopener noreferrer" className={styles.lienLieu}>{lieu}</a>
            <span>• {tempsRelatif(i.dateCreation, maintenant)}</span>
            {i.priorite === "URGENTE" && <span className={styles.urgent}>Urgent</span>}
          </p>
        </div>
        <StatutPastille statut={i.statut} />
      </div>

      {erreur && <p role="alert" className={styles.erreur}>{erreur}</p>}

      <div className={styles.grille}>
        <div className={styles.colonne}>
          {i.photoIds.length > 0 ? (
            <Photo token={session.token} ids={i.photoIds} />
          ) : (
            <div className={`${styles.photo} ${styles.photoVide}`}>
              <p className={styles.photoMessage}>Aucune photo transmise</p>
            </div>
          )}

          <section className={styles.carte}>
            <h2 className={styles.carteTitre}>Description</h2>
            <p className={styles.description}>{i.description?.trim() || "Aucune description fournie."}</p>
            <div className={styles.citoyen}>
              <span className={styles.avatar}>C</span>
              <div>
                <p className={styles.citoyenNom}>Citoyen #{i.citoyenId}</p>
                <p className={styles.citoyenInfo}>
                  <IconUser />
                  {i.nombreTemoins > 1 ? `Confirmé par ${i.nombreTemoins} témoins` : "Signalé par 1 témoin"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.colonne}>
          <section className={styles.carte}>
            <div className={styles.iaEntete}>
              <div>
                <h2 className={styles.carteTitre}>Analyse IA</h2>
                <p className={styles.iaSous}>
                  {confiance === null ? "Non disponible pour ce signalement" : `Confiance ${confiance}%`}
                </p>
              </div>
            </div>
            {confiance !== null && (
              <>
                <div className={styles.barre}>
                  <span style={{ "--p": `${Math.min(100, Math.max(0, confiance))}%` } as CSSProperties} />
                </div>
                <dl className={styles.ia}>
                  <div><dt>Type détecté</dt><dd>{LIBELLE_TYPE[i.type] ?? i.type}</dd></div>
                  <div>
                    <dt>Gravité estimée</dt>
                    <dd>{i.gravite ? <span className={styles.puce}>{LIBELLE_GRAVITE[i.gravite]}</span> : "—"}</dd>
                  </div>
                </dl>
                {i.analyseIa && <p className={styles.iaTexte}>{i.analyseIa}</p>}
              </>
            )}
          </section>

          <section className={styles.carte}>
            <h2 className={styles.carteTitre}>Traitement</h2>

            {termine && (
              <p className={styles.bandeau}>
                {i.statut === "RESOLU" ? "Incident résolu" : "Signalement rejeté"} : lecture seule.
              </p>
            )}
            {i.agent && !termine && <p className={styles.agent}>Pris en charge par {i.agent}</p>}

            <label className={styles.champ} htmlFor="gravite">Gravité</label>
            <select
              id="gravite"
              className={styles.select}
              value={graviteAffichee}
              disabled={termine || envoi}
              onChange={(e) => setGraviteEdit(e.target.value)}
            >
              {i.gravite === null && <option value="">Non évaluée</option>}
              {GRAVITES.map((g) => <option key={g} value={g}>{LIBELLE_GRAVITE[g]}</option>)}
            </select>

            <label className={styles.champ} htmlFor="commentaire">Commentaire</label>
            <textarea
              id="commentaire"
              className={styles.textarea}
              value={commentaire}
              maxLength={1000}
              disabled={termine || envoi}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajouter une note pour le citoyen…"
            />

            <button type="button" className={styles.principal} disabled={!peutPrendre || envoi} onClick={() => agir("PRENDRE_EN_CHARGE")}>
              {envoi ? "Enregistrement…" : "✓ Prendre en charge"}
            </button>
            <button type="button" className={styles.secondaire} disabled={!peutResoudre || envoi} onClick={() => agir("RESOUDRE")}>
              Marquer comme résolu
            </button>
            {peutPrendre && (
              <button type="button" className={styles.danger} disabled={envoi} onClick={rejeter}>
                Rejeter le signalement
              </button>
            )}
            {!termine && !peutPrendre && modifications && (
              <button type="button" className={styles.lien} disabled={envoi} onClick={() => agir("ENREGISTRER")}>
                Enregistrer sans changer le statut
              </button>
            )}

            {i.commentaires.length > 0 && (
              <ul className={styles.notes}>
                {i.commentaires.map((c) => (
                  <li key={c.id}>
                    <p>{c.texte}</p>
                    <span>{c.auteur} • {tempsRelatif(c.dateCreation, maintenant)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <TransmissionCarte
            incident={i}
            maintenant={maintenant}
            envoi={envoi}
            onTransmettre={transmettre}
            onStatut={changerStatutTransmission}
          />
        </div>
      </div>
    </>
  );
}
