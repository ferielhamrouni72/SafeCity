import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";
import { chargerIncident, lireId } from "@/lib/incidents";
import { SERVICE_CLES } from "@/lib/services";

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

const Corps = z.object({
  services: z.array(z.enum(SERVICE_CLES)).min(1).max(SERVICE_CLES.length),
  message: z.string().trim().max(500).optional(),
});

// Transmet un incident à un ou plusieurs services d'urgence
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, ["AGENT", "ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  const id = lireId((await ctx.params).id);
  if (!id) return erreur(404, "NOT_FOUND", "Incident introuvable");

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return erreur(400, "VALIDATION_ERROR", "Corps JSON invalide");
  }
  const analyse = Corps.safeParse(json);
  if (!analyse.success) return erreur(400, "VALIDATION_ERROR", "Choisissez au moins un service");
  const services = [...new Set(analyse.data.services)];
  const message = analyse.data.message || null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT statut FROM incident WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!rows[0]) {
      await conn.rollback();
      return erreur(404, "NOT_FOUND", "Incident introuvable");
    }
    if (rows[0].statut === "RESOLU" || rows[0].statut === "REJETE") {
      await conn.rollback();
      return erreur(409, "CONFLICT", "Cet incident est clos : transmission impossible");
    }

    for (const service of services) {
      await conn.execute(
        "INSERT INTO transmission_incident (incident_id, service, message, auteur_id) VALUES (?, ?, ?, ?)",
        [id, service, message, auth.user.id]
      );
      await journaliser(
        {
          auteurId: auth.user.id,
          action: "TRANSMISSION_SERVICE",
          typeEntite: "INCIDENT",
          idEntite: id,
          nouvelleValeur: service,
        },
        conn
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback().catch(() => {});
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      return erreur(409, "CONFLICT", "Cet incident a déjà été transmis à l’un de ces services");
    }
    console.error("Échec de la transmission :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }

  return NextResponse.json(await chargerIncident(id));
}
