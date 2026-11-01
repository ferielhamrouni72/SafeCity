import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { journaliser } from "@/lib/journal";

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  motDePasse: z.string().min(8).max(72),
});

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return erreur(400, "VALIDATION_ERROR", "Données invalides");
  }
  const { token, motDePasse } = parsed.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const hash = await bcrypt.hash(motDePasse, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Jeton valable : non utilisé et non expiré (verrouillé pour éviter une double utilisation)
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT id, utilisateur_id FROM reinitialisation_mdp
       WHERE token_hash = ? AND utilise = 0 AND expire_le > NOW() FOR UPDATE`,
      [tokenHash]
    );
    const jeton = rows[0];
    if (!jeton) {
      await conn.rollback();
      return erreur(400, "INVALID_TOKEN", "Lien invalide ou expiré");
    }

    await conn.execute("UPDATE utilisateur SET mot_de_passe = ? WHERE id = ?", [
      hash,
      jeton.utilisateur_id,
    ]);
    await conn.execute(
      "UPDATE reinitialisation_mdp SET utilise = 1 WHERE utilisateur_id = ? AND utilise = 0",
      [jeton.utilisateur_id]
    );
    await journaliser(
      {
        auteurId: jeton.utilisateur_id,
        action: "REINITIALISATION_MDP",
        typeEntite: "UTILISATEUR",
        idEntite: jeton.utilisateur_id,
      },
      conn
    );

    await conn.commit();
    return NextResponse.json({ message: "Mot de passe modifié." });
  } catch (e) {
    await conn.rollback();
    console.error("Échec de la réinitialisation :", e);
    return erreur(500, "SERVER_ERROR", "Erreur serveur");
  } finally {
    conn.release();
  }
}