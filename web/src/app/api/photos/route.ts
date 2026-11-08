import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PAR_HEURE,
  UPLOAD_DIR,
  detecterTypeImage,
} from "@/lib/photos";

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Envoi d'une photo par un citoyen (multipart/form-data, champ "photo")
export async function POST(req: Request) {
  const auth = await requireAuth(req, ["CITOYEN"]);
  if ("response" in auth) return auth.response;

  // Refus rapide des envois énormes, avant de lire le corps de la requête
  const annonce = Number(req.headers.get("content-length") ?? 0);
  if (annonce > MAX_PHOTO_BYTES + 512 * 1024) {
    return erreur(413, "FILE_TOO_LARGE", "Photo trop volumineuse (5 Mo maximum)");
  }

  // Limite par heure : protège le disque du serveur
  const [cnt] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM photo WHERE utilisateur_id = ? AND date_creation > (NOW() - INTERVAL 1 HOUR)",
    [auth.user.id]
  );
  if (Number(cnt[0].n) >= MAX_PHOTOS_PAR_HEURE) {
    return erreur(429, "TOO_MANY_UPLOADS", "Trop d'envois. Réessayez plus tard.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return erreur(400, "VALIDATION_ERROR", "Requête invalide (multipart attendu)");
  }

  const fichier = form.get("photo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return erreur(400, "VALIDATION_ERROR", "Champ « photo » manquant ou vide");
  }
  if (fichier.size > MAX_PHOTO_BYTES) {
    return erreur(413, "FILE_TOO_LARGE", "Photo trop volumineuse (5 Mo maximum)");
  }

  const octets = new Uint8Array(await fichier.arrayBuffer());
  const type = detecterTypeImage(octets);
  if (!type) {
    return erreur(415, "UNSUPPORTED_TYPE", "Format non supporté (JPEG, PNG ou WebP)");
  }

  // Nom choisi par le serveur : on n'utilise JAMAIS le nom envoyé par le client
  const nomFichier = `${randomUUID()}.${type.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const chemin = path.join(UPLOAD_DIR, nomFichier);
  await writeFile(chemin, octets, { flag: "wx" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute<ResultSetHeader>(
      "INSERT INTO photo (utilisateur_id, nom_fichier, type_mime, taille) VALUES (?, ?, ?, ?)",
      [auth.user.id, nomFichier, type.mime, octets.length]
    );
    await journaliser(
      {
        auteurId: auth.user.id,
        action: "ENVOI_PHOTO",
        typeEntite: "PHOTO",
        idEntite: r.insertId,
        nouvelleValeur: type.mime,
      },
      conn
    );
    await conn.commit();
    return NextResponse.json(
      {
        id: r.insertId,
        url: `/api/photos/${r.insertId}`,
        typeMime: type.mime,
        taille: octets.length,
      },
      { status: 201 }
    );
  } catch (e) {
    await conn.rollback().catch(() => {});
    await unlink(chemin).catch(() => {}); // pas de fichier orphelin
    console.error("Échec de l'enregistrement de la photo :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }
}
