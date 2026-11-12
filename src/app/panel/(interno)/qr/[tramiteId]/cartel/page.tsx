import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Logotipo } from "@/components/marca/logotipo";
import { BotonImprimir } from "@/components/panel/boton-imprimir";
import { requerirUsuario } from "@/lib/auth/sesion";
import { qrSvg, tramiteConQr, urlBaseSitio, urlEvaluacion, urlLegible } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cartel para ventanilla" };

const PASOS = [
  { n: "1", t: "Escanea el código", d: "con la cámara de tu celular." },
  { n: "2", t: "Escribe el folio", d: "de tu trámite (está en tu comprobante)." },
  { n: "3", t: "Califica la atención", d: "con cinco estrellas. Toma 2 minutos." },
];

export default async function CartelQr({ params }: PageProps<"/panel/qr/[tramiteId]/cartel">) {
  const usuario = await requerirUsuario();
  const { tramiteId } = await params;
  const tramite = await tramiteConQr(usuario, tramiteId);
  if (!tramite) notFound();
  const url = urlEvaluacion(urlBaseSitio(), tramite);
  const svg = await qrSvg(url);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <style>{`@page { size: letter; margin: 0; } @media print { html, body { background: #fff !important; } }`}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/panel/qr" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline">
          <ChevronLeft className="size-4" aria-hidden="true" /> Códigos QR
        </Link>
        <BotonImprimir />
      </div>

      {/* Hoja tamaño carta (21.59 × 27.94 cm) */}
      <article
        aria-label={`Cartel para evaluar ${tramite.nombre}`}
        className="mx-auto flex aspect-[8.5/11] w-full max-w-[8.5in] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_-12px_rgb(6_38_43/0.35)] print:h-[11in] print:w-[8.5in] print:max-w-none print:rounded-none print:shadow-none"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        <div className="flex items-center justify-between bg-[#f6f4ef] px-[7%] py-[4.5%]">
          <Logotipo className="[&>span:first-child]:text-[2.6rem]" />
          <p className="max-w-[45%] text-right text-sm font-semibold leading-snug text-navy">{tramite.dependencia.nombre}</p>
        </div>

        <div className="flex flex-1 flex-col items-center px-[7%] pt-[5%] text-center">
          <p className="font-marca text-[3.4rem] leading-none text-navy">¿Cómo te atendimos?</p>
          <p className="mt-3 text-xl text-muted-foreground">Tu opinión mejora este trámite:</p>
          <p className="mt-2 line-clamp-3 max-w-[90%] text-2xl font-semibold leading-snug text-navy">{tramite.nombre}</p>

          <div
            className="mt-[4%] w-[46%] rounded-3xl border-[6px] border-orange bg-white p-2 [&_svg]:block [&_svg]:size-full"
            role="img"
            aria-label="Código QR de la encuesta"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-3 break-all font-mono text-sm text-muted-foreground">{urlLegible(url)}</p>

          <ol className="mt-[4%] grid w-full grid-cols-3 gap-4 text-left">
            {PASOS.map((p) => (
              <li key={p.n} className="flex gap-3">
                <span className="font-marca flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-ink text-xl text-white">
                  {p.n}
                </span>
                <span className="text-[15px] leading-snug text-navy">
                  <strong className="block">{p.t}</strong>
                  {p.d}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-auto bg-navy-deep px-[7%] py-[3%] text-center text-sm text-white/85">
          Confidencial: el folio sólo se usa para verificar tu evaluación y nunca se publica.
        </p>
      </article>
    </div>
  );
}
