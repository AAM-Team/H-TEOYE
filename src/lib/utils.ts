import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatoDecimal = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatoEntero = new Intl.NumberFormat("es-MX");

export const formatearPromedio = (n: number | null | undefined) => (n == null ? "—" : formatoDecimal.format(n));
export const formatearEntero = (n: number) => formatoEntero.format(n);

/** «1 trámite», «12 trámites», «1,250 evaluaciones». */
export const conteo = (n: number, singular: string, plural: string) =>
  `${formatearEntero(n)} ${n === 1 ? singular : plural}`;
