import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Админка — Neyroflow",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AdminShell email={user.email ?? "admin"}>{children}</AdminShell>;
}
