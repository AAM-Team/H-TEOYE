/**
 * Extrae el catálogo público del Portal de Trámites y Servicios de Hermosillo
 * (https://tramites.hermosillo.gob.mx/) y lo guarda como base de conocimiento del asistente.
 *
 * Uso:  node scripts/extraer-tramites.mjs
 * Salida: src/lib/asistente/tramites-hermosillo.json
 *
 * Recorre las páginas del listado (?page=N), lee los campos ocultos de cada tarjeta y abre la
 * ficha de detalle (POST /Home/Tramiteinfo) para obtener requisitos, costo, horario y contacto.
 * Hace una petición a la vez con pausa entre cada una para no saturar el portal.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://tramites.hermosillo.gob.mx";
const SALIDA = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "asistente", "tramites-hermosillo.json");
const PAUSA_MS = 350;
const UA = "Mozilla/5.0 (H-TEOYE extractor de catalogo publico)";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function decodificar(s = "") {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

const limpiar = (s = "") => decodificar(s).replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

let cookie = "";
async function pedir(url, init = {}) {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(url, { ...init, headers: { "user-agent": UA, ...(cookie && { cookie }), ...init.headers } });
      const nuevas = r.headers.getSetCookie?.() ?? [];
      if (nuevas.length) cookie = nuevas.map((c) => c.split(";")[0]).join("; ");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (intento === 3) throw e;
      await dormir(1500 * intento);
    }
  }
}

function camposOcultos(form) {
  const campos = [];
  for (const m of form.matchAll(/<input\b[^>]*>/g)) {
    const nombre = m[0].match(/name="([^"]+)"/)?.[1];
    if (!nombre) continue;
    campos.push([nombre, decodificar(m[0].match(/value="([^"]*)"/s)?.[1] ?? "")]);
  }
  return campos;
}

/** Encabezados de la ficha de detalle, en el orden en que aparecen. */
const SECCIONES = [
  ["INFORMACIÓN GENERAL", "objetivo"],
  ["ESTE TRÁMITE APLICA", "aplicaA"],
  ["REQUISITOS DEL TRÁMITE", "requisitos"],
  ["COSTO", "costo"],
  ["DATOS Y DOCUMENTOS ESPECÍFICOS QUE DEBE CONTENER O SE DEBEN ADJUNTAR AL TRÁMITE", "documentos"],
  ["FUNDAMENTO JURIDICO", "fundamento"],
  ["FUNDAMENTO JURIDICO COBRO", "fundamentoCobro"],
  ["PLAZO DE RESPUESTA", "plazo"],
  ["¿APLICA SANCIONES?", "sanciones"],
  ["VIGENCIA", "vigencia"],
  ["DOCUMENTO A OBTENER PRODUCTO DEL TRÁMITE", "documentoObtenido"],
  ["CONTACTO", null],
  ["HORARIO ATENCION", "horario"],
  ["RESPONSABLE", null],
  ["CARGO", "cargo"],
  ["TELEFONOS", "telefono"],
  ["CORREO ELECTRÓNICO", "correo"],
  ["DOMICILIO", "domicilio"],
];
const FIN = /^(Blvd\. Hidalgo y Comonfort|🔒)/;

function parsearDetalle(html) {
  const lineas = decodificar(
    html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "\n"),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const inicio = lineas.indexOf("INFORMACIÓN GENERAL");
  if (inicio < 0) return {};
  const encabezados = new Map(SECCIONES);
  const out = {};
  let actual = null;
  for (const l of lineas.slice(inicio)) {
    if (encabezados.has(l)) {
      actual = encabezados.get(l);
      continue;
    }
    if (FIN.test(l)) {
      if (actual === "domicilio") break;
      actual = null;
      continue;
    }
    if (actual) (out[actual] ??= []).push(l);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join("\n")]));
}

const MODALIDAD = {
  "TRAMITE EN LINEA": "En línea (HDIGITAL)",
  "PERSONAL Y EN VENTANILLA": "Personal y en ventanilla",
  FORMATO: "Con formato",
  "ESCRITO LIBRE": "Escrito libre",
  VERBALMENTE: "Verbalmente",
  OTRO: "Otro",
  "PLATAFORMA NACIONAL DE TRANSPARENCIA": "Plataforma Nacional de Transparencia",
};

function costoTexto(c) {
  if (c.SinCosto === "True") return "Sin costo";
  return [c.Costo && `$${c.Costo}`, c.CostoVSM && `${c.CostoVSM} VSM`, c.ComplementoCosto].filter(Boolean).join(" · ");
}

async function main() {
  const tramites = [];
  const vistos = new Set();
  let paginas = 1;
  for (let p = 1; p <= paginas; p++) {
    const html = await pedir(p === 1 ? `${BASE}/` : `${BASE}/?page=${p}`);
    if (p === 1) {
      const nums = [...html.matchAll(/href="\/\?page=(\d+)"/g)].map((m) => Number(m[1]));
      paginas = Math.max(1, ...nums);
      console.log(`Páginas del listado: ${paginas}`);
    }
    const tarjetas = html.split(/<article class="cardTramite/).slice(1);
    for (const tarjeta of tarjetas) {
      const form = tarjeta.match(/<form[^>]*action="\/Home\/Tramiteinfo"[\s\S]*?<\/form>/)?.[0];
      if (!form) continue;
      const campos = camposOcultos(form);
      const c = Object.fromEntries(campos);
      if (vistos.has(c.Clave)) continue;
      vistos.add(c.Clave);

      await dormir(PAUSA_MS);
      let det = {};
      try {
        det = parsearDetalle(
          await pedir(`${BASE}/Home/Tramiteinfo`, {
            method: "POST",
            body: new URLSearchParams(campos),
            headers: { "content-type": "application/x-www-form-urlencoded" },
          }),
        );
      } catch (e) {
        console.warn(`  sin detalle ${c.Clave}: ${e.message}`);
      }

      const enlace = tarjeta.match(/href="([^"]+)"\s+class="btn-infoTramite"/)?.[1];
      const modo = limpiar(c.ModoPresentacion);
      tramites.push({
        clave: limpiar(c.Clave),
        nombre: limpiar(c.Nombre),
        dependencia: limpiar(c.Dependencia).replace(/\s+/g, " "),
        sector: limpiar(c.Clasificacion),
        modalidad: MODALIDAD[modo] ?? modo,
        objetivo: limpiar(det.objetivo ?? c.Objetivo),
        aplicaA: limpiar(det.aplicaA ?? c.AplicaA),
        requisitos: limpiar(det.requisitos ?? ""),
        documentos: limpiar(det.documentos ?? ""),
        costo: limpiar(det.costo ?? "") || costoTexto(c),
        plazo: limpiar(det.plazo ?? c.ComplementoPlazo),
        vigencia: limpiar(det.vigencia ?? c.DescripcionVigencia),
        documentoObtenido: limpiar(det.documentoObtenido ?? c.DocumentoObtenido),
        horario: limpiar(det.horario ?? ""),
        telefono: limpiar(det.telefono ?? ""),
        correo: limpiar(det.correo ?? ""),
        domicilio: limpiar(det.domicilio ?? c.Ubicacion),
        formato: c.NombreFormato ? limpiar(c.NombreFormato) : "",
        enlaceEnLinea: enlace ? decodificar(enlace) : modo === "TRAMITE EN LINEA" ? "https://hdigital.hermosillo.gob.mx/" : "",
      });
    }
    console.log(`Página ${p}/${paginas}: ${tramites.length} trámites acumulados`);
  }

  mkdirSync(dirname(SALIDA), { recursive: true });
  writeFileSync(
    SALIDA,
    JSON.stringify(
      {
        _fuente: `${BASE}/`,
        _extraido: new Date().toISOString().slice(0, 10),
        _instrucciones: "Generado por scripts/extraer-tramites.mjs. No lo edites a mano: vuelve a ejecutar el script.",
        tramites,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Listo: ${tramites.length} trámites → ${SALIDA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
