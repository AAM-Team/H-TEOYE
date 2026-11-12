import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { COLORES_MARCA, SVG_H, SVG_SOLECITO, aDataUri } from "@/lib/marca-svg";

// Imagen al compartir el sitio en redes y mensajería. Se genera al compilar.
export const alt = "H-TEOYE · Tu voz mejora Hermosillo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fuentes = join(process.cwd(), "node_modules/@fontsource/barlow-condensed/files");

export default async function OpenGraphImage() {
  const [negra, semi] = await Promise.all([
    readFile(join(fuentes, "barlow-condensed-latin-900-italic.woff")),
    readFile(join(fuentes, "barlow-condensed-latin-600-italic.woff")),
  ]);
  const alto = 220; // tamaño de letra de la palabra
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: COLORES_MARCA.marino,
          fontFamily: "Barlow Condensed",
          fontStyle: "italic",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: alto, fontWeight: 900, lineHeight: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={aDataUri(SVG_H)} height={alto * 0.7} width={(alto * 0.7 * 87.7) / 102.5} />
          <span style={{ color: COLORES_MARCA.naranja, marginLeft: 8 }}>-</span>
          <span>TE</span>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={aDataUri(SVG_SOLECITO)} width={alto * 1.15} height={alto * 1.15} style={{ margin: `0 ${-alto * 0.06}px` }} />
          <span>YE</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Tu voz mejora Hermosillo
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow Condensed", data: negra, weight: 900, style: "italic" },
        { name: "Barlow Condensed", data: semi, weight: 600, style: "italic" },
      ],
    },
  );
}
