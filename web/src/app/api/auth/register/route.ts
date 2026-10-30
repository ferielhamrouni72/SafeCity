import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";

const schema = z.object({
  nom: z.string().trim().min(1).max(80),
  prenom: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(150),
  motDePasse: z.string().min(8).max(72),
  telephone: z.string().trim().max(20).optional(),
});

function erreur(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

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

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role) VALUES (?, ?, ?, ?, ?, 'CITOYEN')",
      [nom, prenom, email, hash, telephone ?? null]
    );
    return NextResponse.json({ id: result.insertId, email, role: "CITOYEN" }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") {
      return erreur(409, "EMAIL_EXISTS", "Cet e-mail est déjà utilisé");
    }
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  }
}