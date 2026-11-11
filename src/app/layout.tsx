import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "H-TEOYE · Tu voz mejora Hermosillo",
    template: "%s · H-TEOYE",
  },
  description:
    "Prototipo cívico para evaluar la calidad de la atención en trámites municipales de Hermosillo. Desarrollado para el Hackathon de Innovación por la Transparencia y Anticorrupción.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Coincide con el encabezado blanco, que es lo que está bajo la barra de estado.
  themeColor: "#f6f4ef",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
