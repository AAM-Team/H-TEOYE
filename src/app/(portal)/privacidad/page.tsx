import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/portal/encabezado-pagina";
import { Prosa } from "@/components/portal/prosa";

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default function PrivacidadPage() {
  return (
    <>
      <EncabezadoPagina
        migas={[{ href: "/", etiqueta: "Inicio" }, { etiqueta: "Aviso de privacidad" }]}
        titulo="Aviso de privacidad"
        descripcion="Cómo tratamos la información que compartes al evaluar un trámite."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 rounded-xl border border-dashed border-primary/40 bg-primary-soft p-4 text-sm text-navy">
          <strong>Documento de prototipo.</strong> Este aviso describe el funcionamiento del prototipo H-TEOYE
          desarrollado para un hackathon. Antes de una implementación institucional debe ser revisado y emitido por
          la autoridad responsable, conforme a la legislación de protección de datos personales aplicable.
        </div>
        <Prosa>
          <h2>Qué información recopilamos</h2>
          <p>Al enviar una evaluación guardamos únicamente:</p>
          <ul>
            <li>La dependencia y el trámite evaluados.</li>
            <li>Tus calificaciones de 1 a 5 en trato, claridad, facilidad y satisfacción general.</li>
            <li>
              Si decides responderlas: el canal de atención, los problemas que enfrentaste y si alguien te pidió un
              pago no oficial.
            </li>
            <li>Tu comentario opcional.</li>
            <li>La fecha y hora del envío.</li>
          </ul>

          <h2>Qué no recopilamos</h2>
          <ul>
            <li>No pedimos nombre, CURP, RFC, correo electrónico, teléfono ni número de expediente o folio.</li>
            <li>No creamos cuentas para la ciudadanía.</li>
            <li>
              No guardamos tu dirección IP. Para evitar envíos abusivos usamos temporalmente una huella cifrada e
              irreversible de tu conexión que sólo vive en la memoria del servidor por unos minutos.
            </li>
          </ul>

          <h2>Protección de los comentarios</h2>
          <p>
            Antes de guardar un comentario eliminamos automáticamente patrones que suelen corresponder a datos
            personales (correos, teléfonos, CURP, RFC y números largos como folios). Además, ningún comentario se
            publica sin la revisión previa de una persona autorizada.
          </p>

          <h2>Para qué usamos la información</h2>
          <ul>
            <li>Calcular indicadores agregados de calidad en la atención por dependencia y trámite.</li>
            <li>Que las dependencias identifiquen oportunidades de mejora y registren acciones concretas.</li>
          </ul>
          <p>
            Los resultados públicos se muestran siempre de forma agregada. El detalle interno sólo lo consulta
            personal institucional autorizado, y cada persona sólo accede a la información de su propia dependencia.
          </p>

          <h2>Esta encuesta no es un canal de denuncia</h2>
          <p>
            Las respuestas son anónimas y sirven para estadística, por lo que no permiten dar seguimiento a un caso
            particular. Si deseas presentar una queja o denuncia formal, acude a los canales oficiales del
            Ayuntamiento de Hermosillo.
          </p>

          <h2>Participación voluntaria</h2>
          <p>Responder es completamente voluntario. Puedes dejar sin contestar todas las preguntas opcionales.</p>
        </Prosa>
      </div>
    </>
  );
}
