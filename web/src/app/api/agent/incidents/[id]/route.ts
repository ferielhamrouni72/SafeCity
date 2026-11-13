import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";
import { GRAVITES, chargerIncident, lireId } from "@/lib/incidents";

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireAuth(req, ["AGENT", "ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

  const id = lireId((await ctx.params).id);
  if (!id) return erreur(404, "NOT_FOUND", "Incident introuvable");

  try {
    const incident = await chargerIncident(id);
    if (!incident) return erreur(404, "NOT_FOUND", "Incident introuvable");
    return NextResponse.json(incident);
  } catch (e) {
    console.error("Échec du chargement de l'incident :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  }
}

const Corps = z.object({
  action: z.enum(["PRENDRE_EN_CHARGE", "RESOUDRE", "REJETER", "ENREGISTRER"]),
  gravite: z.enum(GRAVITES).optional(),
  commentaire: z.string().trim().max(1000).optional(),
});

// Transitions autorisées : statut actuel -> nouveau statut
const TRANSITIONS = {
  PRENDRE_EN_CHARGE: { de: ["NOUVEAU", "VALIDE", "A_VERIFIER"], vers: "EN_COURS" },
  RESOUDRE: { de: ["EN_COURS"], vers: "RESOLU" },
  REJETER: { de: ["NOUVEAU", "VALIDE", "A_VERIFIER"], vers: "REJETE" },
} as const;

export async function PATCH(req: Request, ctx: Ctx) {
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
  if (!analyse.success) return erreur(400, "VALIDATION_ERROR", "Données invalides");
  const corps = analyse.data;
  const transition = corps.action === "ENREGISTRER" ? null : TRANSITIONS[corps.action];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verrou de ligne : si deux agents agissent en même temps, le second attend puis reçoit 409
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT statut, gravite FROM incident WHERE id = ? FOR UPDATE",
      [id]
    );
    const ancien = rows[0];
    if (!ancien) {
      await conn.rollback();
      return erreur(404, "NOT_FOUND", "Incident introuvable");
    }
    const statutActuel = String(ancien.statut);
    const termine = statutActuel === "RESOLU" || statutActuel === "REJETE";
    const autorise = transition
      ? (transition.de as readonly string[]).includes(statutActuel)
      : !termine;
    if (!autorise) {
      await conn.rollback();
      return erreur(409, "CONFLICT", "Cet incident a déjà été traité ou modifié");
    }

    const sets: string[] = [];
    const vals: (string | number)[] = [];
    if (transition) {
      sets.push("statut = ?");
      vals.push(transition.vers);
      if (corps.action === "PRENDRE_EN_CHARGE") {
        sets.push("agent_id = ?", "date_prise_en_charge = NOW()");
        vals.push(auth.user.id);
      } else if (corps.action === "RESOUDRE") {
        sets.push("agent_id = COALESCE(agent_id, ?)", "date_resolution = NOW()");
        vals.push(auth.user.id);
      }
    }
    const nouvelleGravite = corps.gravite && corps.gravite !== ancien.gravite ? corps.gravite : null;
    if (nouvelleGravite) {
      sets.push("gravite = ?");
      vals.push(nouvelleGravite);
    }
    const commentaire = corps.commentaire ?? "";

    if (sets.length === 0 && !commentaire) {
      await conn.rollback();
      return erreur(400, "VALIDATION_ERROR", "Rien à enregistrer");
    }

    if (sets.length > 0) {
      await conn.execute(`UPDATE incident SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);
    }
    if (transition) {
      await journaliser(
        {
          auteurId: auth.user.id,
          action: "CHANGEMENT_STATUT",
          typeEntite: "INCIDENT",
          idEntite: id,
          ancienneValeur: statutActuel,
          nouvelleValeur: transition.vers,
        },
        conn
      );
    }
    if (nouvelleGravite) {
      await journaliser(
        {
          auteurId: auth.user.id,
          action: "CHANGEMENT_GRAVITE",
          typeEntite: "INCIDENT",
          idEntite: id,
          ancienneValeur: (ancien.gravite as string | null) ?? null,
          nouvelleValeur: nouvelleGravite,
        },
        conn
      );
    }
    if (commentaire) {
      await conn.execute(
        "INSERT INTO incident_commentaire (incident_id, auteur_id, texte) VALUES (?, ?, ?)",
        [id, auth.user.id, commentaire]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error("Échec de la mise à jour de l'incident :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }

  const incident = await chargerIncident(id);
  return NextResponse.json(incident);
}
