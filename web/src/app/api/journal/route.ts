import { NextResponse } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(50).optional(),
  typeEntite: z.string().trim().max(50).optional(),
  idEntite: z.coerce.number().int().positive().optional(),
  auteurId: z.coerce.number().int().positive().optional(),
});

export async function GET(req: Request) {
  // Lecture réservée à l'administrateur : un citoyen n'a aucun accès (SC24)
  const auth = await requireAuth(req, ["ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Paramètres invalides" } },
      { status: 400 }
    );
  }
  const { page, limit, action, typeEntite, idEntite, auteurId } = parsed.data;

  const where: string[] = [];
  const values: (string | number)[] = [];
  if (action) { where.push("j.action = ?"); values.push(action); }
  if (typeEntite) { where.push("j.type_entite = ?"); values.push(typeEntite); }
  if (idEntite) { where.push("j.id_entite = ?"); values.push(idEntite); }
  if (auteurId) { where.push("j.auteur_id = ?"); values.push(auteurId); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT j.id, j.auteur_id AS auteurId, CONCAT(u.prenom, ' ', u.nom) AS auteurNom,
            j.action, j.type_entite AS typeEntite, j.id_entite AS idEntite,
            j.ancienne_valeur AS ancienneValeur, j.nouvelle_valeur AS nouvelleValeur,
            j.date_action AS dateAction
       FROM journal_action j
       JOIN utilisateur u ON u.id = j.auteur_id
       ${clause}
      ORDER BY j.date_action DESC, j.id DESC
      LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit]
  );
  const [[{ total }]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM journal_action j ${clause}`,
    values
  );

  return NextResponse.json({ page, limit, total, donnees: rows });
}