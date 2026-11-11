"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PuntoTendencia } from "@/lib/consultas/resultados";
import { formatearEntero, formatearPromedio } from "@/lib/utils";

const TINTA = "#1d2f3b";
const SECUNDARIA = "#56656f";
const REJILLA = "#e6ecee";
const AZUL = "#00777a";

function Globo({ active, payload, label, tipo }: { active?: boolean; payload?: { value?: number | null }[]; label?: string; tipo: "satisfaccion" | "total" }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded-lg bg-navy-deep px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="tabular mt-0.5 text-white/80">
        {tipo === "satisfaccion"
          ? v == null
            ? "Muestra insuficiente"
            : `${formatearPromedio(v)} de 5 en satisfacción`
          : `${formatearEntero(v ?? 0)} evaluaciones`}
      </p>
    </div>
  );
}

const ejeX = {
  dataKey: "etiqueta",
  tickLine: false,
  axisLine: false,
  tick: { fill: SECUNDARIA, fontSize: 12 },
  dy: 6,
} as const;

/** Dos gráficas, un eje cada una (nunca doble eje): satisfacción promedio y volumen de evaluaciones por mes. */
export function Tendencia({ datos }: { datos: PuntoTendencia[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <figure>
        <figcaption className="text-xs font-semibold text-muted-foreground">Satisfacción general promedio (1 a 5)</figcaption>
        <div className="mt-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke={REJILLA} />
              <XAxis {...ejeX} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: SECUNDARIA, fontSize: 12 }} />
              <ReferenceLine y={3} stroke="#c3ccd0" strokeDasharray="4 4" />
              <Tooltip
                content={<Globo tipo="satisfaccion" />}
                cursor={{ stroke: TINTA, strokeOpacity: 0.25, strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="satisfaccion"
                stroke={AZUL}
                strokeWidth={2}
                dot={{ r: 4, fill: AZUL, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: AZUL, stroke: "#fff", strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure>
        <figcaption className="text-xs font-semibold text-muted-foreground">Evaluaciones recibidas por mes</figcaption>
        <div className="mt-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={REJILLA} />
              <XAxis {...ejeX} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: SECUNDARIA, fontSize: 12 }} />
              <Tooltip content={<Globo tipo="total" />} cursor={{ fill: TINTA, fillOpacity: 0.05 }} />
              <Bar dataKey="total" fill={TINTA} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <table className="sr-only">
        <caption>Tendencia mensual</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Satisfacción promedio</th>
            <th scope="col">Evaluaciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((d) => (
            <tr key={d.mes}>
              <th scope="row">{d.etiqueta}</th>
              <td>{formatearPromedio(d.satisfaccion)}</td>
              <td>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
