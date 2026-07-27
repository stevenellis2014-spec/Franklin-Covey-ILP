import "server-only";
import { Resend } from "resend";

// Usa el dominio de pruebas de Resend hasta que se verifique un dominio propio
// (Resend → Domains → Add Domain) y se pueda enviar desde una dirección @ilpsa.com.
const FROM_ADDRESS = "Franklin Covey ILP <onboarding@resend.dev>";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendAccountabilityReminder({
  to,
  weekLabel,
  leaderName,
}: {
  to: string[];
  weekLabel: string;
  leaderName: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    return { error: "RESEND_API_KEY no está configurada. Agrega tu API key en .env.local para enviar correos reales." };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Recordatorio: Rendición de Cuentas Semanal — ${weekLabel}`,
    html: `
      <p>Hola,</p>
      <p>Te recuerdo ingresar a Franklin Covey ILP y enviar tu Rendición de Cuentas Semanal (${weekLabel}): tus actividades de la semana y tus compromisos para la próxima semana.</p>
      <p>Gracias,<br>${leaderName}</p>
    `,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
