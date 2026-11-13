"use client";

import { useState } from "react";
import { tempsRelatif } from "../../incidentUi";
import {
  LIBELLE_SERVICE, LIBELLE_STATUT_TRANSMISSION, SERVICES, SERVICES_SUGGERES, STATUTS_TRANSMISSION,
} from "@/lib/services";
import styles from "./transmission.module.css";
import type { IncidentDetail } from "./useIncident";

type Props = {
  incident: IncidentDetail;
  maintenant: number;
  envoi: boolean;
  onTransmettre: (services: string[], message: string) => Promise<boolean>;
  onStatut: (transmissionId: number, statut: string) => Promise<boolean>;
};

export default function TransmissionCarte({ incident, maintenant, envoi, onTransmettre, onStatut }: Props) {
  // null = l'agent n'a encore rien touché : on propose les services habituels pour ce type d'incident
  const [choix, setChoix] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");

  const dejaTransmis = new Set(incident.transmissions.map((t) => t.service));
  const clos = incident.statut === "RESOLU" || incident.statut === "REJETE";
  const selection = (choix ?? SERVICES_SUGGERES[incident.type] ?? []).filter((s) => !dejaTransmis.has(s));

  function basculer(cle: string) {
    setChoix(selection.includes(cle) ? selection.filter((s) => s !== cle) : [...selection, cle]);
  }

  async function envoyer() {
    if (await onTransmettre(selection, message.trim())) {
      setChoix([]);
      setMessage("");
    }
  }

  return (
    <section className={styles.carte}>
      <h2 className={styles.titre}>Transmettre aux services</h2>

      {clos ? (
        <p className={styles.info}>Incident clos : plus de nouvelle transmission possible.</p>
      ) : (
        <>
          <p className={styles.info}>Choisissez les services à alerter.</p>
          <div className={styles.puces}>
            {SERVICES.map(({ cle, label }) => {
              const fait = dejaTransmis.has(cle);
              const actif = selection.includes(cle);
              return (
                <button
                  key={cle}
                  type="button"
                  disabled={fait || envoi}
                  aria-pressed={actif}
                  className={`${styles.puce} ${actif ? styles.puceActive : ""}`}
                  onClick={() => basculer(cle)}
                >
                  {fait ? "✓ " : ""}{label}
                </button>
              );
            })}
          </div>

          <textarea
            className={styles.message}
            value={message}
            maxLength={500}
            disabled={envoi}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Précisions pour les secours (facultatif)…"
            aria-label="Message pour les services"
          />
          <button type="button" className={styles.envoyer} disabled={selection.length === 0 || envoi} onClick={envoyer}>
            {envoi ? "Envoi…" : selection.length > 0 ? `Transmettre (${selection.length})` : "Transmettre"}
          </button>
        </>
      )}

      {incident.transmissions.length > 0 && (
        <ul className={styles.historique}>
          {incident.transmissions.map((t) => (
            <li key={t.id}>
              <div className={styles.ligne}>
                <strong>{LIBELLE_SERVICE[t.service] ?? t.service}</strong>
                <select
                  value={t.statut}
                  disabled={envoi}
                  onChange={(e) => onStatut(t.id, e.target.value)}
                  aria-label={`Statut de la transmission à ${LIBELLE_SERVICE[t.service] ?? t.service}`}
                  className={styles.statut}
                  data-statut={t.statut}
                >
                  {STATUTS_TRANSMISSION.map((s) => (
                    <option key={s} value={s}>{LIBELLE_STATUT_TRANSMISSION[s]}</option>
                  ))}
                </select>
              </div>
              {t.message && <p className={styles.texte}>{t.message}</p>}
              <span className={styles.meta}>{t.auteur} • {tempsRelatif(t.dateCreation, maintenant)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
