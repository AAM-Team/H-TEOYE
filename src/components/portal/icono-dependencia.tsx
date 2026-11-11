import { Building2, Droplets, HeartHandshake, Landmark, TrafficCone, type LucideIcon } from "lucide-react";

const ICONOS: Record<string, LucideIcon> = {
  "tesoreria-municipal": Landmark,
  "agua-de-hermosillo": Droplets,
  "ordenamiento-y-desarrollo-urbano": Building2,
  "seguridad-publica-transito": TrafficCone,
  "dif-hermosillo": HeartHandshake,
};

/** Ícono representativo de cada dependencia (decorativo). */
export function IconoDependencia({ slug, className }: { slug: string; className?: string }) {
  const Icono = ICONOS[slug] ?? Building2;
  return <Icono className={className} aria-hidden="true" />;
}
