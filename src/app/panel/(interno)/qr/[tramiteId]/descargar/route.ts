import { obtenerUsuario } from "@/lib/auth/sesion";
import { nombreArchivo, qrPng, qrSvg, tramiteConQr, urlBaseSitio, urlEvaluacion } from "@/lib/qr";

/**
 * Descarga el QR de un trámite: /panel/qr/<id>/descargar?formato=png|svg
 * Exige sesión del panel y que el trámite sea de la dependencia de la persona (la coordinación, todas).
 */
export async function GET(req: Request, { params }: RouteContext<"/panel/qr/[tramiteId]/descargar">) {
  const usuario = await obtenerUsuario();
  if (!usuario) return new Response("Inicia sesión en el panel.", { status: 401 });

  const { tramiteId } = await params;
  const tramite = await tramiteConQr(usuario, tramiteId);
  if (!tramite) return new Response("Trámite no encontrado.", { status: 404 });

  const formato = new URL(req.url).searchParams.get("formato") === "svg" ? "svg" : "png";
  const url = urlEvaluacion(urlBaseSitio(), tramite);
  const cuerpo = formato === "svg" ? await qrSvg(url) : new Uint8Array(await qrPng(url));

  return new Response(cuerpo, {
    headers: {
      "content-type": formato === "svg" ? "image/svg+xml; charset=utf-8" : "image/png",
      "content-disposition": `attachment; filename="${nombreArchivo(tramite, formato)}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
