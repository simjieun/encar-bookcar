import "server-only";

import { headers } from "next/headers";
import { ensureDatabase } from "@/db";
import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  await ensureDatabase();

  return auth.api.getSession({
    headers: await headers(),
  });
}
