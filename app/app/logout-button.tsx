"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await authClient.signOut();
          router.push("/login");
          router.refresh();
        })
      }
    >
      Выйти
    </Button>
  );
}
