// Edge-runtime safe session helpers (used by middleware.ts).
// Only depends on `jose`, never on bcryptjs / next/headers.

import { jwtVerify } from "jose";

export const SESSION_COOKIE = "os_sched_session";

export interface EdgeSession {
  uid: string;
  username: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return new Uint8Array(0);
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(
  token: string | undefined
): Promise<EdgeSession | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret.length) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { uid: payload.uid, username: payload.username };
  } catch {
    return null;
  }
}
