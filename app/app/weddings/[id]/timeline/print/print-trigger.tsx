"use client";

import { Button } from "@/components/ui/button";

export function PrintTrigger() {
  return (
    <div className="print:hidden mb-4">
      <Button type="button" onClick={() => window.print()}>
        Печать / Сохранить PDF
      </Button>
    </div>
  );
}
