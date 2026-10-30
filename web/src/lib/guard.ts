import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { verifyToken, type Role } from "@/lib/auth";

export type AuthUser = { id: number; role: Role };

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function requireAuth(
  req: Request,
  roles?: Role[]
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return { response: erreur(401, "UNAUTHENTICATED", "Authentification requise") };
  }

  let id: number;
  try {
    ({ id } = await verifyToken(token));
  } catch {
    return { response: erreur(401, "INVALID_TOKEN", "Token invalide ou expiré") };
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, role, actif FROM utilisateur WHERE id = ?",
    [id]
  );
  const u = rows[0];
  if (!u) return { response: erreur(401, "INVALID_TOKEN", "Token invalide ou expiré") };
  if (!u.actif) return { response: erreur(403, "ACCOUNT_SUSPENDED", "Compte suspendu") };
  if (roles && !roles.includes(u.role as Role)) {
    return { response: erreur(403, "FORBIDDEN", "Accès refusé pour ce rôle") };
  }

  return { user: { id: u.id, role: u.role as Role } };
}