"use client";

import { useEffect, useRef } from "react";
import styles from "./photos.module.css";
import { usePhotoImage } from "./usePhotoImage";
import type { PhotoRecue } from "./usePhotosRecues";

type Props = { token: string; photo: PhotoRecue; onClose: () => void };

export default function PhotoModal({ token, photo, onClose }: Props) {
  const { url, erreur, chargement } = usePhotoImage(token, photo.id);
  const boutonFermer = useRef<HTMLButtonElement>(null);
  const nom = `${photo.prenom} ${photo.nom}`;

  useEffect(() => {
    boutonFermer.current?.focus();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onClose]);

  return (
    <div
      className={styles.fond}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.fenetre} role="dialog" aria-modal="true" aria-label={`Photo de ${nom}`}>
        <div className={styles.entete}>
          <h3>Photo de {nom}</h3>
          <button ref={boutonFermer} onClick={onClose} className={styles.fermer}>
            Fermer
          </button>
        </div>
        <div className={styles.corps}>
          {chargement && <p className={styles.vide}>Chargement…</p>}
          {erreur && <p role="alert" className={styles.erreur}>{erreur}</p>}
          {url && <img src={url} alt={`Photo envoyée par ${nom}`} className={styles.image} />}
        </div>
      </div>
    </div>
  );
}