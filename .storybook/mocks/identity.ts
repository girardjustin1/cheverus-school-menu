// Storybook-only authentication feedback. These functions never contact Identity.
export const prototypeLoginEvent = 'cheverus.prototype.login';
export async function getSettings() {
  return { disableSignup: false };
}
export async function login() {
  window.dispatchEvent(new Event(prototypeLoginEvent));
}
export async function signup() {
  return { confirmedAt: undefined };
}
export async function requestPasswordRecovery() {}
export async function updateUser() {}
export async function acceptInvite() {
  window.dispatchEvent(new Event(prototypeLoginEvent));
}
export async function getUser() {
  return null;
}
export async function refreshSession() {}
export async function handleAuthCallback() {
  return null;
}
export async function logout() {}
export function onAuthChange() {
  return () => {};
}
