import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";
import { chargerIncident, lireId } from "@/lib/incidents";
import { STATUTS_TRANSMISSION } from "@/lib/services";

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

const Corps = z.object({ statut: z.enum(STATUTS_TRANSMISSION) });

// Met à jour l'avancement d'une transmission (envoyée / en intervention / terminée)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ["AGENT", "ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  const id = lireId((await ctx.params).id);
  if (!id) return erreur(404, "NOT_FOUND", "Transmission introuvable");

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return erreur(400, "VALIDATION_ERROR", "Corps JSON invalide");
  }
  const analyse = Corps.safeParse(json);
  if (!analyse.success) return erreur(400, "VALIDATION_ERROR", "Statut invalide");
  const { statut } = analyse.data;

  const conn = await pool.getConnection();
  let incidentId: number;
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT incident_id, service, statut FROM transmission_incident WHERE id = ? FOR UPDATE",
      [id]
    );
    const t = rows[0];
    if (!t) {
      await conn.rollback();
      return erreur(404, "NOT_FOUND", "Transmission introuvable");
    }
    incidentId = Number(t.incident_id);

    if (t.statut !== statut) {
      await conn.execute("UPDATE transmission_incident SET statut = ? WHERE id = ?", [statut, id]);
      await journaliser(
        {
          auteurId: auth.user.id,
          action: "TRANSMISSION_SERVICE",
          typeEntite: "INCIDENT",
          idEntite: incidentId,
          ancienneValeur: `${t.service}: ${t.statut}`,
          nouvelleValeur: `${t.service}: ${statut}`,
        },
        conn
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error("Échec de la mise à jour de la transmission :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }

  return NextResponse.json(await chargerIncident(incidentId));
}
