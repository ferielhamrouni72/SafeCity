import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { UPLOAD_DIR } from "@/lib/photos";

function introuvable() {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "Photo introuvable" } },
    { status: 404 }
  );
}

// Lecture d'une photo : son auteur, ou un agent / administrateur
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const photoId = Number(id);
  if (!Number.isInteger(photoId) || photoId <= 0) return introuvable();

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT utilisateur_id, nom_fichier, type_mime FROM photo WHERE id = ?",
    [photoId]
  );
  const photo = rows[0];
  if (!photo) return introuvable();

  // Un citoyen ne voit que ses propres photos (404 plutôt que 403 : on ne révèle pas leur existence)
  if (auth.user.role === "CITOYEN" && photo.utilisateur_id !== auth.user.id) {
    return introuvable();
  }

  // path.basename : protection contre toute tentative de sortir du dossier
  const contenu = await readFile(
    path.join(UPLOAD_DIR, path.basename(photo.nom_fichier))
  ).catch(() => null);
  if (!contenu) return introuvable();

  return new Response(new Uint8Array(contenu), {
    headers: {
      "Content-Type": photo.type_mime,
      "Content-Length": String(contenu.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
