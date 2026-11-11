"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { crearAccion, type EstadoFormularioAccion } from "@/app/panel/(interno)/acciones-servidor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const inicial: EstadoFormularioAccion = { estado: "inicial" };
const campo = "h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] text-navy outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

export function FormularioAccion({
  dependencias,
  tramites,
  tramiteInicial,
  tituloSugerido,
}: {
  dependencias: { id: string; nombreCorto: string }[];
  tramites: { id: string; nombre: string; dependenciaId: string }[];
  tramiteInicial: string;
  tituloSugerido: string;
}) {
  const [estado, accion, enviando] = useActionState(crearAccion, inicial);
  const inicialDep = tramites.find((t) => t.id === tramiteInicial)?.dependenciaId ?? "";
  const [dependencia, setDependencia] = useState(inicialDep);
  const errores = estado.estado === "error" ? estado.errores ?? {} : {};
  const visibles = dependencias.length && dependencia ? tramites.filter((t) => t.dependenciaId === dependencia) : tramites;

  const error = (c: string) =>
    errores[c] ? (
      <p id={`error-${c}`} className="mt-1.5 text-sm font-medium text-destructive">
        {errores[c]}
      </p>
    ) : null;

  return (
    <form action={accion} noValidate className="space-y-5 rounded-[1.75rem] border border-border/70 bg-card p-5 sm:p-8">
      {estado.estado === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {estado.mensaje}
        </p>
      )}

      {dependencias.length > 0 && (
        <div>
          <label htmlFor="dependenciaId" className="text-sm font-semibold text-navy">
            Dependencia
          </label>
          <select
            id="dependenciaId"
            name="dependenciaId"
            className={`${campo} mt-2`}
            value={dependencia}
            onChange={(e) => setDependencia(e.target.value)}
            aria-invalid={errores.dependenciaId ? true : undefined}
          >
            <option value="">Elige una dependencia</option>
            {dependencias.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombreCorto}
              </option>
            ))}
          </select>
          {error("dependenciaId")}
        </div>
      )}

      <div>
        <label htmlFor="tramiteId" className="text-sm font-semibold text-navy">
          Trámite <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <select id="tramiteId" name="tramiteId" defaultValue={tramiteInicial} key={dependencia} className={`${campo} mt-2`}>
          <option value="">Toda la dependencia</option>
          {visibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="titulo" className="text-sm font-semibold text-navy">
          Título
        </label>
        <Input
          id="titulo"
          name="titulo"
          defaultValue={tituloSugerido}
          maxLength={120}
          className="mt-2 h-12 rounded-xl px-4"
          aria-invalid={errores.titulo ? true : undefined}
          aria-describedby={errores.titulo ? "error-titulo" : undefined}
          placeholder="Ej. Publicar los requisitos en la ventanilla y en línea"
        />
        {error("titulo")}
      </div>

      <div>
        <label htmlFor="descripcion" className="text-sm font-semibold text-navy">
          ¿Qué se hará?
        </label>
        <Textarea
          id="descripcion"
          name="descripcion"
          maxLength={1000}
          className="mt-2 min-h-36 rounded-xl px-4 py-3"
          aria-invalid={errores.descripcion ? true : undefined}
          aria-describedby={errores.descripcion ? "error-descripcion" : undefined}
          placeholder="Qué cambia, quién lo hace y cómo sabremos que funcionó."
        />
        {error("descripcion")}
      </div>

      <div>
        <label htmlFor="fechaCompromiso" className="text-sm font-semibold text-navy">
          Fecha compromiso <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input id="fechaCompromiso" name="fechaCompromiso" type="date" className={`${campo} mt-2 sm:w-60`} />
      </div>

      <div className="flex justify-end border-t border-border/70 pt-5">
        <Button type="submit" size="lg" className="rounded-full" disabled={enviando}>
          {enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {enviando ? "Guardando…" : "Guardar acción"}
        </Button>
      </div>
    </form>
  );
}
