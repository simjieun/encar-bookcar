"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    setIsPending(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      className="profile-logout"
      type="button"
      onClick={logout}
      disabled={isPending}
    >
      <LogOut size={18} aria-hidden="true" />
      {isPending ? "로그아웃 중" : "로그아웃"}
    </button>
  );
}
