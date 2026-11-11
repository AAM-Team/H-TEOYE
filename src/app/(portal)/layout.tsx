import { AvisoPrototipo } from "@/components/portal/aviso-prototipo";
import { Encabezado } from "@/components/portal/encabezado";
import { Pie } from "@/components/portal/pie";

// El aviso de datos demostrativos consulta la base de datos en cada solicitud.
export const dynamic = "force-dynamic";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <Encabezado />
      <AvisoPrototipo />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Pie />
    </>
  );
}
