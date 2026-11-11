import type { Metadata } from "next";
import { requerirUsuario } from "@/lib/auth/sesion";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bitácora" };

const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const ACCIONES: Record<string, string> = {
  "sesion.iniciar": "Inició sesión",
  "sesion.cerrar": "Cerró sesión",
  "comentario.aprobar": "Aprobó un comentario",
  "comentario.rechazar": "Rechazó un comentario",
  "accion.crear": "Registró una acción de mejora",
  "accion.estado": "Cambió el estado de una acción",
  "accion.validar": "Validó una acción",
  "accion.publicar": "Publicó una acción",
  "accion.despublicar": "Retiró una acción del portal",
  "catalogo.importar": "Importó el catálogo",
};

export default async function BitacoraPanel() {
  await requerirUsuario(["ADMINISTRADOR"]);
  const registros = await prisma.bitacora.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, accion: true, entidad: true, entidadId: true, createdAt: true, usuario: { select: { nombre: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-4xl font-semibold text-navy">Bitácora</h1>
        <p className="mt-2 text-muted-foreground">Los últimos 100 movimientos del panel. Nada se borra de aquí.</p>
      </header>
      <div className="overflow-x-auto rounded-[1.5rem] border border-border/70 bg-card">
        <table className="w-full min-w-[600px] text-sm">
          <caption className="sr-only">Movimientos recientes del panel</caption>
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-semibold">
                Fecha
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Persona
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Movimiento
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Registro
              </th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="tabular whitespace-nowrap px-5 py-3 text-muted-foreground">{fecha.format(r.createdAt)}</td>
                <td className="px-5 py-3 font-medium text-navy">{r.usuario?.nombre ?? "Sistema"}</td>
                <td className="px-5 py-3 text-navy">{ACCIONES[r.accion] ?? r.accion}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {r.entidad}
                  {r.entidadId ? ` · ${r.entidadId.slice(-6)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
