import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

// Liste des photos reçues : réservée aux agents et aux administrateurs
export async function GET(req: Request) {
  const auth = await requireAuth(req, ["AGENT", "ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  // MySQL stocke les dates en UTC (conteneur Docker) : on les renvoie avec "Z"
  // pour que le navigateur les convertisse lui-même à l'heure locale.
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id,
            u.prenom,
            u.nom,
            DATE_FORMAT(p.date_creation, '%Y-%m-%dT%H:%i:%sZ') AS dateReception
       FROM photo p
       JOIN utilisateur u ON u.id = p.utilisateur_id
      ORDER BY p.date_creation DESC, p.id DESC
      LIMIT 100`
  );
  return NextResponse.json(rows);
}