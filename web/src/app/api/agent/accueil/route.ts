import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

const ISO = "%Y-%m-%dT%H:%i:%sZ"; // dates MySQL en UTC : le navigateur les convertit en heure locale
const n = (v: unknown) => Number(v ?? 0);

// Tout l'accueil en une requête HTTP : réservé aux agents et aux administrateurs
export async function GET(req: Request) {
  const auth = await requireAuth(req, ["AGENT", "ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  try {
    const [stats, recents, carte] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT
           SUM(priorite = 'URGENTE' AND statut NOT IN ('RESOLU','REJETE')) AS urgents,
           SUM(priorite = 'URGENTE' AND statut NOT IN ('RESOLU','REJETE') AND date_creation >= CURDATE()) AS urgentsAujourdhui,
           SUM(statut = 'EN_COURS') AS enCours,
           COUNT(DISTINCT CASE WHEN statut = 'EN_COURS' THEN agent_id END) AS agentsActifs,
           SUM(statut = 'A_VERIFIER') AS aVerifier,
           SUM(statut = 'RESOLU' AND date_resolution IS NOT NULL
               AND YEARWEEK(date_resolution, 1) = YEARWEEK(NOW(), 1)) AS resolusSemaine
         FROM incident`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT id, titre, type, lieu, statut, gravite, priorite,
                DATE_FORMAT(date_creation, '${ISO}') AS dateCreation
           FROM incident
          ORDER BY date_creation DESC, id DESC
          LIMIT 4`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT id, titre, latitude, longitude, gravite
           FROM incident
          WHERE statut <> 'REJETE'
          ORDER BY date_creation DESC
          LIMIT 200`
      ),
    ]);

    const s = stats[0][0] ?? {};
    return NextResponse.json({
      stats: {
        urgents: n(s.urgents),
        urgentsAujourdhui: n(s.urgentsAujourdhui),
        enCours: n(s.enCours),
        agentsActifs: n(s.agentsActifs),
        aVerifier: n(s.aVerifier),
        resolusSemaine: n(s.resolusSemaine),
      },
      recents: recents[0],
      carte: carte[0].map((p) => ({
        id: p.id,
        titre: p.titre,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        gravite: p.gravite,
      })),
    });
  } catch (e) {
    console.error("Échec du chargement de l'accueil :", e);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Erreur interne" } },
      { status: 500 }
    );
  }
}