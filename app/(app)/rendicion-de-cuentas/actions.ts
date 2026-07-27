"use server";

import { getSessionContext } from "@/lib/session";
import { sendAccountabilityReminder } from "@/lib/email";

export async function sendReminder(emails: string[], weekLabel: string) {
  const { employee } = await getSessionContext();
  return sendAccountabilityReminder({ to: emails, weekLabel, leaderName: employee.name });
}
