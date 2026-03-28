import { db, sessionsTable } from "../db";
import { sql } from "drizzle-orm";

export interface UserInfo {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
}

// Cache user info by ID to avoid repeated DB queries
const userCache = new Map<string, UserInfo>();

export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  // Query sessions table for any session belonging to this user
  // Sessions store user data in sess JSON column: { user: { id, username, ... } }
  const result = await db.execute(
    sql`SELECT sess FROM sessions WHERE sess->>'user' IS NOT NULL AND sess->'user'->>'id' = ${userId} LIMIT 1`
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as { sess: unknown };
  const sess = (typeof row.sess === 'string' ? JSON.parse(row.sess) : row.sess) as { user?: UserInfo };
  
  if (!sess?.user?.id) return null;

  const info: UserInfo = {
    id: sess.user.id,
    username: sess.user.username || sess.user.id,
    firstName: sess.user.firstName || null,
    lastName: sess.user.lastName || null,
    profileImage: sess.user.profileImage || null,
  };

  userCache.set(userId, info);
  return info;
}

export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}
