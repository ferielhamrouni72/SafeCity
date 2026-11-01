const KEY = "safecity_session";

export type Session = {
  token: string;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: "CITOYEN" | "AGENT" | "ADMINISTRATEUR";
  };
};

export function saveSession(s: Session) {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try { sessionStorage.removeItem(KEY); } catch {}
}