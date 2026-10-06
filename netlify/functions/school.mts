import type { Config, Context } from '@netlify/functions';
import { getUser, verifyRequestOrigin, AuthError } from '@netlify/identity';
import { ZodError } from 'zod';
import { withFamilyDatabase } from './_shared/database';
import { ApiError, schoolOperation } from './_shared/school';

export default async (req: Request, context: Context) => {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  try {
    if (req.method !== 'GET' && req.method !== 'POST')
      throw new ApiError('Method not allowed.', 405);
    if (req.method === 'POST') {
      verifyRequestOrigin(req);
      if (!req.headers.get('content-type')?.startsWith('application/json'))
        throw new ApiError('Send JSON.', 415);
    }
    const user = await getUser();
    if (!user?.email || !user.confirmedAt)
      throw new ApiError('Please sign in to your confirmed account.', 401);
    let body: unknown;
    if (req.method === 'POST') {
      const text = await req.text();
      if (new TextEncoder().encode(text).byteLength > 1_000_000)
        throw new ApiError('Request is too large.', 413);
      try {
        body = JSON.parse(text);
      } catch {
        throw new ApiError('Invalid JSON.');
      }
    }
    const result = await withFamilyDatabase(user, (client) =>
      schoolOperation(client, user.id, context.params.resource, req.method, body),
    );
    return Response.json(result, { headers });
  } catch (error) {
    if (error instanceof ApiError || error instanceof AuthError)
      return Response.json({ error: error.message }, { status: error.status || 401, headers });
    if (error instanceof ZodError)
      return Response.json(
        { error: error.issues[0]?.message || 'Invalid input.' },
        { status: 400, headers },
      );
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : '';
    if (code === '42501' || /Administrator|Child not found/.test(message))
      return Response.json(
        { error: 'You do not have access to that record.' },
        { status: 403, headers },
      );
    if (code?.startsWith('23') || code === 'P0001')
      return Response.json(
        {
          error:
            code === 'P0001'
              ? message
              : 'These choices could not be saved. Check the child, date, and available options.',
        },
        { status: 400, headers },
      );
    console.error('School API failed', {
      requestId: context.requestId,
      code: code || 'unavailable',
    });
    return Response.json(
      { error: 'Could not reach your saved plans. Please try again.' },
      { status: 503, headers },
    );
  }
};

export const config: Config = { path: '/api/school/:resource' };
