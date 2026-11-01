import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { journaliser } from "@/lib/journal";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;

  await journaliser({
    auteurId: auth.user.id,
    action: "DECONNEXION",
    typeEntite: "UTILISATEUR",
    idEntite: auth.user.id,
  });
  
  return NextResponse.json({ ok: true });
}