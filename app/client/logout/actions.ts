"use server";

import { redirect } from "next/navigation";
import { clearClientSessionCookie } from "@/lib/auth/client-session";

export async function clientLogoutAction() {
  await clearClientSessionCookie();
  redirect("/");
}
