import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";
<<<<<<< HEAD
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";
import { motDePasseSchema } from "@/lib/password";
=======
import { journaliser } from "@/lib/journal";
>>>>>>> origin/feriel

const schema = z.object({
  nom: z.string().trim().min(1).max(80),
  prenom: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(150),
<<<<<<< HEAD
  motDePasse: motDePasseSchema,
=======
  motDePasse: z.string().min(8).max(72),
>>>>>>> origin/feriel
  telephone: z.string().trim().max(20).optional(),
});

function erreur(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

<<<<<<< HEAD
// Création d'un compte AGENT : réservée à l'administrateur
export async function POST(req: Request) {
  const auth = await requireAuth(req, ["ADMINISTRATEUR"]);
  if ("response" in auth) return auth.response;

=======
export async function POST(req: Request) {
>>>>>>> origin/feriel
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return erreur(
      400,
      "VALIDATION_ERROR",
      "Données invalides",
      parsed.error.issues.map((i) => ({ champ: i.path.join("."), message: i.message }))
    );
  }

  const { nom, prenom, email, motDePasse, telephone } = parsed.data;
  const hash = await bcrypt.hash(motDePasse, 10);

<<<<<<< HEAD
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute<ResultSetHeader>(
      "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role) VALUES (?, ?, ?, ?, ?, 'AGENT')",
=======
    const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute<ResultSetHeader>(
      "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role) VALUES (?, ?, ?, ?, ?, 'CITOYEN')",
>>>>>>> origin/feriel
      [nom, prenom, email, hash, telephone ?? null]
    );
    await journaliser(
      {
<<<<<<< HEAD
        auteurId: auth.user.id, // l'administrateur qui crée le compte
        action: "CREATION_AGENT",
        typeEntite: "UTILISATEUR",
        idEntite: result.insertId,
        nouvelleValeur: "AGENT",
=======
        auteurId: result.insertId,
        action: "INSCRIPTION",
        typeEntite: "UTILISATEUR",
        idEntite: result.insertId,
        nouvelleValeur: "CITOYEN",
>>>>>>> origin/feriel
      },
      conn
    );
    await conn.commit();
<<<<<<< HEAD
    return NextResponse.json({ id: result.insertId, email, role: "AGENT" }, { status: 201 });
  } catch (e) {
    await conn.rollback().catch(() => {});
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      return erreur(409, "EMAIL_EXISTS", "Cet e-mail est déjà utilisé");
    }
    console.error("Échec de la création de l'agent :", e);
=======
    return NextResponse.json({ id: result.insertId, email, role: "CITOYEN" }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      return erreur(409, "EMAIL_EXISTS", "Cet e-mail est déjà utilisé");
    }
>>>>>>> origin/feriel
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }
<<<<<<< HEAD
}
=======

}
>>>>>>> origin/feriel
