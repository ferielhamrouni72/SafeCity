import nodemailer from "nodemailer";

const echapper = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function envoyerLienReinitialisation(destinataire: string, lien: string) {
  // Sans configuration SMTP (développement), le lien s'affiche dans le terminal
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] Lien de réinitialisation pour ${destinataire} : ${lien}`);
    return;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL direct ; 587/2525 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const href = echapper(lien);
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "SafeCity <no-reply@safecity.tn>",
    to: destinataire,
    subject: "SafeCity : réinitialisation de votre mot de passe",
    text: `Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) : ${lien}\n\nSi vous n'avez pas fait cette demande, ignorez ce message.`,
    html: `<p>Pour choisir un nouveau mot de passe, cliquez ici (valable 1 heure) :</p><p><a href="${href}">${href}</a></p><p>Si vous n'avez pas fait cette demande, ignorez ce message.</p>`,
  });
}