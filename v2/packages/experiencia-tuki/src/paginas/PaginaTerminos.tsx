import React from 'react';
import { ContactoLegal, EMPRESA, MarcoLegal } from '../componentes/legal/MarcoLegal';
import type { Clausula } from '../componentes/legal/MarcoLegal';

/**
 * Términos y Condiciones del servicio.
 *
 * Hablan de la relación entre TukiTuki y el restaurante, que es una relación entre
 * empresas. Lo importante —y lo que faltaba— es decir con todas las letras que
 * TukiTuki **no vende la comida**: la venta de los platos es del restaurante, y con
 * ella la responsabilidad sanitaria, de precios y de alérgenos. Sin eso, un
 * restaurante puede creer que la plataforma responde por lo que él publica.
 *
 * El texto está escrito para leerse: frases cortas, la referencia legal al final
 * de la frase y sin repetir «el USUARIO» en mayúsculas. Se asume que hay una
 * revisión por abogado antes de publicar.
 */
const CLAUSULAS: Clausula[] = [
  {
    id: 'aceptacion',
    titulo: 'Quiénes somos y qué estás aceptando',
    cuerpo: (
      <>
        <p>
          {EMPRESA.marca} es una plataforma para que un restaurante publique su menú digital y
          reciba pedidos. La presta {EMPRESA.razonSocial}, identificada con NIT {EMPRESA.nit} y
          domiciliada en {EMPRESA.domicilio}.
        </p>
        <p>
          Estos términos son un acuerdo entre {EMPRESA.razonSocial} (en adelante, «{EMPRESA.marca}»)
          y quien crea la cuenta (en adelante, «el Restaurante»). Al registrarte, o al usar la
          plataforma, los aceptas. La aceptación por medios electrónicos tiene plena validez y
          eficacia probatoria conforme a la Ley 527 de 1999, que es la que rige el comercio
          electrónico en Colombia.
        </p>
        <p>
          Necesitas ser mayor de edad y tener capacidad legal para obligarte. Si aceptas en nombre
          de un restaurante, declaras que tienes facultades para hacerlo.
        </p>
      </>
    ),
  },
  {
    id: 'servicio',
    titulo: 'Qué hace TukiTuki y qué no hace',
    cuerpo: (
      <>
        <p>{EMPRESA.marca} te permite:</p>
        <ul>
          <li>Publicar un menú digital con tu propio enlace y tu propio código QR.</li>
          <li>Armar la carta con fotos, precios, categorías y disponibilidad.</li>
          <li>Elegir el estilo visual y los colores de tu página.</li>
          <li>
            Recibir los pedidos de tus clientes en tu WhatsApp, con el detalle de lo que pidieron.
          </li>
          <li>Escribir los textos de la carta con ayuda de inteligencia artificial.</li>
        </ul>
        <p>
          <strong>{EMPRESA.marca} no vende comida.</strong> No es el vendedor, ni el fabricante, ni
          el transportador de los platos, y no fija sus precios. La relación de consumo por lo que
          se pide es directamente entre el Restaurante y quien pide, y el Restaurante es el único
          responsable de:
        </p>
        <ul>
          <li>La veracidad de los precios, las descripciones, las porciones y la disponibilidad.</li>
          <li>La información de alérgenos, ingredientes y contenido nutricional.</li>
          <li>
            Las condiciones sanitarias de su cocina y el cumplimiento de las normas colombianas
            aplicables, incluido el concepto sanitario ante el INVIMA o la autoridad de salud.
          </li>
          <li>La atención al cliente y las garantías sobre lo que vende.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cuenta',
    titulo: 'Tu cuenta y tus credenciales',
    cuerpo: (
      <>
        <p>
          Los datos que registras deben ser ciertos y estar actualizados. La contraseña es tuya y
          respondes por lo que ocurra con ella: quien la tenga puede publicar precios en tu nombre.
        </p>
        <p>
          Avísanos de inmediato si detectas un acceso que no reconoces. Una cuenta corresponde a un
          restaurante; si administras varios locales, necesitas una cuenta por local.
        </p>
      </>
    ),
  },
  {
    id: 'precios',
    titulo: 'Planes, precios y facturación',
    cuerpo: (
      <>
        <p>
          Los planes y sus precios son los publicados en la página de precios, expresados en pesos
          colombianos (COP). Los impuestos se aplican según la ley y se muestran cuando correspondan.
        </p>
        <ul>
          <li>
            <strong>Renovación automática.</strong> Los planes pagos se renuevan por periodos
            iguales al contratado, salvo que canceles antes de la fecha de corte. Cancelar detiene
            el cobro siguiente; no devuelve la parte del periodo ya pagado que no alcanzaste a usar.
          </li>
          <li>
            <strong>Cambios de precio.</strong> Podemos ajustar las tarifas con un aviso previo de
            treinta (30) días calendario. Si no estás de acuerdo, puedes terminar el servicio antes
            de que el nuevo precio empiece a regir.
          </li>
          <li>
            <strong>Impago.</strong> Si un cobro falla, te avisamos y damos un plazo razonable
            antes de suspender el servicio.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'retracto',
    titulo: 'Derecho de retracto y reversión del pago',
    cuerpo: (
      <>
        <p>
          Como el plan se contrata a distancia, tienes derecho de retracto: puedes pedir que se
          deshaga la compra dentro de los cinco (5) días hábiles siguientes a la activación del
          plan, sin explicar por qué, escribiendo al correo de contacto. Es el artículo 47 de la Ley
          1480 de 2011, el Estatuto del Consumidor colombiano.
        </p>
        <p>
          Ejercido el retracto, devolvemos lo pagado por el mismo medio con que pagaste, en los
          plazos y las condiciones de esa misma ley. También procede la reversión del pago en los
          casos que contempla el Estatuto del Consumidor, por ejemplo cuando la operación no fue
          solicitada, o cuando el servicio no se prestó.
        </p>
        <p>
          Nada de lo que dice este documento limita los derechos que la ley le reconoce al
          consumidor. Si alguna cláusula los contradice, prevalece la ley.
        </p>
      </>
    ),
  },
  {
    id: 'uso',
    titulo: 'Uso aceptable',
    cuerpo: (
      <>
        <p>Puedes usar {EMPRESA.marca} para tu restaurante. No puedes:</p>
        <ul>
          <li>Publicar contenido ilegal, engañoso, discriminatorio o violento.</li>
          <li>
            Subir fotos, textos o marcas de terceros sin autorización, ni usar la imagen de personas
            sin su consentimiento.
          </li>
          <li>
            Intentar vulnerar la plataforma, sus cuentas o su infraestructura, ni introducir código
            malicioso. La Ley 1273 de 2009 tipifica estos ataques como delitos informáticos.
          </li>
          <li>
            Usar la inteligencia artificial para producir contenido ilegal, engañoso o que suplante
            a otra persona o negocio.
          </li>
          <li>Revender el servicio, o extraer datos de la plataforma de forma masiva.</li>
        </ul>
        <p>
          Ante un uso indebido podemos suspender la cuenta, avisándote cuando sea posible y
          reservando las acciones que correspondan.
        </p>
      </>
    ),
  },
  {
    id: 'contenido',
    titulo: 'Tu contenido y tus imágenes',
    cuerpo: (
      <>
        <p>
          Los textos, las fotos, los precios y la marca de tu restaurante siguen siendo tuyos. Nos
          das una licencia limitada, no exclusiva y gratuita para alojarlos, reproducirlos y
          mostrarlos al público con un solo fin: prestar el servicio mientras esté activo.
        </p>
        <p>
          Declaras que tienes los derechos sobre lo que subes y respondes por las reclamaciones de
          terceros. Nos reservamos retirar contenido que vulnere derechos de autor o la ley, conforme
          a la Ley 23 de 1982 y a la Decisión Andina 351 de 1993.
        </p>
      </>
    ),
  },
  {
    id: 'ia',
    titulo: 'Contenido generado con inteligencia artificial',
    cuerpo: (
      <>
        <p>
          Las sugerencias de la inteligencia artificial son un borrador, no una asesoría. Debes
          revisarlas antes de publicar: los precios, la descripción de los ingredientes, los
          alérgenos y cualquier afirmación sobre la comida son responsabilidad del Restaurante.
        </p>
        <p>
          Para generar esos textos enviamos solo lo necesario a un proveedor externo de modelos de
          lenguaje. El tratamiento de esos datos se rige por lo previsto en la Política de Tratamiento
          de Datos.
        </p>
      </>
    ),
  },
  {
    id: 'datos',
    titulo: 'Los datos personales de tus clientes',
    cuerpo: (
      <>
        <p>
          Cuando alguien pide desde tu menú, deja su nombre, su teléfono y su dirección de entrega.
          Frente a esos datos <strong>el Restaurante es el responsable y {EMPRESA.marca} actúa como
          encargado</strong>: los tratamos solo para armar y enviar el pedido, siguiendo tus
          instrucciones, y no los usamos para fines propios ni los vendemos.
        </p>
        <p>
          Nosotros somos responsables de tus propios datos —los de tu cuenta y tu facturación— y los
          tratamos conforme a la Ley 1581 de 2012 y a la{' '}
          <a href="/privacidad">Política de Tratamiento de Datos Personales</a>.
        </p>
      </>
    ),
  },
  {
    id: 'disponibilidad',
    titulo: 'Disponibilidad, soporte y mantenimiento',
    cuerpo: (
      <>
        <p>
          Procuramos mantener el servicio disponible de forma continua y trabajamos con un objetivo
          interno de disponibilidad mensual del 99,5 %, medido por fuera de las ventanas de
          mantenimiento programadas y de las fallas originadas en terceros como el alojamiento, la
          mensajería de WhatsApp o las pasarelas de pago.
        </p>
        <p>
          Ese objetivo no es una garantía contractual: no prometemos que el servicio funcione sin
          interrupciones ni sin errores. Sí nos comprometemos a atenderte por un canal de soporte y
          a responder en un tiempo razonable. Un acuerdo de nivel de servicio formal, si lo
          necesitas, se firma aparte.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilidad',
    titulo: 'Límites de responsabilidad',
    cuerpo: (
      <>
        <p>
          En la máxima medida que permita la ley, la responsabilidad total de {EMPRESA.marca} frente
          al Restaurante por cualquier reclamación derivada de estos términos se limita al valor que
          hayas pagado en los doce (12) meses anteriores al hecho.
        </p>
        <p>
          No respondemos por el lucro cesante ni por el daño indirecto, ni por lo que ocurra con la
          información que publiques o con el servicio de mensajería que uses para atender los
          pedidos.
        </p>
        <p>
          Nada en esta cláusula limita la responsabilidad por dolo o culpa grave, ni los derechos
          que la ley le reconoce al consumidor.
        </p>
      </>
    ),
  },
  {
    id: 'terminacion',
    titulo: 'Suspensión y terminación',
    cuerpo: (
      <>
        <ul>
          <li>
            <strong>Por tu parte.</strong> Puedes terminar el servicio cuando quieras desde el
            panel de control.
          </li>
          <li>
            <strong>Por nuestra parte.</strong> Podemos terminar por incumplimiento de estos
            términos, con un aviso previo de treinta (30) días calendario, o de inmediato cuando
            haya un riesgo de seguridad, un requerimiento de autoridad o un uso prohibido.
          </li>
        </ul>
        <p>
          Al terminar tendrás treinta (30) días calendario para descargar tu contenido. Después
          conservamos únicamente lo que la ley nos obliga a conservar —por ejemplo, por razones
          contables o tributarias— y eliminamos el resto.
        </p>
      </>
    ),
  },
  {
    id: 'cambios',
    titulo: 'Cambios a estos términos',
    cuerpo: (
      <>
        <p>
          Podemos actualizar estos términos para reflejar cambios del servicio o de la ley. Cuando
          el cambio sea sustancial lo avisamos por correo o dentro del panel con al menos quince
          (15) días hábiles de antelación. Si no estás de acuerdo, puedes terminar el servicio antes
          de que el cambio entre en vigor.
        </p>
        <p>La versión vigente y su fecha están siempre publicadas en esta página.</p>
      </>
    ),
  },
  {
    id: 'propiedad',
    titulo: 'Propiedad intelectual de la plataforma',
    cuerpo: (
      <p>
        El código, el diseño, la marca {EMPRESA.marca}, los textos de este sitio y la documentación
        son nuestros. Mientras el servicio esté activo te damos una licencia de uso limitada, no
        exclusiva e intransferible sobre la plataforma. No puedes copiarla, modificarla,
        descompilarla ni crear obras derivadas con ella, salvo en lo que la ley permita.
      </p>
    ),
  },
  {
    id: 'ley',
    titulo: 'Ley aplicable y controversias',
    cuerpo: (
      <>
        <p>
          Estos términos se rigen por las leyes de la República de Colombia. Cualquier diferencia la
          intentaremos resolver primero de buena fe, hablando. Si no es posible, se decidirá ante
          los jueces competentes del domicilio de {EMPRESA.razonSocial}.
        </p>
        <p>
          Lo anterior no le quita al consumidor la posibilidad de acudir a la Superintendencia de
          Industria y Comercio, que es la autoridad de protección al consumidor en Colombia.
        </p>
      </>
    ),
  },
  {
    id: 'pqrs',
    titulo: 'PQRS, notificaciones y fuerza mayor',
    cuerpo: (
      <>
        <p>
          Las peticiones, quejas, reclamos y sugerencias se radican por el correo de contacto y las
          respondemos en los términos del Estatuto del Consumidor. Las notificaciones relacionadas
          con el servicio se entienden surtidas en el correo electrónico que registraste en tu
          cuenta.
        </p>
        <p>
          Ninguna parte responde por el incumplimiento causado por un hecho ajeno a su control:
          desastres naturales, cortes de energía o de internet, actos de autoridad o fallas graves
          de un proveedor de infraestructura.
        </p>
      </>
    ),
  },
];

export default function PaginaTerminos() {
  return (
    <MarcoLegal
      titulo="Términos y Condiciones"
      descripcion="Condiciones del servicio de TukiTuki para restaurantes: planes, facturación, derecho de retracto, uso aceptable y responsabilidades."
      entradilla="Estas son las condiciones con las que un restaurante usa TukiTuki: qué hace la plataforma, qué cuesta, qué puedes esperar de nosotros y qué esperamos de ti. Están escritas para leerse, no para esconderse."
      resumen={[
        <>
          <strong>{EMPRESA.marca} no vende comida.</strong> Presta la herramienta para publicar el
          menú y recibir pedidos. La venta de los platos, y su responsabilidad sanitaria y de
          precios, es del restaurante.
        </>,
        <>
          Tienes <strong>cinco (5) días hábiles de retracto</strong> desde que activas un plan pago,
          y puedes cancelarlo cuando quieras: la cancelación detiene el cobro siguiente.
        </>,
        <>
          Los datos de quienes te compran los tratamos <strong>por tu cuenta</strong>: son tuyos y
          de tu cliente, no nuestros. Solo los usamos para armar y enviar el pedido.
        </>,
        <>
          Podemos suspender una cuenta que publique contenido ilegal o engañoso, o que ataque la
          plataforma.
        </>,
      ]}
      clausulas={CLAUSULAS}
      cierre={
        <ContactoLegal nota="Para ejercer el derecho de retracto, pedir soporte, radicar una PQRS o notificarnos cualquier asunto legal, escríbenos al correo de contacto. Respondemos en los términos de ley." />
      }
    />
  );
}
