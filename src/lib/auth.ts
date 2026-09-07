import { cookies } from 'next/headers';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'hss_admin_session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
}

// Simple signed session token
export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  })).toString('base64');
  return payload;
}

export function parseSessionToken(token: string): SessionUser | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(raw);
    if (data.exp && data.exp > Date.now()) {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function verifyLogin(email: string, passwordPlain: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });
  if (!user || !user.isActive) return null;

  const valid = bcrypt.compareSync(passwordPlain, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser['role']
  };
}
