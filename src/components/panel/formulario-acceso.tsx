"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { iniciarSesion, type EstadoAcceso } from "@/app/panel/login/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inicial: EstadoAcceso = { estado: "inicial" };

export function FormularioAcceso() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, inicial);
  return (
    <form action={accion} className="mt-8 space-y-5" noValidate>
      {estado.estado === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {estado.mensaje}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Correo institucional</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-12 rounded-xl bg-card px-4" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-12 rounded-xl bg-card px-4" />
      </div>
      <Button type="submit" size="lg" className="w-full rounded-full" disabled={enviando}>
        {enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
        {enviando ? "Entrando…" : "Entrar al panel"}
      </Button>
    </form>
  );
}
