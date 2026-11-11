import Link from "next/link";
import { Logotipo } from "@/components/marca/logotipo";
import { Button } from "@/components/ui/button";

export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Logotipo />
      <p className="mt-10 text-sm font-semibold text-primary-ink">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy">No encontramos esta página</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Es posible que el enlace sea incorrecto o que el trámite ya no esté disponible para evaluación.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/dependencias">Ver dependencias</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </main>
  );
}
