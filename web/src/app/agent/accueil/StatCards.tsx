import styles from "./accueil.module.css";
import type { Stats } from "./useAccueil";

type Carte = {
  cle: "urgents" | "enCours" | "aVerifier" | "resolusSemaine";
  label: string;
  couleur: string;
  sous: (s: Stats) => string;
};

const CARTES: Carte[] = [
  { cle: "urgents", label: "Urgents", couleur: "#d64545", sous: (s) => `+${s.urgentsAujourdhui} aujourd’hui` },
  {
    cle: "enCours",
    label: "En cours",
    couleur: "#2b87b3",
    sous: (s) => `${s.agentsActifs} agent${s.agentsActifs > 1 ? "s" : ""} actif${s.agentsActifs > 1 ? "s" : ""}`,
  },
  { cle: "aVerifier", label: "À vérifier", couleur: "#e8962e", sous: () => "Analyse requise" },
  { cle: "resolusSemaine", label: "Résolus", couleur: "#2f9e7a", sous: () => "Cette semaine" },
];

export default function StatCards({ stats }: { stats: Stats | null }) {
  return (
    <div className={styles.stats}>
      {CARTES.map(({ cle, label, couleur, sous }) => (
        <div key={cle} className={styles.stat} style={{ "--c": couleur } as React.CSSProperties}>
          <span className={styles.statDot} />
          <p className={styles.statValeur}>{stats ? stats[cle] : "–"}</p>
          <p className={styles.statLabel}>{label}</p>
          <p className={styles.statSous}>{stats ? sous(stats) : ""}</p>
        </div>
      ))}
    </div>
  );
}