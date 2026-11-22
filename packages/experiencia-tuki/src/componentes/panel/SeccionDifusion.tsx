import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Restaurante } from '../../tipos';
import { Boton, Input, LogoWhatsApp } from '../ui';
import {
  Copy, Check, Download, Printer, ExternalLink, Link2, Pipette, RotateCcw, Loader2,
} from 'lucide-react';
import { apiQR } from '../../api/misApis';
import { generarSlugUnico } from '../../lib/utils';
import { urlPublica } from '../../lib/urlPublica';

/* -------------------------------------------------------------------------
   Difusión: llevar el menú a la mesa y a las redes.

   La sección se lee de arriba abajo en el orden en el que se usa: primero el
   enlace y las redes (lo que se comparte) y después el QR, que es lo que se
   personaliza y se imprime. El QR ocupa el ancho completo porque ahora tiene
   dos mitades: la tarjeta y sus ajustes.
   ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   La tarjeta del QR

   La tarjeta se dibuja una sola vez y ese mismo lienzo alimenta la vista
   previa, la descarga y la impresión. Así lo que el dueño ve es exactamente
   lo que sale del navegador.
   ------------------------------------------------------------------------- */

/** Tinta por defecto: un negro suave, legible sobre papel. */
const TINTA_QR = '#111111';

type EstiloQR = 'clasico' | 'editorial' | 'etiqueta';

interface AjustesQR {
  /** Color de los módulos del QR y de los acentos de la tarjeta. */
  tinta: string;
  /** Fondo de la tarjeta. */
  fondo: string;
  estilo: EstiloQR;
  conLogo: boolean;
  conNombre: boolean;
  /** Frase corta bajo el código. */
  caption: string;
  /** Ancho del PNG final, en píxeles. */
  tamano: 600 | 900 | 1200;
}

const AJUSTES_QR: AjustesQR = {
  tinta: TINTA_QR,
  fondo: '#FFFFFF',
  estilo: 'clasico',
  conLogo: true,
  conNombre: true,
  caption: 'Escanea para ver nuestra carta',
  tamano: 900,
};

/** Alto del lienzo base (600 px de ancho) para cada estilo. */
const ALTO_BASE: Record<EstiloQR, number> = { clasico: 720, editorial: 700, etiqueta: 680 };

const FONDOS_QR = [
  { nombre: 'Blanco', color: '#FFFFFF' },
  { nombre: 'Crema', color: '#FBF8F4' },
  { nombre: 'Arena', color: '#F3EADF' },
];

/** Rojos, verdes y azules lo bastante oscuros para que la cámara lea. */
const TINTAS_QR = [
  { nombre: 'Negro', color: '#111111' },
  { nombre: 'Espresso', color: '#2B2421' },
  { nombre: 'Vino', color: '#5A1E24' },
  { nombre: 'Bosque', color: '#1F3A2E' },
  { nombre: 'Azul noche', color: '#1B2A4A' },
];

const ESTILOS_QR: { id: EstiloQR; nombre: string; pista: string }[] = [
  { id: 'clasico', nombre: 'Clásica', pista: 'Banda de color' },
  { id: 'editorial', nombre: 'Editorial', pista: 'Marco fino' },
  { id: 'etiqueta', nombre: 'Etiqueta', pista: 'Borde punteado' },
];

const TAMANOS_QR: { valor: AjustesQR['tamano']; nombre: string; pista: string }[] = [
  { valor: 600, nombre: '600 px', pista: 'Redes' },
  { valor: 900, nombre: '900 px', pista: 'Impresión' },
  { valor: 1200, nombre: '1200 px', pista: 'Alta' },
];

const TINTA_TEXTO = '#1F1B18';
const TINTA_SUAVE = '#6B625A';
const TITULO_FONT = '"Playfair Display", Georgia, serif';
const CUERPO_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const cargarImagen = (url: string) =>
  new Promise<HTMLImageElement>((resolver, rechazar) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error(`No se pudo cargar ${url}`));
    img.src = url;
  });

const recortarNombre = (nombre: string, maximo = 26) =>
  nombre.length <= maximo ? nombre : `${nombre.slice(0, maximo - 1).trimEnd()}.`;

const recortarTexto = (texto: string, maximo: number) =>
  texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1).trimEnd()}…`;

/** Rectángulo redondeado sin depender de `roundRect` (Safari antiguo). */
const rectRedondeado = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
) => {
  const r = Math.max(0, Math.min(radio, ancho / 2, alto / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + ancho - r, y);
  ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + r);
  ctx.lineTo(x + ancho, y + alto - r);
  ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto);
  ctx.lineTo(x + r, y + alto);
  ctx.quadraticCurveTo(x, y + alto, x, y + alto - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const luminancia = (hex: string): number => {
  const limpio = hex.replace('#', '');
  const completo = limpio.length === 3
    ? limpio.split('').map((c) => c + c).join('')
    : limpio.padEnd(6, '0').slice(0, 6);
  const canales = [0, 2, 4].map((i) => {
    const valor = Number.parseInt(completo.slice(i, i + 2), 16) / 255;
    return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (canales[0] ?? 0) + 0.7152 * (canales[1] ?? 0) + 0.0722 * (canales[2] ?? 0);
};

const contraste = (a: string, b: string): number => {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const textoSobre = (fondo: string): string => (luminancia(fondo) > 0.5 ? TINTA_TEXTO : '#FFFFFF');

const claveAjustes = (restauranteId: string) => `tuki.qr.${restauranteId}`;

const leerAjustes = (restauranteId: string): AjustesQR => {
  try {
    const crudo = localStorage.getItem(claveAjustes(restauranteId));
    if (!crudo) return AJUSTES_QR;
    const datos = JSON.parse(crudo) as Partial<AjustesQR>;
    const tinta = typeof datos.tinta === 'string' && contraste(datos.tinta, '#FFFFFF') >= 4.5
      ? datos.tinta
      : AJUSTES_QR.tinta;
    return {
      ...AJUSTES_QR,
      ...datos,
      tinta,
      fondo: FONDOS_QR.some((f) => f.color === datos.fondo) ? (datos.fondo as string) : AJUSTES_QR.fondo,
      estilo: ESTILOS_QR.some((e) => e.id === datos.estilo) ? (datos.estilo as EstiloQR) : 'clasico',
      tamano: datos.tamano === 600 || datos.tamano === 900 || datos.tamano === 1200
        ? datos.tamano
        : 900,
      caption: typeof datos.caption === 'string'
        ? datos.caption.slice(0, 60)
        : AJUSTES_QR.caption,
    };
  } catch {
    return AJUSTES_QR;
  }
};

/**
 * Dibuja la tarjeta imprimible en un lienzo de 600 px de ancho base y lo
 * escala al tamaño de descarga elegido.
 */
const dibujarTarjeta = async (
  codigoUrl: string,
  nombre: string,
  logoUrl: string | null | undefined,
  ajustes: AjustesQR,
  enlace: string,
) => {
  const escala = ajustes.tamano / 600;
  const alto = ALTO_BASE[ajustes.estilo];

  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(600 * escala);
  lienzo.height = Math.round(alto * escala);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No se pudo dibujar el QR');

  ctx.scale(escala, escala);
  ctx.fillStyle = ajustes.fondo;
  ctx.fillRect(0, 0, 600, alto);

  const qr = await cargarImagen(codigoUrl);
  const tinta = ajustes.tinta;
  const sobreTinta = textoSobre(tinta);
  const nombreCorto = recortarNombre(nombre, 26);
  const caption = recortarTexto(ajustes.caption.trim() || AJUSTES_QR.caption, 58);
  const enlaceCorto = recortarTexto(enlace.replace(/^https?:\/\//, ''), 46);

  const panelQr = (x: number, y: number, tam: number, radio: number) => {
    ctx.save();
    ctx.shadowColor = 'rgba(24, 18, 12, 0.16)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    rectRedondeado(ctx, x, y, tam, tam, radio);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    const margen = 22;
    ctx.drawImage(qr, x + margen, y + margen, tam - margen * 2, tam - margen * 2);
    return { cx: x + tam / 2, cy: y + tam / 2 };
  };

  const dibujarLogo = async (cx: number, cy: number) => {
    if (!ajustes.conLogo) return;
    const radio = 42;
    // El logo solo se puede recortar en el lienzo si su servidor manda CORS (o
    // si es del mismo origen, como en el clúster). Cuando no llega, el centro
    // no se queda vacío: va la inicial del restaurante, dibujada aquí mismo.
    const marca = logoUrl ? await cargarImagen(logoUrl).catch(() => null) : null;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, radio + 8, 0, Math.PI * 2);
    ctx.fill();

    if (marca) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radio, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(marca, cx - radio, cy - radio, radio * 2, radio * 2);
      ctx.restore();
      return;
    }

    ctx.strokeStyle = tinta;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = tinta;
    ctx.font = `700 46px ${TITULO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((nombre.trim()[0] || 'T').toUpperCase(), cx, cy + 3);
  };

  if (ajustes.estilo === 'clasico') {
    ctx.fillStyle = tinta;
    ctx.fillRect(0, 0, 600, 118);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = sobreTinta;
    ctx.font = `700 12px ${CUERPO_FONT}`;
    ctx.fillText('MENÚ DIGITAL', 48, ajustes.conNombre ? 42 : 59);
    if (ajustes.conNombre) {
      ctx.font = `700 30px ${TITULO_FONT}`;
      ctx.fillText(nombreCorto, 48, 79);
    }

    const centro = panelQr(72, 148, 456, 30);
    await dibujarLogo(centro.cx, centro.cy);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = TINTA_TEXTO;
    ctx.font = `600 17px ${CUERPO_FONT}`;
    ctx.fillText(caption, 300, 646);
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font = `500 12px ${CUERPO_FONT}`;
    ctx.fillText(enlaceCorto, 300, 676);
    ctx.fillStyle = tinta;
    rectRedondeado(ctx, 270, 700, 60, 4, 2);
    ctx.fill();
  } else if (ajustes.estilo === 'editorial') {
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 2;
    rectRedondeado(ctx, 24, 24, 552, 650, 24);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = tinta;
    ctx.font = `700 12px ${CUERPO_FONT}`;
    ctx.fillText('MENÚ DIGITAL', 300, 68);

    const centro = panelQr(96, 94, 408, 18);
    await dibujarLogo(centro.cx, centro.cy);

    if (ajustes.conNombre) {
      ctx.fillStyle = TINTA_TEXTO;
      ctx.font = `700 30px ${TITULO_FONT}`;
      ctx.fillText(nombreCorto, 300, 558);
    }
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font = `500 15px ${CUERPO_FONT}`;
    ctx.fillText(caption, 300, ajustes.conNombre ? 600 : 572);
    ctx.font = `500 11px ${CUERPO_FONT}`;
    ctx.fillText(enlaceCorto, 300, ajustes.conNombre ? 630 : 602);
  } else {
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 2;
    rectRedondeado(ctx, 30, 30, 540, 620, 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = tinta;
    rectRedondeado(ctx, 216, 54, 168, 34, 17);
    ctx.fill();
    ctx.fillStyle = sobreTinta;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 11px ${CUERPO_FONT}`;
    ctx.fillText('MENÚ DIGITAL', 300, 71);

    const centro = panelQr(110, 112, 380, 20);
    await dibujarLogo(centro.cx, centro.cy);

    if (ajustes.conNombre) {
      ctx.fillStyle = TINTA_TEXTO;
      ctx.font = `700 27px ${TITULO_FONT}`;
      ctx.fillText(nombreCorto, 300, 550);
    }
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font = `500 14px ${CUERPO_FONT}`;
    ctx.fillText(caption, 300, ajustes.conNombre ? 592 : 564);
    ctx.font = `500 11px ${CUERPO_FONT}`;
    ctx.fillText(enlaceCorto, 300, ajustes.conNombre ? 620 : 592);
  }

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
   Piezas de la personalización
   ------------------------------------------------------------------------- */

const Etiqueta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-af-ink-secondary">
    {children}
  </span>
);

/** Miniatura del estilo: un QR de mentira con la tinta elegida. */
const MiniEstilo: React.FC<{ estilo: EstiloQR; tinta: string }> = ({ estilo, tinta }) => {
  const modulos: React.CSSProperties = {
    backgroundImage: `repeating-conic-gradient(${tinta} 0% 25%, #fff 0% 50%)`,
    backgroundSize: '5px 5px',
  };

  return (
    <span className="flex h-12 w-full items-center justify-center rounded-[8px] bg-white p-1">
      {estilo === 'clasico' && (
        <span className="flex h-full w-full flex-col items-center gap-[3px] rounded-[3px] p-[3px]">
          <span className="h-[6px] w-full rounded-[2px]" style={{ background: tinta }} />
          <span className="h-[22px] w-[22px]" style={modulos} />
        </span>
      )}
      {estilo === 'editorial' && (
        <span
          className="flex h-full w-full items-center justify-center rounded-[3px] border"
          style={{ borderColor: tinta }}
        >
          <span className="h-[22px] w-[22px]" style={modulos} />
        </span>
      )}
      {estilo === 'etiqueta' && (
        <span
          className="flex h-full w-full flex-col items-center justify-center gap-[3px] rounded-[3px] border border-dashed"
          style={{ borderColor: tinta }}
        >
          <span className="h-[5px] w-[16px] rounded-full" style={{ background: tinta }} />
          <span className="h-[20px] w-[20px]" style={modulos} />
        </span>
      )}
    </span>
  );
};

const Interruptor: React.FC<{
  activo: boolean;
  onCambiar: (valor: boolean) => void;
  etiqueta: string;
  descripcion: string;
  /** Sin logo cargado el interruptor se apaga: no hay nada que mostrar. */
  deshabilitado?: boolean;
}> = ({ activo, onCambiar, etiqueta, descripcion, deshabilitado = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={activo}
    disabled={deshabilitado}
    onClick={() => onCambiar(!activo)}
    className={`af-pulsar flex w-full items-center justify-between gap-3 rounded-[14px] bg-af-ground px-3 py-2.5 text-left outline-none ${
      deshabilitado ? 'cursor-not-allowed opacity-55' : ''
    }`}
  >
    <span className="min-w-0">
      <span className="block text-xs font-semibold text-af-ink">{etiqueta}</span>
      <span className="block text-[11px] leading-snug text-af-ink-secondary">{descripcion}</span>
    </span>
    <span
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        activo ? 'bg-af-accent' : 'bg-af-ink/20'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
          activo ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </span>
  </button>
);

/* -------------------------------------------------------------------------
   Botón de red social
   ------------------------------------------------------------------------- */

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

  const [copiado, setCopiado] = useState<'enlace' | 'instagram' | null>(null);
  const [accion, setAccion] = useState<'descargar' | 'imprimir' | null>(null);
  const [ajustes, setAjustes] = useState<AjustesQR>(() => leerAjustes(restaurante.id));
  const [componiendo, setComponiendo] = useState(true);
  const [vistaTarjeta, setVistaTarjeta] = useState<string>('');
  const temporizador = useRef<number | undefined>(undefined);
  const entrada = useRef<HTMLInputElement>(null);

  /* El código se pide con la tinta y el tamaño elegidos: el mismo QR, pero con
     otra resolución para que la descarga grande no salga pixelada. */
  const qrServicio = useMemo(() => {
    const resolucion = Math.min(1000, Math.max(600, ajustes.tamano));
    return apiQR.generarCodigoQR(publicUrl, ajustes.tinta, resolucion).imagen_url;
  }, [publicUrl, ajustes.tinta, ajustes.tamano]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  /* Los ajustes son del restaurante y viven en su navegador: no hay por qué
     guardarlos en el servidor ni compartirlos con los demás locales. */
  useEffect(() => {
    try {
      localStorage.setItem(claveAjustes(restaurante.id), JSON.stringify(ajustes));
    } catch {
      /* modo privado sin almacenamiento: la tarjeta sigue funcionando */
    }
  }, [restaurante.id, ajustes]);

  /* La vista previa se compone con el mismo dibujo que se descarga, así que lo
     que se ve aquí es literalmente lo que sale del navegador. Mientras compone
     —y si falla— queda el código tal cual lo sirve el generador: un QR igual
     de válido, no un hueco. */
  useEffect(() => {
    let vivo = true;
    setComponiendo(true);
    /* Un respiro al mover el selector de color: no hace falta redibujar en
       cada píxel que recorre el dedo. */
    const espera = window.setTimeout(() => {
      dibujarTarjeta(qrServicio, restaurante.nombre, restaurante.imagen_logo_url, ajustes, publicUrl)
        .then((lienzo) => {
          if (!vivo) return;
          setVistaTarjeta(lienzo.toDataURL('image/png'));
          setComponiendo(false);
        })
        .catch(() => {
          if (!vivo) return;
          setVistaTarjeta(qrServicio);
          setComponiendo(false);
        });
    }, 120);
    return () => {
      vivo = false;
      window.clearTimeout(espera);
    };
  }, [qrServicio, restaurante.nombre, restaurante.imagen_logo_url, ajustes, publicUrl]);

  const ajustar = <K extends keyof AjustesQR>(clave: K, valor: AjustesQR[K]) =>
    setAjustes((previo) => ({ ...previo, [clave]: valor }));

  /* Un QR claro se lee mal: el contraste mínimo con el blanco del panel es el
     mismo que exige cualquier lector. */
  const elegirTinta = (color: string) => {
    if (contraste(color, '#FFFFFF') < 4.5) {
      mostrarMensaje?.('error', 'Ese color es demasiado claro y el QR no se leería. Elige uno más oscuro.');
      return;
    }
    ajustar('tinta', color);
  };

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
      const lienzo = await dibujarTarjeta(qrServicio, restaurante.nombre, restaurante.imagen_logo_url, ajustes, publicUrl);
      const url = await new Promise<string>((resolver, rechazar) => {
        lienzo.toBlob(
          (blob) => (blob ? resolver(URL.createObjectURL(blob)) : rechazar(new Error('sin imagen'))),
          'image/png',
        );
      });
      descargarArchivo(url, `QR-${slug}-${ajustes.tamano}.png`);
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
      const lienzo = await dibujarTarjeta(qrServicio, restaurante.nombre, restaurante.imagen_logo_url, ajustes, publicUrl);
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
    <div className="grid gap-5">

      {/* ---------- Enlace y redes ---------- */}
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">

        <section className="rounded-[24px] border border-af/10 bg-af-surface p-5 sm:p-6">
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

        <section className="flex flex-col rounded-[24px] border border-af/10 bg-af-surface p-5 sm:p-6">
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

      {/* ---------- El QR ---------- */}
      <section className="rounded-[24px] border border-af/10 bg-af-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-af-ink">Tu código QR</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-af-ink-secondary">
              Imprímelo y ponlo en la mesa, en la barra o en el escaparate. Es el mismo enlace de tu menú,
              con el color y el estilo que elijas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAjustes(AJUSTES_QR)}
            className="af-pulsar inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-af-ink-secondary outline-none hover:text-af-ink"
          >
            <RotateCcw size={13} />
            Restablecer
          </button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr] lg:items-start">

          {/* --- La tarjeta y sus acciones --- */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[300px] rounded-[20px] bg-af-ground p-2 shadow-warm">
              <div
                className="relative w-full overflow-hidden rounded-[14px] bg-white"
                style={{ aspectRatio: `600 / ${ALTO_BASE[ajustes.estilo]}` }}
              >
                {vistaTarjeta && (
                  <img
                    src={vistaTarjeta}
                    alt={`Tarjeta con el código QR del menú de ${restaurante.nombre}`}
                    className="block h-full w-full object-contain"
                  />
                )}
                {componiendo && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/55 text-af-ink-secondary">
                    <Loader2 size={18} className="animate-spin" />
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex w-full max-w-[300px] flex-wrap gap-2">
              <Boton
                variante="secundario"
                onClick={descargar}
                cargando={accion === 'descargar'}
                disabled={accion !== null}
                icono={<Download size={16} />}
                className="flex-1 justify-center"
              >
                PNG
              </Boton>
              <Boton
                variante="secundario"
                onClick={imprimir}
                cargando={accion === 'imprimir'}
                disabled={accion !== null}
                icono={<Printer size={16} />}
                className="flex-1 justify-center"
              >
                Imprimir
              </Boton>
            </div>
            <p className="mt-2 text-center text-[11px] leading-snug text-af-ink-secondary">
              {TAMANOS_QR.find((t) => t.valor === ajustes.tamano)?.nombre} · PNG listo para imprimir
            </p>
          </div>

          {/* --- Los ajustes --- */}
          <div className="grid gap-5 sm:grid-cols-2">

            <div className="sm:col-span-2">
              <Etiqueta>Estilo de la tarjeta</Etiqueta>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ESTILOS_QR.map(({ id, nombre, pista }) => {
                  const activo = ajustes.estilo === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => ajustar('estilo', id)}
                      aria-pressed={activo}
                      className={`af-pulsar rounded-[14px] border p-2 text-left outline-none transition-colors ${
                        activo
                          ? 'border-af-accent bg-af-accent-soft'
                          : 'border-af/15 bg-af-ground hover:border-af/30'
                      }`}
                    >
                      <MiniEstilo estilo={id} tinta={ajustes.tinta} />
                      <span className="mt-1.5 block truncate text-[11px] font-semibold text-af-ink">{nombre}</span>
                      <span className="block truncate text-[10px] text-af-ink-secondary">{pista}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Etiqueta>Color del código</Etiqueta>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {TINTAS_QR.map(({ nombre, color }) => {
                  const activo = ajustes.tinta.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => elegirTinta(color)}
                      title={nombre}
                      aria-label={`Color ${nombre}`}
                      aria-pressed={activo}
                      className={`af-pulsar h-8 w-8 rounded-full outline-none ring-offset-2 ring-offset-af-surface ${
                        activo ? 'ring-2 ring-af-ink' : 'ring-1 ring-af/20 hover:ring-af/40'
                      }`}
                      style={{ background: color }}
                    />
                  );
                })}
                <label
                  className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-af-ink/30 text-af-ink-secondary hover:text-af-ink"
                  title="Elegir otro color"
                >
                  <Pipette size={14} />
                  <input
                    type="color"
                    value={ajustes.tinta}
                    onChange={(e) => elegirTinta(e.target.value)}
                    aria-label="Elegir otro color para el código"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-af-ink-secondary">
                Elige tonos oscuros: si el código se aclara, la cámara no lo lee.
              </p>
            </div>

            <div>
              <Etiqueta>Fondo</Etiqueta>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {FONDOS_QR.map(({ nombre, color }) => {
                  const activo = ajustes.fondo.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => ajustar('fondo', color)}
                      title={nombre}
                      aria-label={`Fondo ${nombre}`}
                      aria-pressed={activo}
                      className={`af-pulsar flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold outline-none ring-offset-2 ring-offset-af-surface ${
                        activo ? 'ring-2 ring-af-ink' : 'ring-1 ring-af/20 hover:ring-af/40'
                      }`}
                      style={{ background: color, color: '#2B2421' }}
                    >
                      {activo && <Check size={12} />}
                      {nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
              <Interruptor
                activo={ajustes.conLogo}
                onCambiar={(v) => ajustar('conLogo', v)}
                etiqueta="Marca al centro"
                descripcion={restaurante.imagen_logo_url
                  ? 'Tu logo, o tu inicial si no se puede cargar.'
                  : 'La inicial de tu restaurante.'}
              />
              <Interruptor
                activo={ajustes.conNombre}
                onCambiar={(v) => ajustar('conNombre', v)}
                etiqueta="Nombre visible"
                descripcion="Escribe el nombre en la tarjeta."
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="qr-caption" className="block">
                <Etiqueta>Frase bajo el código</Etiqueta>
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="qr-caption"
                  value={ajustes.caption}
                  maxLength={60}
                  onChange={(e) => ajustar('caption', e.target.value)}
                  placeholder={AJUSTES_QR.caption}
                  className="text-sm"
                />
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-af-ink-secondary">
                  {ajustes.caption.length}/60
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="qr-tamano" className="block">
                <Etiqueta>Tamaño del archivo</Etiqueta>
              </label>
              <select
                id="qr-tamano"
                value={ajustes.tamano}
                onChange={(e) => ajustar('tamano', Number(e.target.value) as AjustesQR['tamano'])}
                className="input-af mt-2 h-11 w-full text-sm"
              >
                {TAMANOS_QR.map(({ valor, nombre, pista }) => (
                  <option key={valor} value={valor}>{nombre} · {pista}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <p className="text-[11px] leading-snug text-af-ink-secondary">
                La vista previa, el PNG y la impresión salen del mismo dibujo: lo que ves aquí es lo que se imprime.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
