"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { coupleLogoutAction } from "./logout-action";

export function CoupleLogout() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => coupleLogoutAction())}
    >
      Выйти
    </Button>
  );
}
