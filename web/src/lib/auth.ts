import { SignJWT, jwtVerify } from "jose";

export type Role = "CITOYEN" | "AGENT" | "ADMINISTRATEUR";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET manquant");
  return new TextEncoder().encode(s);
}

export async function signToken(user: { id: number; role: Role }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
  return { id: Number(payload.sub), role: payload.role as Role };
}