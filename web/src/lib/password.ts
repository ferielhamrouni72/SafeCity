import { z } from "zod";

// bcrypt ne lit que les 72 premiers OCTETS : on compte donc en octets (pas en caractères),
// sinon un mot de passe avec accents ou emojis serait tronqué sans avertissement.
export const motDePasseSchema = z
  .string()
  .min(8)
  .refine((s) => Buffer.byteLength(s, "utf8") <= 72, {
    message: "Mot de passe trop long (72 octets max)",
  });
