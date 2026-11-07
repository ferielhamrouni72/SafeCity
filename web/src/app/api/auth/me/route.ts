import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  return NextResponse.json(auth.user);
}