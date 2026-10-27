import React from 'react';
import { ContactoLegal, EMPRESA, MarcoLegal } from '../componentes/legal/MarcoLegal';
import type { Clausula } from '../componentes/legal/MarcoLegal';

/**
 * Política de Tratamiento de Datos Personales.
 *
 * La distinción que más importa aquí —y que la versión anterior no hacía— es la
 * de responsable y encargado: cuando alguien pide comida desde el menú de un
 * restaurante, esos datos son del restaurante y de su cliente. Riki los trata
 * por cuenta del restaurante, para armar y enviar el pedido, y no los usa para
 * nada propio. Decirlo así no es un tecnicismo: cambia quién atiende el reclamo
 * de una persona que pide ver o borrar sus datos.
 *
 * El resto sigue el contenido que exige la Ley 1581 de 2012 y su decreto
 * reglamentario: finalidades, autorización, derechos del titular, canales,
 * plazos de respuesta, transferencia internacional y medidas de seguridad.
 */
const CLAUSULAS: Clausula[] = [
  {
    id: 'responsable',
    titulo: 'Quién responde por tus datos',
    cuerpo: (
      <>
        <p>
          El responsable del tratamiento de los datos de tu cuenta es {EMPRESA.razonSocial},
          identificada con NIT {EMPRESA.nit} y domiciliada en {EMPRESA.domicilio}. Puedes escribirle
          al correo <a href={`mailto:${EMPRESA.correo}`}>{EMPRESA.correo}</a>.
        </p>
        <p>
          Para los datos de las personas que piden comida desde el menú de un restaurante, el
          responsable es <strong>el restaurante</strong> y {EMPRESA.marca} actúa como{' '}
          <strong>encargado</strong>: los trata siguiendo sus instrucciones y solo para armar y
          enviar el pedido. Si eres cliente de un restaurante y quieres ejercer tus derechos sobre
          esos datos, la solicitud va al restaurante; si nos llega a nosotros, la trasladamos y te lo
          informamos.
        </p>
      </>
    ),
  },
  {
    id: 'marco',
    titulo: 'Marco legal',
    cuerpo: (
      <p>
        Esta política se rige por el artículo 15 de la Constitución Política, por la Ley 1581 de
        2012 y por el Decreto 1074 de 2015, que compila el Decreto 1377 de 2013. Cumplimos también
        las instrucciones y la doctrina de la Superintendencia de Industria y Comercio (SIC), que es
        la autoridad nacional de protección de datos.
      </p>
    ),
  },
  {
    id: 'definiciones',
    titulo: 'Qué significan las palabras de este documento',
    cuerpo: (
      <>
        <p>
          <strong>Dato personal:</strong> cualquier información que permita identificarte, como tu
          nombre, tu correo o tu teléfono.
        </p>
        <p>
          <strong>Dato sensible:</strong> aquel que afecta tu intimidad o puede generar
          discriminación, como el estado de salud, la orientación sexual, las convicciones religiosas
          o los datos biométricos.
        </p>
        <p>
          <strong>Titular:</strong> la persona a la que se refieren los datos. Eres tú.
        </p>
        <p>
          <strong>Responsable:</strong> quien decide para qué se tratan los datos y responde por
          ellos.
        </p>
        <p>
          <strong>Encargado:</strong> quien trata los datos por cuenta del responsable, siguiendo sus
          instrucciones. Es el papel de {EMPRESA.marca} con los datos de quienes piden en un menú.
        </p>
        <p>
          <strong>Tratamiento:</strong> cualquier operación con datos personales: recogerlos,
          guardarlos, usarlos, consultarlos, transmitirlos o eliminarlos.
        </p>
        <p>
          <strong>Autorización:</strong> tu permiso previo, expreso e informado para tratar tus
          datos.
        </p>
        <p>
          <strong>Transferencia:</strong> enviar tus datos a un tercero que es responsable por su
          cuenta, dentro o fuera de Colombia.
        </p>
      </>
    ),
  },
  {
    id: 'principios',
    titulo: 'Cómo tratamos los datos',
    cuerpo: (
      <>
        <p>
          Tratamos los datos personales con los principios que fija la ley: legalidad, finalidad,
          libertad, veracidad, transparencia, acceso y circulación restringida, seguridad y
          confidencialidad. En la práctica esto significa que:
        </p>
        <ul>
          <li>Solo los pedimos cuando de verdad hacen falta y explicamos para qué.</li>
          <li>No los usamos para un fin distinto del que te dijimos.</li>
          <li>No los cedemos ni los vendemos a nadie, salvo lo que dice este documento.</li>
          <li>Solo los ve el personal que los necesita para su trabajo.</li>
          <li>Si te equivocas al escribirlos, los corregimos cuando nos lo pides.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'datos',
    titulo: 'Qué datos tratamos y para qué',
    cuerpo: (
      <>
        <p>
          <strong>Los datos de tu cuenta.</strong> Nombre y apellido, correo electrónico, teléfono,
          nombre y datos del restaurante, dirección, NIT y la información que necesitemos para
          facturar. Los tratamos para crear y administrar tu cuenta, prestarte el servicio, enviarte
          los avisos del sistema, cobrar y facturar, atenderte por soporte y proteger la plataforma.
        </p>
        <p>
          <strong>Los datos de quienes piden en tu menú.</strong> Nombre, teléfono, dirección de
          entrega y el detalle de lo que pidieron, que puede incluir notas que ellos mismos escriben.
          Los tratamos <strong>por cuenta del restaurante</strong> y solo para armar el pedido,
          enviarlo por WhatsApp y atender esa compra. No los usamos para publicidad propia ni para
          crear perfiles.
        </p>
        <p>
          <strong>Los datos de tu menú.</strong> Los textos, los precios y las fotografías que subes.
          Si dentro de una foto aparece una persona identificable, quien la sube debe contar con su
          autorización.
        </p>
        <p>
          <strong>Los datos técnicos de la visita.</strong> Dirección IP, tipo de dispositivo y de
          navegador, idioma, páginas que visitas y fecha y hora. Los usamos para que el servicio
          funcione, para medir qué se usa y mejorarlo, y para detectar abusos o ataques.
        </p>
        <p>
          <strong>Las comunicaciones comerciales.</strong> Solo te escribimos sobre novedades de{' '}
          {EMPRESA.marca} si nos diste tu autorización. Puedes retirarla en cualquier momento desde
          un enlace en el propio mensaje o escribiéndonos.
        </p>
      </>
    ),
  },
  {
    id: 'sensibles',
    titulo: 'Datos sensibles y menores de edad',
    cuerpo: (
      <>
        <p>
          <strong>No solicitamos datos sensibles</strong> y no queremos que nos los entregues. Si
          escribes información de ese tipo por tu propia voluntad en un campo libre —por ejemplo, en
          las notas de un pedido— entiendes y aceptas que la trataremos solo para esa finalidad
          concreta, que es cumplir con el pedido.
        </p>
        <p>
          <strong>El servicio es para mayores de 18 años.</strong> No recogemos datos de niños, niñas
          ni adolescentes de forma consciente. Si detectamos una cuenta de un menor, la cerramos y
          eliminamos los datos, salvo los que la ley nos obligue a conservar.
        </p>
      </>
    ),
  },
  {
    id: 'autorizacion',
    titulo: 'Tu autorización',
    cuerpo: (
      <>
        <p>
          Tu autorización se recoge al crear la cuenta y aceptar esta política. La ley admite la
          autorización por conductas inequívocas, y marcar la casilla de aceptación lo es: sabes
          quién trata tus datos, para qué y cómo ejercer tus derechos.
        </p>
        <p>
          Puedes revocarla escribiéndonos. Ten en cuenta que los datos de tu cuenta son necesarios
          para prestarte el servicio: si los retiras, tendremos que cerrar la cuenta. La revocatoria
          no tiene efectos retroactivos, ni afecta los tratamientos que la ley obligue a mantener.
        </p>
        <p>Conservamos la prueba de la autorización mientras dure el tratamiento.</p>
      </>
    ),
  },
  {
    id: 'terceros',
    titulo: 'Con quién compartimos los datos',
    cuerpo: (
      <>
        <p>
          <strong>No vendemos ni alquilamos datos personales.</strong> Para prestar el servicio
          trabajamos con proveedores que tratan datos por nuestra cuenta, y solo los reciben en la
          medida en que los necesitan:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong>, que aloja la base de datos y gestiona el inicio de sesión.
          </li>
          <li>
            <strong>Cloudinary</strong>, que almacena y sirve las imágenes de los menús.
          </li>
          <li>
            <strong>Groq</strong>, que procesa los textos cuando usas la ayuda de inteligencia
            artificial. Solo le enviamos lo necesario para generar ese texto.
          </li>
          <li>
            <strong>api.qrserver.com</strong>, que genera la imagen del código QR de tu menú.
          </li>
          <li>
            El proveedor de alojamiento del sitio y el servicio de correo transaccional.
          </li>
        </ul>
        <p>
          También podemos entregar información cuando nos lo exija una autoridad judicial o
          administrativa competente, en los términos de la ley.
        </p>
        <p>
          Con todos ellos exigimos contractualmente confidencialidad, seguridad y el uso limitado de
          los datos a las finalidades que aquí se describen.
        </p>
      </>
    ),
  },
  {
    id: 'internacional',
    titulo: 'Transferencia internacional',
    cuerpo: (
      <p>
        Nuestros proveedores de infraestructura alojan servidores por fuera de Colombia, de modo que
        tus datos pueden salir del país. Al aceptar esta política autorizas esa transferencia. La
        hacemos únicamente con proveedores que ofrecen un nivel adecuado de protección de datos o con
        quienes suscribimos las condiciones que exige la Ley 1581 de 2012, y lo comunicamos a la SIC
        cuando corresponde.
      </p>
    ),
  },
  {
    id: 'cookies',
    titulo: 'Cookies y preferencias del navegador',
    cuerpo: (
      <>
        <p>
          Usamos cookies y almacenamiento local del navegador para que el sitio funcione y para
          recordar tus preferencias. Por ejemplo, guardamos si pediste el modo claro o el modo oscuro,
          y si dejaste el menú lateral contraído.
        </p>
        <p>
          No usamos cookies de publicidad ni de seguimiento entre sitios, y no vendemos información
          de navegación. Puedes borrar o bloquear las cookies desde la configuración de tu navegador;
          si lo haces, algunas preferencias dejarán de recordarse y puede que tengas que iniciar
          sesión de nuevo.
        </p>
      </>
    ),
  },
  {
    id: 'conservacion',
    titulo: 'Cuánto tiempo los guardamos',
    cuerpo: (
      <>
        <p>
          Guardamos los datos de tu cuenta mientras esté activa y durante el tiempo necesario para
          cumplir las obligaciones legales, contables y tributarias que nos aplican. Después los
          eliminamos o los anonimizamos, de forma que ya no permitan identificarte.
        </p>
        <p>
          Los datos de los pedidos los conservamos por cuenta del restaurante y por el tiempo que él
          nos indique; si no dice nada, aplicamos el mismo criterio anterior.
        </p>
      </>
    ),
  },
  {
    id: 'derechos',
    titulo: 'Tus derechos',
    cuerpo: (
      <>
        <p>
          Como titular de tus datos puedes, en cualquier momento y de forma gratuita, conforme al
          artículo 8 de la Ley 1581 de 2012:
        </p>
        <ul>
          <li>Conocer qué datos tuyos tenemos y cómo los hemos tratado.</li>
          <li>Acceder a ellos cuando los pidas.</li>
          <li>Actualizarlos y rectificarlos si están incompletos, desactualizados o equivocados.</li>
          <li>
            Pedir que los suprimamos cuando no exista un deber legal o contractual de conservarlos.
          </li>
          <li>Revocar la autorización que nos diste.</li>
          <li>Solicitar prueba de la autorización, salvo cuando la ley no la exija.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'procedimiento',
    titulo: 'Cómo ejercerlos',
    cuerpo: (
      <>
        <p>
          Escríbenos a <a href={`mailto:${EMPRESA.correo}`}>{EMPRESA.correo}</a> indicando tu nombre
          completo, tu documento de identidad, tu correo y tu teléfono de contacto, la descripción de
          lo que pides y los documentos que quieras aportar. Si actúas en nombre de otra persona,
          adjunta la autorización correspondiente.
        </p>
        <ul>
          <li>
            <strong>Consultas:</strong> te respondemos en un máximo de diez (10) días hábiles, que
            pueden prorrogarse cinco (5) más.
          </li>
          <li>
            <strong>Reclamos:</strong> te respondemos en un máximo de quince (15) días hábiles, que
            pueden prorrogarse ocho (8) más.
          </li>
          <li>
            Si la solicitud llega incompleta, te pedimos que la completes. Tienes cinco (5) días para
            hacerlo y, si no lo haces, entendemos que desististe.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'seguridad',
    titulo: 'Cómo protegemos la información',
    cuerpo: (
      <>
        <p>
          Adoptamos medidas técnicas, administrativas y humanas razonables para proteger los datos:
          cifrado de la información en tránsito, contraseñas almacenadas con funciones de hash,
          acceso limitado por roles, copias de seguridad y registro de los accesos.
        </p>
        <p>
          Ninguna medida es infalible. Si ocurre un incidente de seguridad que afecte tus datos, lo
          investigamos y te informamos junto con las medidas que tomamos. De tu lado, también eres
          responsable: cuida la contraseña de tu cuenta y no la compartas.
        </p>
      </>
    ),
  },
  {
    id: 'vigencia',
    titulo: 'Vigencia, cambios y registro',
    cuerpo: (
      <>
        <p>
          Esta política rige desde su publicación y sustituye a las versiones anteriores. Si la
          cambiamos de fondo, lo avisamos por correo o dentro del panel antes de que entre en vigor;
          la versión vigente y su fecha están siempre en esta página.
        </p>
        <p>
          Cumplimos las obligaciones de registro y de reporte que nos sean aplicables ante la
          Superintendencia de Industria y Comercio, incluido el Registro Nacional de Bases de Datos
          cuando la norma lo exija.
        </p>
      </>
    ),
  },
];

export default function PaginaPrivacidad() {
  return (
    <MarcoLegal
      titulo="Política de Tratamiento de Datos Personales"
      descripcion="Cómo Riki trata los datos personales: qué recogemos, para qué, con quién los compartimos, cuánto tiempo los guarda y cómo ejercer tus derechos."
      entradilla="Aquí explicamos qué datos recogemos, para qué los usamos, con quién los compartimos y cómo puedes pedirnos verlos, corregirlos o eliminarlos. Está escrita siguiendo la Ley 1581 de 2012 y su decreto reglamentario."
      resumen={[
        <>
          Los datos de tu cuenta son tuyos: los usamos para prestarte el servicio, cobrarte y
          atenderte. <strong>No los vendemos a nadie.</strong>
        </>,
        <>
          Los datos de quienes piden en tu menú <strong>son tuyos y de tu cliente</strong>. Nosotros
          los tratamos por tu cuenta, y solo para armar y enviar el pedido.
        </>,
        <>
          No pedimos datos sensibles ni datos de menores de edad.
        </>,
        <>
          Para ver, corregir o borrar tu información, escríbenos a{' '}
          <a href={`mailto:${EMPRESA.correo}`}>{EMPRESA.correo}</a>. Respondemos en los plazos de la
          ley: 10 días hábiles las consultas y 15 los reclamos.
        </>,
      ]}
      clausulas={CLAUSULAS}
      cierre={
        <ContactoLegal nota="Aquí radicas tus consultas y reclamos de datos personales, y también cualquier PQRS sobre el servicio. Escribe desde el correo de tu cuenta para que podamos verificarte más rápido." />
      }
    />
  );
}
