import type { EmailAction } from '../../src/features/email/actions';

export const prototypeEmailEvent = 'cheverus.prototype.email';

export function openEmail(email: EmailAction) {
  window.dispatchEvent(new CustomEvent(prototypeEmailEvent, { detail: email }));
}

export async function copyEmail(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  Object.assign(field.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    opacity: '0',
    fontSize: '16px',
  });
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, field.value.length);
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) {
    openEmail({ recipient: '', subject: 'Select this text to copy', body: text });
    throw new Error(
      'Your browser could not copy automatically. Select the text in the preview to copy it.',
    );
  }
}
