import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, type DbUser } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "shopyland-secret-key-change-in-production-2026"
);

const COOKIE_NAME = "shopyland_session";

export async function createSession(user: DbUser): Promise<string> {
  const jwt = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    storeName: user.storeName,
    avatar: user.avatar,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return jwt;
}

export async function getSession(): Promise<DbUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "customer" | "shopkeeper",
      storeName: payload.storeName as string | undefined,
      avatar: payload.avatar as string | undefined,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
