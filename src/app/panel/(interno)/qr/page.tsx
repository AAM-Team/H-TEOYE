import type { Metadata } from "next";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { requerirUsuario } from "@/lib/auth/sesion";
import { qrSvg, tramitesConQr, urlBaseSitio, urlEvaluacion, urlLegible } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Códigos QR" };

const boton =
  "presionable inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function QrPanel() {
  const usuario = await requerirUsuario();
  const base = urlBaseSitio();
  const tramites = await tramitesConQr(usuario);
  const conQr = await Promise.all(
    tramites.map(async (t) => {
      const url = urlEvaluacion(base, t);
      return { ...t, url, svg: await qrSvg(url) };
    }),
  );

  // Agrupa por dependencia conservando el orden.
  const grupos = new Map<string, { nombre: string; tramites: typeof conQr }>();
  for (const t of conQr) {
    const g = grupos.get(t.dependencia.slug) ?? { nombre: t.dependencia.nombre, tramites: [] };
    g.tramites.push(t);
    grupos.set(t.dependencia.slug, g);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold text-navy">Códigos QR para ventanilla</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Cada código abre la encuesta de su trámite. Descárgalo para tus materiales o imprime el cartel y colócalo
          en la ventanilla donde se atiende ese trámite.
        </p>
      </header>

      {[...grupos.entries()].map(([slug, g]) => (
        <section key={slug} aria-labelledby={`dep-${slug}`} className="space-y-4">
          <h2 id={`dep-${slug}`} className="text-xl font-semibold text-navy">
            {g.nombre}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.tramites.map((t) => (
              <li key={t.id} className="flex flex-col rounded-[1.25rem] border border-border/70 bg-card p-5">
                <div
                  className="mx-auto size-40 [&_svg]:size-full"
                  role="img"
                  aria-label={`Código QR para evaluar «${t.nombre}»`}
                  // SVG generado en el servidor por la librería qrcode a partir de nuestra propia URL.
                  dangerouslySetInnerHTML={{ __html: t.svg }}
                />
                <p className="mt-4 line-clamp-3 font-semibold leading-snug text-navy">{t.nombre}</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{urlLegible(t.url)}</p>
                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <a href={`/panel/qr/${t.id}/descargar?formato=png`} download className={`${boton} bg-teal-ink text-white hover:bg-navy`}>
                    <Download className="size-4" aria-hidden="true" /> PNG
                  </a>
                  <a href={`/panel/qr/${t.id}/descargar?formato=svg`} download className={`${boton} border border-input bg-card text-navy hover:bg-muted`}>
                    <Download className="size-4" aria-hidden="true" /> SVG
                  </a>
                  <Link href={`/panel/qr/${t.id}/cartel`} className={`${boton} border border-input bg-card text-navy hover:bg-muted`}>
                    <Printer className="size-4" aria-hidden="true" /> Cartel
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {conQr.length === 0 && (
        <p className="rounded-[1.25rem] border border-dashed bg-card p-10 text-center text-muted-foreground">
          Tu dependencia aún no tiene trámites activos.
        </p>
      )}
    </div>
  );
}
