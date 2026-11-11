import type { Metadata } from "next";
import Link from "next/link";
import { Check, Info, ShieldCheck, X } from "lucide-react";
import { moderarComentario } from "@/app/panel/(interno)/acciones-servidor";
import { InsigniaVeredicto } from "@/components/resultados/ranking";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { alcance, puedeModerar, requerirUsuario } from "@/lib/auth/sesion";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comentarios" };

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });
const PESTANAS = [
  { valor: "PENDIENTE", t: "Por revisar" },
  { valor: "APROBADO", t: "Aprobados" },
  { valor: "RECHAZADO", t: "Rechazados" },
] as const;

export default async function ComentariosPanel({ searchParams }: PageProps<"/panel/comentarios">) {
  const usuario = await requerirUsuario();
  const sp = await searchParams;
  const estado = PESTANAS.find((p) => p.valor === sp.estado)?.valor ?? "PENDIENTE";
  const modera = puedeModerar(usuario);

  const [conteos, comentarios] = await Promise.all([
    prisma.evaluacion.groupBy({
      by: ["estadoComentario"],
      where: { ...alcance(usuario), comentario: { not: null } },
      _count: { _all: true },
    }),
    prisma.evaluacion.findMany({
      where: { ...alcance(usuario), estadoComentario: estado, comentario: { not: null } },
      orderBy: { createdAt: estado === "PENDIENTE" ? "asc" : "desc" },
      take: 30,
      select: {
        id: true,
        comentario: true,
        comentarioRedactado: true,
        satisfaccion: true,
        createdAt: true,
        comentarioRevisadoEn: true,
        esDemo: true,
        tramite: { select: { nombre: true } },
        dependencia: { select: { nombreCorto: true } },
        comentarioRevisadoPor: { select: { nombre: true } },
      },
    }),
  ]);
  const conteo = (e: string) => conteos.find((c) => c.estadoComentario === e)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-4xl font-semibold text-navy">Comentarios</h1>
        <p className="mt-2 text-muted-foreground">Ningún comentario se publica sin que una persona lo revise.</p>
      </header>

      {sp.aviso === "sin-permiso" && (
        <Alert variant="destructive" className="rounded-2xl">
          <Info />
          <AlertTitle>Tu rol no puede moderar</AlertTitle>
          <AlertDescription>La moderación corresponde a responsables de dependencia y a la coordinación general.</AlertDescription>
        </Alert>
      )}

      <nav aria-label="Estado de los comentarios" className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
        {PESTANAS.map((p) => (
          <Link
            key={p.valor}
            href={`/panel/comentarios?estado=${p.valor}`}
            aria-current={p.valor === estado ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-[background-color,box-shadow,color]",
              p.valor === estado ? "bg-card text-navy shadow-[0_1px_4px_rgb(29_47_59/0.15)]" : "text-muted-foreground hover:text-navy",
            )}
          >
            {p.t}
            <span className="tabular rounded-full bg-background px-2 py-0.5 text-xs">{conteo(p.valor)}</span>
          </Link>
        ))}
      </nav>

      {!modera && estado === "PENDIENTE" && (
        <p className="flex items-center gap-2 rounded-2xl bg-primary-soft p-4 text-sm text-navy">
          <Info className="size-4 shrink-0 text-primary-ink" aria-hidden="true" /> Puedes leer los comentarios; la persona responsable de tu dependencia los aprueba.
        </p>
      )}

      <ul className="space-y-3">
        {comentarios.map((c) => (
          <li key={c.id} className="rounded-[1.5rem] border border-border/70 bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {fecha.format(c.createdAt)} · {c.dependencia.nombreCorto} · {c.tramite.nombre}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {c.esDemo && <Badge variant="demo">Demo</Badge>}
                {c.comentarioRedactado && (
                  <Badge variant="teal">
                    <ShieldCheck aria-hidden="true" /> Datos personales eliminados
                  </Badge>
                )}
                <InsigniaVeredicto valor={c.satisfaccion} />
              </span>
            </div>
            <blockquote className="mt-3 text-lg leading-relaxed text-navy">“{c.comentario}”</blockquote>

            {estado === "PENDIENTE" ? (
              modera && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <form action={moderarComentario}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="APROBADO" />
                    <button
                      type="submit"
                      className="presionable inline-flex items-center gap-2 rounded-full bg-[#0f6538] px-4 py-2 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
                    >
                      <Check className="size-4" aria-hidden="true" /> Aprobar
                    </button>
                  </form>
                  <form action={moderarComentario}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decision" value="RECHAZADO" />
                    <button
                      type="submit"
                      className="presionable inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-muted"
                    >
                      <X className="size-4" aria-hidden="true" /> Rechazar
                    </button>
                  </form>
                </div>
              )
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                {estado === "APROBADO" ? "Aprobado" : "Rechazado"}
                {c.comentarioRevisadoPor ? ` por ${c.comentarioRevisadoPor.nombre}` : ""}
                {c.comentarioRevisadoEn ? ` el ${fecha.format(c.comentarioRevisadoEn)}` : ""}
              </p>
            )}
          </li>
        ))}
        {comentarios.length === 0 && (
          <li className="rounded-[1.5rem] border border-dashed bg-card p-10 text-center text-muted-foreground">
            {estado === "PENDIENTE" ? "No hay comentarios por revisar. ¡Todo al día!" : "No hay comentarios en esta lista."}
          </li>
        )}
      </ul>
    </div>
  );
}
