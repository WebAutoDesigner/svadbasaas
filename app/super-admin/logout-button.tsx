"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { logoutSuperAdminAction } from "./logout-action";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => logoutSuperAdminAction())}
    >
      Выйти
    </Button>
  );
}
