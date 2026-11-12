"use client";

import { useState } from "react";
import styles from "./photos.module.css";
import { usePhotosRecues, type PhotoRecue } from "./usePhotosRecues";
import PhotoModal from "./PhotoModal";

function formaterDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function PhotosRecues({ token }: { token: string }) {
  const { photos, erreur, chargement } = usePhotosRecues(token);
  const [selection, setSelection] = useState<PhotoRecue | null>(null);

  return (
    <section className={styles.section}>
      <h2 className={styles.titre}>Photos reçues</h2>
      {erreur && <p role="alert" className={styles.erreur}>{erreur}</p>}

      {chargement ? (
        <p className={styles.vide}>Chargement…</p>
      ) : photos.length === 0 ? (
        <p className={styles.vide}>Aucune photo reçue pour le moment.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Citoyen</th>
              <th>Reçue le</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((p) => (
              <tr key={p.id} onClick={() => setSelection(p)}>
                <td>
                  <button className={styles.ligne}>{p.prenom} {p.nom}</button>
                </td>
                <td>{formaterDate(p.dateReception)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selection && (
        <PhotoModal
          key={selection.id}
          token={token}
          photo={selection}
          onClose={() => setSelection(null)}
        />
      )}
    </section>
  );
}