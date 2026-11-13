"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./agent.module.css";
import { AgentContext } from "./AgentContext";
import { useAgentSession } from "./useAgentSession";
import { useCompteurNouveaux } from "./useCompteurNouveaux";
import {
  IconAlert, IconBell, IconChart, IconGrid, IconLogout,
  IconMap, IconSearch, IconUser, Logo,
} from "./icons";

const NAV = [
  { href: "/agent/accueil", label: "Accueil", Icon: IconGrid, pret: true },
  { href: "/agent/incidents", label: "Incidents", Icon: IconAlert, pret: true },
  { href: "/agent/carte", label: "Carte", Icon: IconMap, pret: false },
  { href: "/agent/statistiques", label: "Statistiques", Icon: IconChart, pret: false },
  { href: "/agent/administration", label: "Administration", Icon: IconUser, pret: false },
];

const LIBELLES = { AGENT: "Agent superviseur", ADMINISTRATEUR: "Administrateur", CITOYEN: "Citoyen" };

export default function AgentShell({ children }: { children: React.ReactNode }) {
  const { session, deconnexion } = useAgentSession();
  const pathname = usePathname();
  const nouveaux = useCompteurNouveaux(session?.token ?? "");

  if (!session) return null;

  const { prenom, nom, role } = session.utilisateur;
  const initiales = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo />
          <div>
            <p className={styles.brandName}>SafeCity</p>
            <p className={styles.brandSub}>SUPERVISION</p>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Navigation principale">
          {NAV.map(({ href, label, Icon, pret }) => {
            const actif = pathname === href || pathname.startsWith(href + "/");
            if (!pret) {
              return (
                <span key={href} className={`${styles.navItem} ${styles.navOff}`} aria-disabled="true" title="Bientôt disponible">
                  <Icon />
                  {label}
                </span>
              );
            }
            return (
              <Link key={href} href={href} className={`${styles.navItem} ${actif ? styles.navActif : ""}`} aria-current={actif ? "page" : undefined}>
                <Icon />
                {label}
                {href === "/agent/incidents" && nouveaux > 0 && (
                  <span className={styles.badge} aria-label={`${nouveaux} nouveaux incidents`}>{nouveaux}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.user}>
          <span className={styles.avatar}>{initiales}</span>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{prenom} {nom}</p>
            <p className={styles.userRole}>{LIBELLES[role]}</p>
          </div>
          <button onClick={deconnexion} className={styles.logout} aria-label="Se déconnecter" title="Se déconnecter">
            <IconLogout />
          </button>
        </div>
      </aside>

      <div className={styles.contenu}>
        <header className={styles.topbar}>
          <div className={styles.search}>
            <IconSearch />
            <input type="search" placeholder="Rechercher…" aria-label="Rechercher" disabled />
          </div>
          <div className={styles.topRight}>
            <span className={styles.live}>
              <span className={styles.dot} />
              En direct
            </span>
            <button className={styles.bell} aria-label="Notifications"><IconBell /></button>
            <span className={styles.avatar}>{initiales}</span>
          </div>
        </header>

        <main className={styles.main}>
          <AgentContext.Provider value={session}>{children}</AgentContext.Provider>
        </main>
      </div>
    </div>
  );
}