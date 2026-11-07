import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";
import { journaliser } from "@/lib/journal";
import { motDePasseSchema } from "@/lib/password";

const schema = z.object({
  nom: z.string().trim().min(1).max(80),
  prenom: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(150),
  motDePasse: motDePasseSchema,
  telephone: z.string().trim().max(20).optional(),
});

function erreur(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

// Inscription publique : crée TOUJOURS un compte CITOYEN, jamais un autre rôle
export async function POST(req: Request) {
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

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute<ResultSetHeader>(
      "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role) VALUES (?, ?, ?, ?, ?, 'CITOYEN')",
      [nom, prenom, email, hash, telephone ?? null]
    );
    await journaliser(
      {
        auteurId: result.insertId,
        action: "INSCRIPTION",
        typeEntite: "UTILISATEUR",
        idEntite: result.insertId,
        nouvelleValeur: "CITOYEN",
      },
      conn
    );
    await conn.commit();
    return NextResponse.json({ id: result.insertId, email, role: "CITOYEN" }, { status: 201 });
  } catch (e) {
    await conn.rollback().catch(() => {});
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      return erreur(409, "EMAIL_EXISTS", "Cet e-mail est déjà utilisé");
    }
    console.error("Échec de l'inscription :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }
}