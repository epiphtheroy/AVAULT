"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="text-white/60 hover:text-white"
    >
      Log out
    </button>
  );
}
