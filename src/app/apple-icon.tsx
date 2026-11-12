import { ImageResponse } from "next/og";
import { COLORES_MARCA, SVG_SOLECITO, aDataUri } from "@/lib/marca-svg";

// Ícono para la pantalla de inicio de iOS: el solecito sobre fondo claro.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORES_MARCA.crema,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={aDataUri(SVG_SOLECITO)} width={140} height={140} />
      </div>
    ),
    size,
  );
}
