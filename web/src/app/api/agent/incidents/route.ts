import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { GRAVITES, ISO, STATUTS, TYPES } from "@/lib/incidents";

const Requete = z.object({
  statut: z.enum(STATUTS).optional(),
  gravite: z.enum(GRAVITES).optional(),
  type: z.enum(TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Liste des incidents (filtres, recherche, pagination) + compteurs par statut
export async function GET(req: Request) {
  const auth = await requireAuth(req, ["AGENT", "ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  const brut: Record<string, string> = {};
  for (const [k, v] of new URL(req.url).searchParams) if (v !== "") brut[k] = v;
  const analyse = Requete.safeParse(brut);
  if (!analyse.success) return erreur(400, "VALIDATION_ERROR", "Paramètres invalides");
  const { statut, gravite, type, q, page, limite } = analyse.data;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (statut) { where.push("statut = ?"); params.push(statut); }
  if (gravite) { where.push("gravite = ?"); params.push(gravite); }
  if (type) { where.push("type = ?"); params.push(type); }
  if (q) {
    const motif = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const num = /^#?(\d{1,9})$/.exec(q);
    if (num) {
      where.push("(id = ? OR titre LIKE ? OR lieu LIKE ?)");
      params.push(Number(num[1]), motif, motif);
    } else {
      where.push("(titre LIKE ? OR lieu LIKE ?)");
      params.push(motif, motif);
    }
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [total, lignes, groupes] = await Promise.all([
      pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM incident ${clause}`, params),
      pool.query<RowDataPacket[]>(
        `SELECT id, titre, type, lieu, statut, gravite, priorite,
                DATE_FORMAT(date_creation, '${ISO}') AS dateCreation
           FROM incident ${clause}
          ORDER BY date_creation DESC, id DESC
          LIMIT ? OFFSET ?`,
        [...params, limite, (page - 1) * limite]
      ),
      pool.query<RowDataPacket[]>("SELECT statut, COUNT(*) AS n FROM incident GROUP BY statut"),
    ]);

    const compteurs: Record<string, number> = { TOUS: 0 };
    for (const s of STATUTS) compteurs[s] = 0;
    for (const g of groupes[0]) {
      compteurs[String(g.statut)] = Number(g.n);
      compteurs.TOUS += Number(g.n);
    }

    return NextResponse.json({
      incidents: lignes[0],
      total: Number(total[0][0]?.n ?? 0),
      page,
      limite,
      compteurs,
    });
  } catch (e) {
    console.error("Échec du chargement des incidents :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  }
}
