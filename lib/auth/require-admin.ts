import "server-only";

import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getCurrentAdmin = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
