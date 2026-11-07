import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { signToken, type Role } from "@/lib/auth";
import { journaliser } from "@/lib/journal";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  motDePasse: z.string().min(1).max(72),
});

const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return erreur(400, "VALIDATION_ERROR", "Données invalides");
  }
  const { email, motDePasse } = parsed.data;

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, nom, prenom, email, mot_de_passe, actif, role FROM utilisateur WHERE email = ?",
    [email]
  );
  const user = rows[0];

  const ok = await bcrypt.compare(motDePasse, user?.mot_de_passe ?? DUMMY_HASH);
    if (!user || !ok) {
    if (user) {
      await journaliser({
        auteurId: user.id,
        action: "ECHEC_CONNEXION",
        typeEntite: "UTILISATEUR",
        idEntite: user.id,
      });
    }
    return erreur(401, "INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect");
  }
  if (!user.actif) {
    return erreur(403, "ACCOUNT_SUSPENDED", "Compte suspendu");
  }

  await journaliser({
    auteurId: user.id,
    action: "CONNEXION",
    typeEntite: "UTILISATEUR",
    idEntite: user.id,
  });
  const token = await signToken({ id: user.id, role: user.role as Role });
  return NextResponse.json({
    token,
    utilisateur: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role },
  });
}

