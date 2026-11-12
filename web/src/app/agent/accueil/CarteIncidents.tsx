"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as CarteLeaflet } from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./carte.module.css";
import { COULEUR_GRAVITE, COULEUR_NON_EVALUEE, LIBELLE_GRAVITE, couleurGravite, type Gravite } from "../incidentUi";
import type { PointCarte } from "./useAccueil";

type Leaflet = typeof import("leaflet");

const CENTRE_PAR_DEFAUT: [number, number] = [34.7406, 10.7603]; // Sfax
const ORDRE: Gravite[] = ["CRITIQUE", "ELEVEE", "MOYENNE", "FAIBLE"];

export default function CarteIncidents({ points }: { points: PointCarte[] }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const lRef = useRef<Leaflet | null>(null);
  const carteRef = useRef<CarteLeaflet | null>(null);
  const couchesRef = useRef<LayerGroup | null>(null);
  const dejaCadree = useRef(false);
  const [pret, setPret] = useState(false);

  // Création de la carte, une seule fois (Leaflet est chargé côté navigateur uniquement)
  useEffect(() => {
    let annule = false;
    (async () => {
      const L = await import("leaflet");
      if (annule || !conteneur.current || carteRef.current) return;
      const carte = L.map(conteneur.current, { scrollWheelZoom: false }).setView(CENTRE_PAR_DEFAUT, 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(carte);
      lRef.current = L;
      carteRef.current = carte;
      couchesRef.current = L.layerGroup().addTo(carte);
      setPret(true);
    })();
    return () => {
      annule = true;
      carteRef.current?.remove();
      carteRef.current = null;
      couchesRef.current = null;
      lRef.current = null;
      dejaCadree.current = false;
    };
  }, []);

  // Mise à jour des repères à chaque rafraîchissement des données
  useEffect(() => {
    const L = lRef.current;
    const carte = carteRef.current;
    const couches = couchesRef.current;
    if (!pret || !L || !carte || !couches) return;

    couches.clearLayers();
    for (const p of points) {
      const icone = L.divIcon({
        className: styles.pinWrap,
        html: `<span class="${styles.pin}" style="--c:${couleurGravite(p.gravite)}"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 31],
        popupAnchor: [0, -30],
      });
      // Contenu fabriqué avec textContent : jamais de HTML venant de la base
      const popup = document.createElement("div");
      const titre = document.createElement("strong");
      titre.textContent = p.titre;
      const numero = document.createElement("div");
      numero.textContent = `#${p.id}`;
      popup.append(titre, numero);
      L.marker([p.latitude, p.longitude], { icon: icone }).bindPopup(popup).addTo(couches);
    }

    if (points.length > 0 && !dejaCadree.current) {
      dejaCadree.current = true;
      carte.fitBounds(
        L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])),
        { padding: [40, 40], maxZoom: 15 }
      );
    }
  }, [points, pret]);

  return (
    <div>
      <div ref={conteneur} className={styles.carte} role="region" aria-label="Carte des incidents" />
      <ul className={styles.legende}>
        {ORDRE.map((g) => (
          <li key={g}>
            <span className={styles.legPoint} style={{ "--c": COULEUR_GRAVITE[g] } as React.CSSProperties} />
            {LIBELLE_GRAVITE[g]}
          </li>
        ))}
        <li>
          <span className={styles.legPoint} style={{ "--c": COULEUR_NON_EVALUEE } as React.CSSProperties} />
          À évaluer
        </li>
      </ul>
    </div>
  );
}