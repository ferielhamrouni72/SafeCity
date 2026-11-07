import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { journaliser } from "@/lib/journal";
import { envoyerLienReinitialisation } from "@/lib/mail";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// Même réponse que le compte existe ou non (on ne révèle pas quels e-mails sont inscrits)
const REPONSE = {
  message: "Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé.",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "E-mail invalide" } },
      { status: 400 }
    );
  }
  const { email } = parsed.data;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, actif FROM utilisateur WHERE email = ?",
      [email]
    );
    const user = rows[0];

    if (user && user.actif) {
      // Le lien ne doit JAMAIS être construit à partir de l'en-tête Host de la requête
      // (sinon un attaquant peut faire pointer le lien du mail vers son propre site).
      const base = process.env.APP_URL?.replace(/\/+$/, "");
      if (!base) {
        console.error("APP_URL manquant : aucun lien de réinitialisation envoyé.");
        return NextResponse.json(REPONSE);
      }

      const token = randomBytes(32).toString("hex"); // 64 caractères
      const hash = createHash("sha256").update(token).digest("hex");

      // Les anciens liens non utilisés deviennent invalides
      await pool.execute(
        "UPDATE reinitialisation_mdp SET utilise = 1 WHERE utilisateur_id = ? AND utilise = 0",
        [user.id]
      );
      await pool.execute(
        "INSERT INTO reinitialisation_mdp (utilisateur_id, token_hash, expire_le) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
        [user.id, hash]
      );
      await journaliser({
        auteurId: user.id,
        action: "DEMANDE_REINITIALISATION",
        typeEntite: "UTILISATEUR",
        idEntite: user.id,
      });

      try {
        await envoyerLienReinitialisation(email, `${base}/reinitialiser-mot-de-passe?token=${token}`);
      } catch (e) {
        console.error("Échec d'envoi de l'e-mail :", e);
      }
    }
  } catch (e) {
    // Erreur base de données : on ne révèle rien non plus
    console.error("Échec de la demande de réinitialisation :", e);
  }

  return NextResponse.json(REPONSE);
}
