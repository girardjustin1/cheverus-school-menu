import { getUser, refreshSession } from '@netlify/identity';

export const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true';

export async function schoolApi<T>(resource: string, body?: unknown): Promise<T> {
  await getUser();
  await refreshSession();
  const response = await fetch(`/api/school/${resource}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(result?.error || 'Could not reach your saved plans. Please try again.');
  return result as T;
}
