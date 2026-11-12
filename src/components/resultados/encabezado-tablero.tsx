import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Indicador, formatearPorcentaje } from "@/components/resultados/graficas";
import type { Detalle } from "@/lib/consultas/resultados";
import { cn, formatearEntero, formatearPromedio } from "@/lib/utils";

type Opcion = { slug: string; nombreCorto: string };

function Variacion({ valor }: { valor: number | null }) {
  if (valor == null) return null;
  const igual = Math.abs(valor) < 0.05;
  const Icono = igual ? Minus : valor > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold", igual ? "text-white/60" : valor > 0 ? "text-[#7fd99a]" : "text-[#ff9a8f]")}>
      <Icono className="size-3.5" aria-hidden="true" />
      {igual ? "igual al municipio" : `${valor > 0 ? "+" : ""}${formatearPromedio(valor)} vs. municipio`}
    </span>
  );
}

/** Franja oscura del tablero: migas, filtro por dependencia (una sola fila, arriba) e indicadores clave. */
export function EncabezadoTablero({
  titulo,
  descripcion,
  opciones,
  activo,
  detalle,
  referencia,
}: {
  titulo: string;
  descripcion: string;
  opciones: Opcion[];
  activo: string | null;
  detalle: Detalle;
  /** Detalle del municipio completo, para mostrar la diferencia cuando se ve una dependencia. */
  referencia?: Detalle;
}) {
  const todoDemo = detalle.total > 0 && detalle.totalDemo === detalle.total;
  const delta =
    referencia && detalle.promedios.satisfaccion != null && referencia.promedios.satisfaccion != null
      ? detalle.promedios.satisfaccion - referencia.promedios.satisfaccion
      : null;

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#041f24_0%,#06363b_100%)] text-white">
      <div className="rejilla pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pb-12">
        <nav aria-label="Ruta de navegación">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-white/60">
            <li>
              <Link href="/" className="hover:text-white hover:underline">
                Inicio
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden="true" />
              {activo ? (
                <Link href="/resultados" className="hover:text-white hover:underline">
                  Resultados
                </Link>
              ) : (
                <span aria-current="page" className="text-white">
                  Resultados
                </span>
              )}
            </li>
            {activo && (
              <li className="flex items-center gap-1">
                <ChevronRight className="size-3.5" aria-hidden="true" />
                <span aria-current="page" className="text-white">
                  {opciones.find((o) => o.slug === activo)?.nombreCorto}
                </span>
              </li>
            )}
          </ol>
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-[1.02] sm:text-5xl">{titulo}</h1>
            <p className="mt-3 text-white/65">{descripcion}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {detalle.totalDemo > 0 && (
              <Badge variant="demo" className="border-primary/40 bg-orange/10 text-orange">
                {todoDemo ? "Datos demostrativos" : `Incluye ${formatearEntero(detalle.totalDemo)} demostrativas`}
              </Badge>
            )}
          </div>
        </div>

        {/* Filtro: una fila, arriba de todas las gráficas */}
        <nav aria-label="Filtrar por dependencia" className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="material-vidrio flex w-max gap-1 rounded-full p-1">
            {[{ slug: null, nombreCorto: "Todo el municipio" }, ...opciones].map((o) => {
              const actual = o.slug === activo;
              return (
                <li key={o.slug ?? "todas"}>
                  <Link
                    href={o.slug ? `/resultados/${o.slug}` : "/resultados"}
                    aria-current={actual ? "page" : undefined}
                    className={cn(
                      "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      actual ? "bg-white text-navy shadow-[0_2px_8px_rgb(0_0_0/0.25)]" : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {o.nombreCorto}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador className="material-vidrio rounded-2xl p-4 sm:p-5" tono="oscuro" etiqueta="evaluaciones recibidas" valor={formatearEntero(detalle.total)} />
          <Indicador
            className="material-vidrio rounded-2xl p-4 sm:p-5"
            tono="oscuro"
            etiqueta="satisfacción general"
            valor={formatearPromedio(detalle.promedios.satisfaccion)}
            unidad="/5"
            detalle={referencia ? <Variacion valor={delta} /> : undefined}
          />
          <Indicador
            className="material-vidrio rounded-2xl p-4 sm:p-5"
            tono="oscuro"
            etiqueta="calificó 4 o 5 estrellas"
            valor={formatearPorcentaje(detalle.satisfechos)}
          />
          <Indicador
            className="material-vidrio rounded-2xl p-4 sm:p-5"
            tono="oscuro"
            etiqueta="reportó que le pidieron un pago no oficial"
            valor={formatearPorcentaje(detalle.pagoIndebido)}
            detalle={`de ${formatearEntero(detalle.respondieronPago)} que respondieron`}
          />
        </dl>
      </div>
    </div>
  );
}
