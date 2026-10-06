import { getDatabase } from '@netlify/database';
import type { User } from '@netlify/identity';
import type { Pool, PoolClient } from 'pg';

export async function withFamilyDatabase<T>(user: User, run: (client: PoolClient) => Promise<T>) {
  const pool = getDatabase().pool as Pool;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Only verified Identity app roles can change database roles; request bodies are never used.
    await client.query(
      `insert into public.profiles(id,email,display_name,role) values($1,$2,$3,$4)
       on conflict(id) do update set email=excluded.email,role=excluded.role`,
      [
        user.id,
        user.email,
        (user.name || '').slice(0, 100),
        user.roles?.includes('admin') ? 'admin' : 'parent',
      ],
    );
    await client.query("select set_config('cheverus.user_id',$1,true)", [user.id]);
    await client.query('SET LOCAL ROLE cheverus_app');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
