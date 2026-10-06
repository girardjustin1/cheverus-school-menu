import { buildMailto } from './generateEmail';

export interface EmailAction {
  recipient: string;
  subject: string;
  body: string;
}

export async function copyEmail(text: string) {
  await navigator.clipboard.writeText(text);
}

export function openEmail(email: EmailAction) {
  window.location.href = buildMailto(email.recipient, email.subject, email.body);
}
