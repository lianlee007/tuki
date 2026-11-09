import React, { useEffect, useRef, useState } from 'react';
import { Restaurante } from '../../tipos';
import { Boton, Input, LogoWhatsApp } from '../ui';
import { Copy, Check, Download, Printer, ExternalLink, Link2 } from 'lucide-react';
import { apiQR } from '../../api/misApis';
import { generarSlugUnico } from '../../lib/utils';
import { urlPublica } from '../../lib/urlPublica';

/* -------------------------------------------------------------------------
   Difusión: llevar el menú a la mesa y a las redes.

   La sección se lee de arriba abajo en el orden en el que se usa: primero el
   enlace (que es lo que se comparte), después el QR (que es lo que se imprime)
   y al lado las redes. La cabecera que tenía antes —«Difusión y Marketing» con
   un icono en acento— repetía el título que ya está en la barra del panel, así
   que se fue: aquí el primer titular útil es «Tu enlace público».
   ------------------------------------------------------------------------- */

/** La tinta del QR. Negro suave y no el color de marca: el código va impreso
    sobre papel blanco y lo que tiene que rendir ahí es la lectura de la cámara,
    no la identidad. */
const TINTA_QR = '#111111';

/** Medidas de la tarjeta imprimible, en un solo sitio. */
const TARJETA = { codigo: 400, margen: 20, logo: 84, pie: 56 };

/* Los glifos de las redes van en la tinta del panel y no en el color de cada
   marca. Cuatro rellenos saturados distintos —verde, azul, negro, fucsia—
   competirían entre ellos y con el acento del restaurante, que es el único
   color con derecho a destacar en esta pantalla. La silueta ya las identifica. */

const MarcaFacebook: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" fill="currentColor" />
  </svg>
);

const MarcaInstagram: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="6" r="1" fill="currentColor" />
  </svg>
);

const MarcaX: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor" />
  </svg>
);

/* -------------------------------------------------------------------------
   La tarjeta del QR
   ------------------------------------------------------------------------- */

const cargarImagen = (url: string) =>
  new Promise<HTMLImageElement>((resolver, rechazar) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });

const recortarNombre = (nombre: string, maximo = 26) =>
  nombre.length <= maximo ? nombre : `${nombre.slice(0, maximo - 1).trimEnd()}…`;

/**
 * Dibuja la tarjeta imprimible: el código, el logo del restaurante en el centro
 * y su nombre debajo.
 *
 * El MISMO dibujo alimenta la vista previa, la descarga y la impresión. Antes
 * la vista previa era la imagen del servicio con un logo superpuesto por CSS
 * mientras el archivo descargado lo llevaba dibujado por dentro, así que lo que
 * el dueño veía no era lo que le salía del navegador. Ahora la tarjeta se
 * define una sola vez y las tres cosas coinciden.
 */
const dibujarTarjeta = async (codigoUrl: string, nombre: string, logoUrl?: string | null) => {
  const { codigo, margen, logo, pie } = TARJETA;
  const ancho = codigo + margen * 2;

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = ancho + pie;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No se pudo dibujar el QR');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);

  ctx.drawImage(await cargarImagen(codigoUrl), margen, margen, codigo, codigo);

  const centro = margen + codigo / 2;
  if (logoUrl) {
    // Si el logo no llega (sin conexión, sin permiso de lectura) la tarjeta se
    // dibuja igual, solo que sin el centro. Nunca dejamos al dueño sin QR.
    const marca = await cargarImagen(logoUrl).catch(() => null);
    if (marca) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centro, centro, logo / 2 + 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(centro, centro, logo / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(marca, centro - logo / 2, centro - logo / 2, logo, logo);
      ctx.restore();
    }
  }

  // El pie lleva el nombre del RESTAURANTE, no el de TukiTuki: esta tarjeta la
  // imprime el dueño y acaba en su mesa, así que lo que tiene que leerse ahí es
  // lo suyo.
  ctx.fillStyle = TINTA_QR;
  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(recortarNombre(nombre), centro, ancho + pie / 2);

  return lienzo;
};

const escaparHtml = (texto: string) =>
  texto.replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[caracter] as string));

const descargarArchivo = (url: string, nombre: string) => {
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
};

/* -------------------------------------------------------------------------
   Botón de red social
   ------------------------------------------------------------------------- */

const TarjetaRed: React.FC<{
  nombre: string;
  icono: React.ReactNode;
  /** Si viene `href`, es un enlace; si no, es una acción. */
  href?: string;
  onClick?: () => void;
  titulo: string;
  /** Cambia la etiqueta mientras dura el acuse (p. ej. «Enlace copiado»). */
  acuse?: string;
}> = ({ nombre, icono, href, onClick, titulo, acuse }) => {
  const clases =
    'af-pulsar flex flex-col items-center justify-center gap-2 rounded-[18px] bg-af-ground px-2 py-4 ' +
    'text-xs font-semibold text-af-ink outline-none hover:bg-af-ink/[0.06]';

  const contenido = (
    <>
      {icono}
      <span className="truncate">{acuse ?? nombre}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={titulo} className={clases}>
        {contenido}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} title={titulo} className={clases}>
      {contenido}
    </button>
  );
};

/* ------------------------------------------------------------------------- */

interface SeccionDifusionProps {
  restaurante: Restaurante;
  /** Banda de avisos del panel. Si no llega, solo se callan los errores. */
  mostrarMensaje?: (tipo: 'exito' | 'error', texto: string) => void;
}

export const SeccionDifusion: React.FC<SeccionDifusionProps> = ({ restaurante, mostrarMensaje }) => {
  const slug = generarSlugUnico(restaurante.nombre, restaurante.id);
  const publicUrl = urlPublica(`/restaurante/${slug}`);
  const qrServicio = apiQR.generarCodigoQR(publicUrl, TINTA_QR, TARJETA.codigo).imagen_url;

  const [copiado, setCopiado] = useState<'enlace' | 'instagram' | null>(null);
  const [accion, setAccion] = useState<'descargar' | 'imprimir' | null>(null);
  /** Empieza siendo el código del generador y pasa a ser la tarjeta compuesta. */
  const [vistaTarjeta, setVistaTarjeta] = useState<string>(qrServicio);
  const temporizador = useRef<number | undefined>(undefined);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  /* La vista previa se compone con el mismo dibujo que se descarga, así que lo
     que se ve aquí es literalmente lo que sale del navegador. Hasta que el
     lienzo está listo —y si falla— queda el código tal cual lo sirve el
     generador: un QR igual de válido, no un hueco. */
  useEffect(() => {
    let vivo = true;
    dibujarTarjeta(qrServicio, restaurante.nombre, restaurante.imagen_logo_url)
      .then((lienzo) => { if (vivo) setVistaTarjeta(lienzo.toDataURL('image/png')); })
      .catch(() => { /* se queda el código del generador */ });
    return () => { vivo = false; };
  }, [qrServicio, restaurante.nombre, restaurante.imagen_logo_url]);

  const acusar = (origen: 'enlace' | 'instagram') => {
    setCopiado(origen);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setCopiado(null), 2000);
  };

  /* Copiar el enlace.
     La API moderna exige que la pestaña tenga el foco: cuando no lo tiene
     (pestaña en segundo plano, permiso denegado) se cae al método clásico,
     seleccionar el texto y copiarlo. Y si tampoco, el enlace queda seleccionado
     y el aviso dice qué hacer. Este es el botón principal de la pantalla; no
     puede quedarse mudo sin decir por qué. */
  const copiar = async (origen: 'enlace' | 'instagram') => {
    let listo = false;
    try {
      await navigator.clipboard.writeText(publicUrl);
      listo = true;
    } catch {
      entrada.current?.select();
      try { listo = document.execCommand('copy'); } catch { listo = false; }
    }

    if (listo) acusar(origen);
    else mostrarMensaje?.('error', 'El navegador no dejó copiar. El enlace ya está seleccionado: pulsa Ctrl+C.');
  };

  const descargar = async () => {
    setAccion('descargar');
    try {
      const lienzo = await dibujarTarjeta(qrServicio, restaurante.nombre, restaurante.imagen_logo_url);
      const url = await new Promise<string>((resolver, rechazar) => {
        lienzo.toBlob(
          (blob) => (blob ? resolver(URL.createObjectURL(blob)) : rechazar(new Error('sin imagen'))),
          'image/png',
        );
      });
      descargarArchivo(url, `QR-${slug}.png`);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      mostrarMensaje?.('error', 'No se pudo componer el QR con tu logo. Se abrió el código sin él.');
      window.open(qrServicio, '_blank');
    } finally {
      setAccion(null);
    }
  };

  const imprimir = async () => {
    setAccion('imprimir');
    try {
      const lienzo = await dibujarTarjeta(qrServicio, restaurante.nombre, restaurante.imagen_logo_url);
      const dataUrl = lienzo.toDataURL('image/png');
      const nombre = escaparHtml(restaurante.nombre);

      // `document.write` sobre una pestaña en blanco es lo único que permite
      // mandar la imagen a imprimir sin pasar por el servidor. La ventana se
      // cierra sola al terminar (o a los 20 s, si el dueño cancela el diálogo).
      const ventana = window.open('', '_blank');
      if (!ventana) {
        mostrarMensaje?.('error', 'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.');
        return;
      }

      ventana.document.write(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>QR · ${nombre}</title>
    <style>
      @page { margin: 12mm; }
      html, body { height: 100%; }
      body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
      img { display: block; width: 120mm; max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <img id="qr" src="${dataUrl}" alt="Código QR de ${nombre}" onload="imprimirAhora()" onerror="window.close()" />
    <script>
      function imprimirAhora() {
        setTimeout(function () { window.print(); }, 200);
      }
      /* Si la imagen venía en caché, ya estaba cargada antes de que este script
         corriera y su onload no se dispara: hay que preguntarlo. */
      window.onload = function () {
        var img = document.getElementById('qr');
        if (img && img.complete && img.naturalHeight !== 0) imprimirAhora();
      };
      window.onafterprint = function () {
        setTimeout(function () { window.close(); }, 200);
      };
      setTimeout(function () {
        if (document.visibilityState === 'visible') window.close();
      }, 20000);
    </script>
  </body>
</html>`);
      ventana.document.close();
    } catch {
      mostrarMensaje?.('error', 'No se pudo preparar el QR para imprimir.');
    } finally {
      setAccion(null);
    }
  };

  const mensaje = `¡Hola! Mira nuestro menú en ${restaurante.nombre}: ${publicUrl}`;
  const enlaceWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  const enlaceFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
  const enlaceX = `https://x.com/intent/tweet?text=${encodeURIComponent(mensaje)}`;

  return (
    /* Las dos columnas entran en `xl` y no en `lg` a propósito: el ancho de la
       tarjeta no crece con el de la ventana. Por debajo de `md` la barra
       lateral es un cajón (la tarjeta ocupa todo el ancho), de `md` a `xl` la
       barra ya come 288 px, y solo a partir de `xl` media tarjeta sigue
       siendo ancha. Cambiar de columna antes deja una tarjeta de 342 px con
       cuatro botones de red que no caben.
       El enlace y las redes se apilan en la columna izquierda —son las dos
       formas de repartir la misma dirección— y el QR se queda la derecha
       entera. Así las dos columnas miden parecido y no queda un bloque gris
       vacío debajo de la tarjeta corta. */
    <div className="grid gap-5 xl:grid-cols-2 xl:items-start">

      {/* ---------- El enlace ---------- */}
      <section className="rounded-[28px] bg-af-surface p-5 sm:p-6 xl:col-start-1 xl:row-start-1">
        <h2 className="text-base font-bold text-af-ink">Tu enlace público</h2>
        <p className="mt-1 text-sm leading-relaxed text-af-ink-secondary">
          Es la dirección de tu menú. No cambia aunque cambies los platos: siempre muestra lo que tengas publicado hoy.
        </p>

        {/* El enlace va en su propio renglón: es largo, y compartido con los
            botones se cortaba a la mitad justo donde importa. */}
        <div className="mt-4 flex flex-col gap-3">
          <Input
            ref={entrada}
            value={publicUrl}
            readOnly
            aria-label="Enlace público del menú"
            icon={<Link2 size={16} />}
            className="text-sm"
          />
          <div className="flex gap-3">
            <Boton
              onClick={() => copiar('enlace')}
              icono={copiado === 'enlace' ? <Check size={16} /> : <Copy size={16} />}
              className="flex-1 justify-center"
            >
              {copiado === 'enlace' ? 'Copiado' : 'Copiar enlace'}
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => window.open(publicUrl, '_blank', 'noopener')}
              icono={<ExternalLink size={16} />}
              className="flex-1 justify-center"
            >
              Abrir
            </Boton>
          </div>
        </div>
      </section>

      {/* ---------- El QR ---------- */}
      <section className="flex flex-col rounded-[28px] bg-af-surface p-5 sm:p-6 xl:col-start-2 xl:row-start-1 xl:row-end-3">
        <h2 className="text-base font-bold text-af-ink">Código QR</h2>
        <p className="mt-1 text-sm leading-relaxed text-af-ink-secondary">
          Imprímelo y ponlo en la mesa, en la barra o en el escaparate. Se abre con la cámara del celular.
        </p>

        {/* El papel se reserva con la proporción exacta del archivo (440×496)
            para que no haya salto de altura cuando llega el lienzo, y es
            blanco en los dos modos: es papel, y el QR impreso va sobre blanco.
            Dentro cabe cualquier versión del código sin deformarse. */}
        <div className="mx-auto mt-5 aspect-[440/496] w-full max-w-[272px] overflow-hidden rounded-[20px] bg-white">
          <img
            src={vistaTarjeta}
            alt={`Tarjeta con el código QR del menú de ${restaurante.nombre}`}
            className="block h-full w-full object-contain"
          />
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          <Boton
            variante="secundario"
            onClick={descargar}
            cargando={accion === 'descargar'}
            disabled={accion !== null}
            icono={<Download size={16} />}
          >
            Descargar PNG
          </Boton>
          <Boton
            variante="secundario"
            onClick={imprimir}
            cargando={accion === 'imprimir'}
            disabled={accion !== null}
            icono={<Printer size={16} />}
          >
            Imprimir
          </Boton>
        </div>
      </section>

      {/* ---------- Las redes ---------- */}
      <section className="flex flex-col rounded-[28px] bg-af-surface p-5 sm:p-6 xl:col-start-1 xl:row-start-2">
        <h2 className="text-base font-bold text-af-ink">Compartir</h2>
        <p className="mt-1 text-sm leading-relaxed text-af-ink-secondary">
          Un enlace, no una foto: quien lo abra ve tu carta completa y tus precios de hoy.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <TarjetaRed
            nombre="WhatsApp"
            titulo="Compartir el menú por WhatsApp"
            href={enlaceWhatsApp}
            icono={<LogoWhatsApp className="h-6 w-6" />}
          />
          <TarjetaRed
            nombre="Facebook"
            titulo="Compartir el menú en Facebook"
            href={enlaceFacebook}
            icono={<MarcaFacebook className="h-6 w-6" />}
          />
          <TarjetaRed
            nombre="X"
            titulo="Compartir el menú en X"
            href={enlaceX}
            icono={<MarcaX className="h-6 w-6" />}
          />
          <TarjetaRed
            nombre="Instagram"
            titulo="Copiar el enlace para pegarlo en Instagram"
            onClick={() => copiar('instagram')}
            acuse={copiado === 'instagram' ? 'Copiado' : undefined}
            icono={<MarcaInstagram className="h-6 w-6" />}
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-af-ink-secondary">
          Instagram no enlaza a páginas web, así que ahí el botón te copia la dirección para pegarla en tu biografía.
        </p>
      </section>
    </div>
  );
};
