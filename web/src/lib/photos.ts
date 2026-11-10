import path from "node:path";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MAX_PHOTOS_PAR_HEURE = 10;

// Dossier de stockage (hors de /public : une photo n'est jamais accessible sans authentification)
export const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads", "photos")
);

export type TypeImage = { mime: string; ext: string };

// On identifie le vrai format d'après les premiers octets du fichier,
// jamais d'après le nom ou le type envoyé par le client (falsifiable).
export function detecterTypeImage(b: Uint8Array): TypeImage | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((v, i) => b[i] === v)) {
    return { mime: "image/png", ext: "png" };
  }
  // WebP : "RIFF" .... "WEBP"
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
