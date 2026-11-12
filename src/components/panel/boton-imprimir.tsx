"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BotonImprimir() {
  return (
    <Button type="button" onClick={() => window.print()} className="rounded-full">
      <Printer aria-hidden="true" /> Imprimir o guardar como PDF
    </Button>
  );
}
