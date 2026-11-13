import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";
import { MAX_PHOTO_BYTES, UPLOAD_DIR, detecterTypeImage } from "@/lib/photos";

const MAX_SIGNALEMENTS_PAR_HEURE = 10;

const TITRES: Record<string, string> = {
  ACCIDENT: "Accident",
  INCENDIE: "Incendie",
  INONDATION: "Inondation",
  FUITE_EAU: "Fuite d'eau",
  ARBRE_TOMBE: "Arbre tombé",
  NID_DE_POULE: "Nid-de-poule",
  INFRASTRUCTURE: "Infrastructure endommagée",
  AUTRE: "Signalement citoyen",
};

function erreur(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function nombre(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Création d'un signalement par un citoyen (multipart/form-data)
// Champs : latitude, longitude (obligatoires), type, titre, description, photo (facultative)
export async function POST(req: Request) {
  const auth = await requireAuth(req, ["CITOYEN"]);
  if ("response" in auth) return auth.response;

  const annonce = Number(req.headers.get("content-length") ?? 0);
  if (annonce > MAX_PHOTO_BYTES + 512 * 1024) {
    return erreur(413, "FILE_TOO_LARGE", "Photo trop volumineuse (5 Mo maximum)");
  }

  const [cnt] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM incident WHERE citoyen_id = ? AND date_creation > (NOW() - INTERVAL 1 HOUR)",
    [auth.user.id]
  );
  if (Number(cnt[0].n) >= MAX_SIGNALEMENTS_PAR_HEURE) {
    return erreur(429, "TOO_MANY_UPLOADS", "Trop de signalements. Réessayez plus tard.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return erreur(400, "VALIDATION_ERROR", "Requête invalide (multipart attendu)");
  }

  const latitude = nombre(form.get("latitude"));
  const longitude = nombre(form.get("longitude"));
  if (
    latitude === null || longitude === null ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  ) {
    return erreur(400, "VALIDATION_ERROR", "Position GPS manquante ou invalide");
  }

  const typeBrut = String(form.get("type") ?? "AUTRE");
  const type = typeBrut in TITRES ? typeBrut : "AUTRE";
  const titreSaisi = String(form.get("titre") ?? "").trim().slice(0, 120);
  const titre = titreSaisi || TITRES[type];
  const description = String(form.get("description") ?? "").trim().slice(0, 1000) || null;

  // Photo facultative, mais si elle est présente elle est vérifiée comme dans /api/photos
  let octets: Uint8Array | null = null;
  let typeImage: { mime: string; ext: string } | null = null;
  const fichier = form.get("photo");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > MAX_PHOTO_BYTES) {
      return erreur(413, "FILE_TOO_LARGE", "Photo trop volumineuse (5 Mo maximum)");
    }
    octets = new Uint8Array(await fichier.arrayBuffer());
    typeImage = detecterTypeImage(octets);
    if (!typeImage) {
      return erreur(415, "UNSUPPORTED_TYPE", "Format non supporté (JPEG, PNG ou WebP)");
    }
  }

  let chemin: string | null = null;
  let nomFichier: string | null = null;
  if (octets && typeImage) {
    nomFichier = `${randomUUID()}.${typeImage.ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    chemin = path.join(UPLOAD_DIR, nomFichier);
    await writeFile(chemin, octets, { flag: "wx" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [inc] = await conn.execute<ResultSetHeader>(
      `INSERT INTO incident (titre, type, description, latitude, longitude, citoyen_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titre, type, description, latitude, longitude, auth.user.id]
    );
    if (nomFichier && typeImage && octets) {
      await conn.execute(
        `INSERT INTO photo (utilisateur_id, incident_id, nom_fichier, type_mime, taille)
         VALUES (?, ?, ?, ?, ?)`,
        [auth.user.id, inc.insertId, nomFichier, typeImage.mime, octets.length]
      );
    }
    await journaliser(
      {
        auteurId: auth.user.id,
        action: "CREATION_INCIDENT",
        typeEntite: "INCIDENT",
        idEntite: inc.insertId,
        nouvelleValeur: type,
      },
      conn
    );
    await conn.commit();
    return NextResponse.json(
      { id: inc.insertId, titre, type, latitude, longitude },
      { status: 201 }
    );
  } catch (e) {
    await conn.rollback().catch(() => {});
    if (chemin) await unlink(chemin).catch(() => {});
    console.error("Échec de la création du signalement :", e);
    return erreur(500, "SERVER_ERROR", "Erreur interne");
  } finally {
    conn.release();
  }
}
