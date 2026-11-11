import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormularioAccion } from "@/components/panel/formulario-accion";
import { alcance, requerirUsuario } from "@/lib/auth/sesion";
import { prioridades } from "@/lib/consultas/panel";
import { prisma } from "@/lib/prisma";
import { formatearPromedio } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nueva acción de mejora" };

export default async function NuevaAccion({ searchParams }: PageProps<"/panel/acciones/nueva">) {
  const usuario = await requerirUsuario();
  const sp = await searchParams;
  const filtro = alcance(usuario);
  const esAdmin = usuario.rol === "ADMINISTRADOR";

  const [dependencias, tramites, pistas] = await Promise.all([
    esAdmin ? prisma.dependencia.findMany({ where: { activa: true }, orderBy: { orden: "asc" }, select: { id: true, nombreCorto: true } }) : [],
    prisma.tramite.findMany({
      where: { activo: true, ...filtro },
      orderBy: [{ dependenciaId: "asc" }, { orden: "asc" }],
      select: { id: true, nombre: true, dependenciaId: true },
    }),
    prioridades(filtro, 20),
  ]);
  const tramiteInicial = typeof sp.tramite === "string" && tramites.some((t) => t.id === sp.tramite) ? sp.tramite : "";
  const pista = pistas.find((p) => p.tramiteId === tramiteInicial);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/panel/acciones" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden="true" /> Acciones de mejora
      </Link>
      <header>
        <h1 className="text-4xl font-semibold text-navy">Nueva acción de mejora</h1>
        <p className="mt-2 text-muted-foreground">
          Describe qué se hará y para cuándo. Al guardarla queda pendiente de validación por otra persona.
        </p>
      </header>

      {pista && (
        <div className="rounded-[1.5rem] border border-orange/30 bg-orange-soft p-5 text-sm text-navy">
          <p className="font-semibold">Lo que dicen los datos de este trámite</p>
          <ul className="mt-2 space-y-1">
            <li>Satisfacción general: {formatearPromedio(pista.satisfaccion)} de 5 ({pista.total} evaluaciones).</li>
            {pista.peorAspecto && (
              <li>
                Lo que más falla: {pista.peorAspecto.titulo.toLowerCase()} ({formatearPromedio(pista.peorAspecto.valor)}).
              </li>
            )}
            {pista.problema && <li>Problema más reportado: {pista.problema.etiqueta.toLowerCase()}.</li>}
          </ul>
        </div>
      )}

      <FormularioAccion
        dependencias={dependencias}
        tramites={tramites}
        tramiteInicial={tramiteInicial}
        tituloSugerido={pista?.problema ? `Atender: ${pista.problema.etiqueta.toLowerCase()}` : ""}
      />
    </div>
  );
}
