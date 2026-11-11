import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarDays, CheckCircle2, Eye, EyeOff, Info, Plus } from "lucide-react";
import { cambiarEstadoAccion, publicarAccion, validarAccion } from "@/app/panel/(interno)/acciones-servidor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { alcance, puedeValidar, requerirUsuario } from "@/lib/auth/sesion";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acciones de mejora" };

const COLUMNAS = [
  { estado: "PENDIENTE", t: "Pendiente", c: "bg-[#c4cfd4]" },
  { estado: "EN_REVISION", t: "En revisión", c: "bg-[#fad35a]" },
  { estado: "EN_PROCESO", t: "En proceso", c: "bg-[#009a9c]" },
  { estado: "CONCLUIDA", t: "Concluida", c: "bg-[#3b9f5a]" },
] as const;

const AVISOS: Record<string, { t: string; d: string; error?: boolean }> = {
  creada: { t: "Acción registrada", d: "Queda pendiente de validación por la persona responsable." },
  propia: { t: "No puedes validar tu propia acción", d: "Otra persona con rol de responsable o coordinación debe validarla.", error: true },
  "sin-validar": { t: "Primero hay que validarla", d: "Sólo las acciones validadas pueden publicarse en el portal.", error: true },
  "sin-permiso": { t: "Tu rol no permite esa acción", d: "Validar y publicar corresponde a responsables y coordinación general.", error: true },
};

const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });

export default async function AccionesPanel({ searchParams }: PageProps<"/panel/acciones">) {
  const usuario = await requerirUsuario();
  const sp = await searchParams;
  const aviso = typeof sp.aviso === "string" ? AVISOS[sp.aviso] : undefined;
  const valida = puedeValidar(usuario);

  const acciones = await prisma.accionMejora.findMany({
    where: alcance(usuario),
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      estado: true,
      validada: true,
      publicada: true,
      fechaCompromiso: true,
      esDemo: true,
      creadoPorId: true,
      creadoPor: { select: { nombre: true } },
      validadaPor: { select: { nombre: true } },
      dependencia: { select: { nombreCorto: true } },
      tramite: { select: { nombre: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-navy">Acciones de mejora</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Del dato a la mejora: se registran, se validan por otra persona y sólo entonces se publican en el portal ciudadano.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/panel/acciones/nueva">
            <Plus aria-hidden="true" /> Nueva acción
          </Link>
        </Button>
      </header>

      {aviso && (
        <Alert variant={aviso.error ? "destructive" : "info"} className="rounded-2xl">
          {aviso.error ? <Info /> : <CheckCircle2 />}
          <AlertTitle>{aviso.t}</AlertTitle>
          <AlertDescription>{aviso.d}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNAS.map((col) => {
          const lista = acciones.filter((a) => a.estado === col.estado);
          return (
            <section key={col.estado} aria-labelledby={`col-${col.estado}`} className="rounded-[1.5rem] bg-muted/70 p-3">
              <h2 id={`col-${col.estado}`} className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-navy">
                <span className={cn("size-2.5 rounded-full", col.c)} aria-hidden="true" />
                {col.t}
                <span className="tabular ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{lista.length}</span>
              </h2>
              <ul className="mt-2 space-y-2.5">
                {lista.map((a) => (
                  <li key={a.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_2px_rgb(29_47_59/0.05)]">
                    <p className="text-xs text-muted-foreground">
                      {a.dependencia.nombreCorto}
                      {a.tramite ? ` · ${a.tramite.nombre}` : ""}
                    </p>
                    <h3 className="mt-1 font-semibold leading-snug text-navy">{a.titulo}</h3>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{a.descripcion}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {a.esDemo && <Badge variant="demo">Demo</Badge>}
                      {a.validada ? (
                        <Badge variant="teal">
                          <BadgeCheck aria-hidden="true" /> Validada
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Sin validar</Badge>
                      )}
                      {a.publicada && (
                        <Badge className="border-transparent bg-[#0f6538] text-white">
                          <Eye aria-hidden="true" /> Pública
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Registró: {a.creadoPor.nombre}</span>
                      {a.validadaPor && <span>Validó: {a.validadaPor.nombre}</span>}
                      {a.fechaCompromiso && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" aria-hidden="true" /> {fecha.format(a.fechaCompromiso)}
                        </span>
                      )}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
                      <form action={cambiarEstadoAccion} className="flex gap-2">
                        <input type="hidden" name="id" value={a.id} />
                        <label className="sr-only" htmlFor={`estado-${a.id}`}>
                          Estado de la acción
                        </label>
                        <select
                          id={`estado-${a.id}`}
                          name="estado"
                          defaultValue={a.estado}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-card px-2 text-sm text-navy"
                        >
                          {COLUMNAS.map((c) => (
                            <option key={c.estado} value={c.estado}>
                              {c.t}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="presionable h-9 rounded-lg bg-muted px-3 text-sm font-semibold text-navy hover:bg-input/60">
                          Mover
                        </button>
                      </form>
                      {valida && (
                        <div className="flex flex-wrap gap-2">
                          {!a.validada && a.creadoPorId !== usuario.id && (
                            <form action={validarAccion}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" className="presionable inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:brightness-110">
                                <BadgeCheck className="size-4" aria-hidden="true" /> Validar
                              </button>
                            </form>
                          )}
                          {a.validada && (
                            <form action={publicarAccion}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="publicar" value={a.publicada ? "no" : "si"} />
                              <button
                                type="submit"
                                className={cn(
                                  "presionable inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
                                  a.publicada ? "border border-input bg-card text-navy hover:bg-muted" : "bg-[#0f6538] text-white hover:brightness-110",
                                )}
                              >
                                {a.publicada ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                                {a.publicada ? "Retirar del portal" : "Publicar"}
                              </button>
                            </form>
                          )}
                          {!a.validada && a.creadoPorId === usuario.id && (
                            <p className="text-xs text-muted-foreground">Otra persona debe validar tu acción.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {lista.length === 0 && <li className="rounded-2xl border border-dashed border-input p-4 text-center text-sm text-muted-foreground">Sin acciones</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
