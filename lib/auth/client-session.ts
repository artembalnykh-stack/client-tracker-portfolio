import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientSessionSecret } from "@/lib/env.server";
import {
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_TTL_DAYS,
} from "@/lib/constants";

export type ClientSession = {
  id: string;
  name: string;
  company: string | null;
};

function secretKey(): Uint8Array {
  return new TextEncoder().encode(clientSessionSecret());
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function signClientSession(
  clientId: string,
  version: number,
): Promise<string> {
  return new SignJWT({ clientId, v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CLIENT_SESSION_TTL_DAYS}d`)
    .sign(secretKey());
}

export async function setClientSessionCookie(
  clientId: string,
  version: number,
): Promise<void> {
  const token = await signClientSession(clientId, version);
  const store = await cookies();
  store.set(
    CLIENT_SESSION_COOKIE,
    token,
    cookieOptions(CLIENT_SESSION_TTL_DAYS * 24 * 60 * 60),
  );
}

export async function clearClientSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, "", cookieOptions(0));
}

async function readClientSession(): Promise<ClientSession | null> {
  const store = await cookies();
  const token = store.get(CLIENT_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });

    const clientId =
      typeof payload.clientId === "string" ? payload.clientId : null;
    const version = typeof payload.v === "number" ? payload.v : null;
    if (!clientId || version === null) return null;

    const admin = createAdminClient();
    const { data: client } = await admin
      .from("clients")
      .select("id, name, company, session_version, is_demo")
      .eq("id", clientId)
      .maybeSingle();

    if (!client || client.is_demo) return null;
    if (client.session_version !== version) return null;

    return { id: client.id, name: client.name, company: client.company };
  } catch {
    return null;
  }
}

/** Cached per request: layout and page read the session once. */
export const getClientSession = cache(readClientSession);
