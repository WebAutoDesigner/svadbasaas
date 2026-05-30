"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleAgencyActiveAction } from "./actions";

type Props = {
  id: string;
  name: string;
  isActive: boolean;
  membersCount: number;
  createdAt: string;
};

export function AgencyRow({ id, name, isActive, membersCount, createdAt }: Props) {
  const [pending, start] = useTransition();
  const dateStr = new Date(createdAt).toLocaleDateString("ru-RU");

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">
          {membersCount} участн. · с {dateStr} ·{" "}
          {isActive ? (
            <span className="text-green-600">активно</span>
          ) : (
            <span className="text-red-600">заблокировано</span>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant={isActive ? "destructive" : "default"}
        size="sm"
        disabled={pending}
        onClick={() => start(() => toggleAgencyActiveAction(id, !isActive))}
      >
        {pending ? "..." : isActive ? "Заблокировать" : "Активировать"}
      </Button>
    </div>
  );
}
