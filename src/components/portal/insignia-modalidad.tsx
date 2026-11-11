import { FileText, Globe, Store } from "lucide-react";
import type { Modalidad } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { MODALIDADES } from "@/lib/constantes";

const ICONOS = { VENTANILLA: Store, EN_LINEA: Globe, CON_FORMATO: FileText } as const;

export function InsigniaModalidad({ modalidad }: { modalidad: Modalidad | null }) {
  if (!modalidad) return null;
  const Icono = ICONOS[modalidad];
  return (
    <Badge variant="outline" className="font-medium text-muted-foreground" title={MODALIDADES[modalidad].descripcion}>
      <Icono aria-hidden="true" />
      <span className="sr-only">Modalidad oficial: </span>
      {MODALIDADES[modalidad].etiqueta}
    </Badge>
  );
}
