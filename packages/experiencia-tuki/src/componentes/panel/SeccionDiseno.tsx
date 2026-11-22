import React, { useEffect, useState } from 'react';
import { Tema, EstiloPlantilla } from '../../tipos';
import {
    Layout, List, Minus, Grid3x3, Image as ImageIcon, Check,
    GalleryHorizontal, LayoutGrid, Columns2, Rows3, Sun, Moon, Star,
} from 'lucide-react';
import { derivarPaleta, textoSobre, conLuminosidad, type PaletaDerivada } from '../../lib/color';
import { cargarCatalogoFuentes, PARES_FUENTES, parDeTema } from '../../lib/fuentes';
import { MARCOS } from '../restaurante/estructuras';
import {
    PALETAS, FAMILIAS, aBase,
    type Paleta, type FamiliaPaleta, type JuegoColores,
} from './paletas';

interface SeccionDisenoProps {
    tema: Tema;
    aplicarTema: (t: Partial<Tema>) => void;
    guardando: boolean;
}

/* ------------------------------------------------------------------ *
 *  Miniaturas: cada estructura con su propio gesto, y los colores reales
 *
 *  No es un dibujo aparte: usa la MISMA derivación que la página
 *  (derivarPaleta), así que lo que se ve aquí es exactamente lo que verá
 *  el cliente, incluidos el precio, los tintes y los bordes corregidos.
 *
 *  Cada miniatura copia el gesto de su plantilla —la línea de puntos de la
 *  carta, la foto redonda del minimal, la tarjeta que se corta en la vitrina,
 *  el muro sin canalillos del mosaico— para que las nueve se reconozcan de un
 *  vistazo y ninguna prometa algo que su página no cumpla. Sin cajas de 1 px
 *  ni contornos: la forma la dice el tono, no la línea.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 *  Piezas de la miniatura
 *
 *  Dos gestos, idénticos en las nueve estructuras, porque son los dos que
 *  dan oficio a los cuatro colores de la paleta: la píldora del precio
 *  (Tinte) y la marca del plato de la casa (Apoyo). Cada forma los dice a su
 *  manera —píldora donde hay tarjeta, estrella donde solo hay aire—, igual
 *  que su plantilla.
 * ------------------------------------------------------------------ */

/** El precio, en píldora teñida: la etiqueta suave del menú. */
const PildoraPrecio: React.FC<{ tinte: string; tinta: string; className?: string; ancho?: string }> = ({
    tinte, tinta, className = '', ancho = 'w-3',
}) => (
    <span className={`flex shrink-0 items-center rounded-full px-1 py-[3px] ${className}`} style={{ backgroundColor: tinte }}>
        <span className={`h-1 ${ancho} rounded-full`} style={{ backgroundColor: tinta }} />
    </span>
);

/** El plato de la casa en las estructuras de tarjeta: la píldora del Apoyo. */
const PildoraCasa: React.FC<{ fondo: string; tinta: string; className?: string }> = ({ fondo, tinta, className = '' }) => (
    <span className={`flex w-7 shrink-0 items-center justify-center rounded-full py-[4px] ${className}`} style={{ backgroundColor: fondo }}>
        <span className="h-1 w-3.5 rounded-full" style={{ backgroundColor: tinta }} />
    </span>
);

/** El mismo plato de la casa en las estructuras austeras: la estrella. */
const EstrellaCasa: React.FC<{ color: string }> = ({ color }) => (
    <Star size={7} strokeWidth={3} fill="currentColor" className="shrink-0" style={{ color }} />
);

const MiniMenu: React.FC<{ tipo: EstiloPlantilla; paleta: PaletaDerivada }> = ({ tipo, paleta }) => {
    const { bg, surface, border, accentSoft, primary, secondary, text, muted, accentText, secondaryText, secondarySoft } = paleta;
    /** Tinta que se lee encima de cada color de marca, para el texto sobre las fotos. */
    const tintaFoto = textoSobre(primary);
    const tintaApoyo = textoSobre(secondary);

    /* Carta impresa: título centrado, dos columnas y la línea de puntos que
       lleva la vista del nombre al precio. */
    if (tipo === 'carta') {
        return (
            <div className="flex h-full w-full flex-col items-center px-3 py-3" style={{ backgroundColor: bg }}>
                <div className="mb-3 h-2.5 w-[44%] shrink-0 rounded-full" style={{ backgroundColor: text }} />
                <div className="flex w-full flex-1 gap-4">
                    {[0, 1].map((columna) => (
                        <div key={columna} className="flex flex-1 flex-col justify-around">
                            {[0, 1, 2].map((fila) => (
                                <div key={fila} className="flex items-center gap-2">
                                    <div className="h-4 w-4 shrink-0 rounded-[5px]" style={{ backgroundColor: primary }} />
                                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                        {columna === 0 && fila === 0 && <EstrellaCasa color={secondaryText} />}
                                        <div className="h-1.5 w-1/2 shrink-0 rounded-full" style={{ backgroundColor: text }} />
                                        <div className="min-w-[8px] flex-1 border-b border-dotted" style={{ borderColor: border }} />
                                        <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* Minimal: pocos platos, tipografía grande, foto redonda y aire. Ningún
       contenedor compite con el nombre, así que no hay ni una caja. */
    if (tipo === 'minimalista') {
        return (
            <div className="flex h-full w-full flex-col justify-center gap-4 px-5" style={{ backgroundColor: bg }}>
                <div className="space-y-2">
                    <div className="h-3 w-[62%] rounded-full" style={{ backgroundColor: text }} />
                    <div className="h-1.5 w-[20%] rounded-full" style={{ backgroundColor: muted }} />
                </div>
                <div className="space-y-3.5">
                    {[0, 1].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: primary }} />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        {i === 0 && <EstrellaCasa color={secondaryText} />}
                                        <div className="h-2 w-[46%] shrink-0 rounded-full" style={{ backgroundColor: text }} />
                                    </div>
                                    <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} ancho="w-3.5" />
                                </div>
                                <div className="h-1 w-[64%] rounded-full" style={{ backgroundColor: muted }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* Editorial: sin cabecera, la apertura ancha abre la sección pegada al
       borde y debajo cae la retícula de retratos. */
    if (tipo === 'grid') {
        return (
            <div className="flex h-full w-full flex-col gap-2.5 p-3" style={{ backgroundColor: bg }}>
                <div className="relative shrink-0 overflow-hidden rounded-[8px]" style={{ backgroundColor: primary, flex: '0 0 34%' }}>
                    <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-2 top-2" />
                    <div className="absolute inset-x-3 bottom-2.5 space-y-1.5">
                        <div className="h-2 w-[40%] rounded-full" style={{ backgroundColor: tintaFoto }} />
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-[24%] rounded-full" style={{ backgroundColor: tintaFoto, opacity: 0.65 }} />
                            <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} className="ml-auto" />
                        </div>
                    </div>
                </div>
                <div className="grid flex-1 grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="relative rounded-[6px]" style={{ backgroundColor: primary }}>
                            {i === 2 && <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-1 top-1" />}
                            <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} className="absolute bottom-1 left-1" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* Vitrina: sin cabecera, la estantería arranca arriba y se corta a la
       derecha, para que se vea que sigue. */
    if (tipo === 'vitrina') {
        return (
            <div className="flex h-full w-full gap-2.5 overflow-hidden p-3" style={{ backgroundColor: bg }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex w-[58%] shrink-0 flex-col overflow-hidden rounded-[9px]" style={{ backgroundColor: surface }}>
                        <div className="relative h-[50%] shrink-0" style={{ backgroundColor: primary }}>
                            {i === 1 && <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-1.5 top-1.5" />}
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-2 px-2.5">
                            <div className="h-1.5 w-[80%] rounded-full" style={{ backgroundColor: text }} />
                            <div className="flex items-center justify-between gap-1.5">
                                <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} />
                                <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: primary }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* Mosaico: muro sin canalillos, sin título y con una pieza de doble
       tamaño. Es el único que llega casi al borde de la tarjeta. */
    if (tipo === 'mosaico') {
        return (
            <div className="grid h-full w-full grid-cols-4 grid-rows-3 gap-[3px] p-1.5" style={{ backgroundColor: bg }}>
                <div className="relative col-span-2 row-span-2 overflow-hidden rounded-[4px]" style={{ backgroundColor: primary }}>
                    <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-1.5 top-1.5" />
                    <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} className="absolute bottom-1.5 left-1.5" />
                </div>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="rounded-[4px]" style={{ backgroundColor: primary }} />
                ))}
            </div>
        );
    }

    /* Díptico: sin cabecera, las dos franjas partidas llenan el alto entero y
       la foto cambia de lado. Ese zigzag no lo tiene ninguna otra. */
    if (tipo === 'diptico') {
        return (
            <div className="flex h-full w-full flex-col gap-2.5 p-3" style={{ backgroundColor: bg }}>
                {[0, 1].map((i) => (
                    <div key={i} className="flex flex-1 overflow-hidden rounded-[10px]" style={{ backgroundColor: surface }}>
                        <div
                            className="relative w-1/2 shrink-0"
                            style={{ backgroundColor: primary, order: i === 1 ? 2 : 0 }}
                        >
                            {i === 1 && <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-2 top-2" />}
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-2 px-3.5">
                            <div className="h-2 w-[78%] rounded-full" style={{ backgroundColor: text }} />
                            <div className="h-1.5 w-[52%] rounded-full" style={{ backgroundColor: muted }} />
                            <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} className="self-start" ancho="w-3.5" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* Compacta: índice fijo a la izquierda y la lista más densa del conjunto:
       seis filas de una línea, con paso de tono en vez de reglas. */
    if (tipo === 'compacta') {
        return (
            <div className="flex h-full w-full gap-3 px-2.5 py-2.5" style={{ backgroundColor: bg }}>
                <div className="flex w-[22%] shrink-0 flex-col gap-2 pt-1">
                    <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: accentText }} />
                    <div className="h-1 w-4/5 rounded-full" style={{ backgroundColor: muted }} />
                    <div className="h-1 w-3/5 rounded-full" style={{ backgroundColor: muted }} />
                    <div className="h-1 w-4/5 rounded-full" style={{ backgroundColor: muted }} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-2 h-1.5 w-[45%] shrink-0 rounded-full" style={{ backgroundColor: text }} />
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="flex flex-1 items-center gap-2 rounded-[5px] px-1.5"
                            style={{ backgroundColor: i % 2 === 1 ? surface : 'transparent' }}
                        >
                            <div className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: primary }} />
                            <div
                                className="h-1 flex-1 rounded-full"
                                style={{ backgroundColor: i % 2 === 1 ? muted : text }}
                            />
                            {i === 1 && <EstrellaCasa color={secondaryText} />}
                            <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* Inmersivo: título centrado y dos fotos grandes con el texto encima.
       Manda la imagen; no hay ni una tarjeta. */
    if (tipo === 'inmersivo') {
        return (
            <div className="flex h-full w-full flex-col items-center px-3 py-3" style={{ backgroundColor: bg }}>
                <div className="mb-3 h-2.5 w-[46%] shrink-0 rounded-full" style={{ backgroundColor: text }} />
                <div className="grid w-full flex-1 grid-cols-2 gap-2.5">
                    {[0, 1].map((i) => (
                        <div key={i} className="relative overflow-hidden rounded-[10px]" style={{ backgroundColor: primary }}>
                            {i === 0 && <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-2 top-2" />}
                            <div className="absolute inset-x-2.5 bottom-2.5 space-y-1.5">
                                <div className="h-2 w-[72%] rounded-full" style={{ backgroundColor: tintaFoto }} />
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-[45%] rounded-full" style={{ backgroundColor: tintaFoto, opacity: 0.7 }} />
                                    <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} className="ml-auto" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* Tarjetas: sin cabecera, la rejilla regular llena el marco entero —foto
       arriba y nombre, descripción y precio dentro de cada tarjeta—. */
    return (
        <div className="grid h-full w-full grid-cols-3 gap-2.5 p-3" style={{ backgroundColor: bg }}>
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-[9px]" style={{ backgroundColor: surface }}>
                    <div className="relative h-[48%] shrink-0" style={{ backgroundColor: primary }}>
                        {i === 1 && <PildoraCasa fondo={secondary} tinta={tintaApoyo} className="absolute left-1 top-1" />}
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-1.5 p-2">
                        <div className="h-1.5 w-[85%] rounded-full" style={{ backgroundColor: text }} />
                        <div className="h-1 w-[60%] rounded-full" style={{ backgroundColor: muted }} />
                        <PildoraPrecio tinte={secondarySoft} tinta={secondaryText} className="self-start" />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ *
 *  Portada de la miniatura
 *
 *  Cada estructura enseña su portada real (partida, tipográfica, bento,
 *  inmersiva, escaparate, collage, díptico o compacta) sobre el menú. Así la
 *  tarjeta del panel promete exactamente la página que se va a publicar.
 * ------------------------------------------------------------------ */

const MiniPortada: React.FC<{ tipo: EstiloPlantilla; paleta: PaletaDerivada }> = ({ tipo, paleta }) => {
    const { bg, surface, border, accentSoft, primary, text, muted, accentText, title, onPrimary } = paleta;
    const portada = MARCOS[tipo].portada;
    const foto = `linear-gradient(135deg, ${primary} 0%, ${accentText} 100%)`;

    const Titulo: React.FC<{ ancho?: string; alto?: string }> = ({ ancho = 'w-3/4', alto = 'h-2' }) => (
        <div className={`${ancho} ${alto} rounded-full`} style={{ backgroundColor: title }} />
    );
    const Linea: React.FC<{ ancho?: string }> = ({ ancho = 'w-1/2' }) => (
        <div className={`${ancho} h-1 rounded-full`} style={{ backgroundColor: muted }} />
    );
    const Boton: React.FC<{ claro?: boolean }> = ({ claro = false }) => (
        <div className="h-3 w-10 rounded-full" style={{ backgroundColor: claro ? surface : accentText }} />
    );

    switch (portada) {
        case 'editorial':
            return (
                <div className="flex h-full w-full items-center gap-2 p-2" style={{ backgroundColor: bg }}>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="h-1 w-8 rounded-full" style={{ backgroundColor: accentText }} />
                        <Titulo ancho="w-full" alto="h-3" />
                        <Titulo ancho="w-2/3" alto="h-3" />
                        <Linea ancho="w-4/5" />
                        <div className="mt-1 flex gap-1"><Boton /><Boton claro /></div>
                    </div>
                    <div className="h-full w-[42%] rounded-[2px]" style={{ backgroundImage: foto }} />
                </div>
            );
        case 'tipografico':
            return (
                <div className="flex h-full w-full flex-col justify-between p-2" style={{ backgroundColor: bg }}>
                    <div className="h-1 w-10 rounded-full" style={{ backgroundColor: muted }} />
                    <div className="space-y-1">
                        <div className="h-4 w-11/12 rounded-full" style={{ backgroundColor: title }} />
                        <div className="h-4 w-2/3 rounded-full" style={{ backgroundColor: title }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Linea ancho="w-1/3" />
                        <div className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: accentText }} />
                    </div>
                </div>
            );
        case 'bento':
            return (
                <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1 p-1.5" style={{ backgroundColor: bg }}>
                    <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[5px] p-1.5" style={{ backgroundColor: primary }}>
                        <div className="h-1 w-6 rounded-full" style={{ backgroundColor: onPrimary, opacity: 0.6 }} />
                        <div className="space-y-1">
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: onPrimary }} />
                            <div className="h-1 w-7 rounded-full" style={{ backgroundColor: onPrimary, opacity: 0.6 }} />
                        </div>
                    </div>
                    <div className="rounded-[5px]" style={{ backgroundImage: foto }} />
                    <div className="rounded-[5px]" style={{ backgroundColor: accentSoft }} />
                </div>
            );
        case 'inmersivo':
            return (
                <div className="relative flex h-full w-full flex-col justify-end p-2" style={{ backgroundImage: foto }}>
                    <div className="relative space-y-1">
                        <div className="h-2.5 w-2/3 rounded-full bg-white" />
                        <div className="h-1 w-1/2 rounded-full bg-white/70" />
                        <div className="h-2.5 w-9 rounded-full bg-white" />
                    </div>
                </div>
            );
        case 'vitrina':
            return (
                <div className="flex h-full w-full items-stretch gap-1.5 p-2" style={{ backgroundColor: bg }}>
                    <div className="relative w-[46%] rounded-[5px]" style={{ backgroundImage: foto }}>
                        <div className="absolute inset-x-1 bottom-1 h-1.5 w-3/4 rounded-full bg-white" />
                    </div>
                    <div className="w-[27%] rounded-[5px]" style={{ backgroundColor: accentSoft }} />
                    <div className="w-[27%] rounded-[5px]" style={{ backgroundColor: surface, border: `1px solid ${border}` }} />
                </div>
            );
        case 'mosaico':
            return (
                <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1 p-1.5" style={{ backgroundColor: bg }}>
                    <div className="col-span-2 row-span-2 rounded-[5px]" style={{ backgroundImage: foto }} />
                    <div className="rounded-[5px]" style={{ backgroundColor: primary }} />
                    <div className="rounded-[5px]" style={{ backgroundColor: accentSoft }} />
                </div>
            );
        case 'diptico':
            return (
                <div className="flex h-full w-full" style={{ backgroundColor: surface }}>
                    <div className="w-1/2" style={{ backgroundImage: foto }} />
                    <div className="flex w-1/2 flex-col justify-center gap-1 p-2">
                        <Titulo ancho="w-4/5" />
                        <Titulo ancho="w-3/5" />
                        <Linea ancho="w-2/3" />
                        <Boton />
                    </div>
                </div>
            );
        case 'compacta':
            return (
                <div className="flex h-full w-full flex-col gap-1 p-2" style={{ backgroundColor: bg }}>
                    <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded-[3px]" style={{ backgroundColor: primary }} />
                        <div className="h-1.5 w-1/3 rounded-full" style={{ backgroundColor: title }} />
                        <div className="ml-auto h-2.5 w-8 rounded-full" style={{ backgroundColor: accentText }} />
                    </div>
                    <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: muted }} />
                    <div className="mt-1 h-full rounded-[4px]" style={{ backgroundImage: foto, opacity: 0.85 }} />
                </div>
            );
        default:
            return (
                <div className="relative flex h-full w-full flex-col justify-end p-2" style={{ backgroundImage: foto }}>
                  <div className="relative space-y-1">
                        <div className="h-2.5 w-2/3 rounded-full bg-white" />
                        <div className="h-1 w-1/2 rounded-full bg-white/70" />
                        <div className="flex gap-1">
                            <div className="h-2.5 w-9 rounded-full bg-white" />
                            <div className="h-2.5 w-6 rounded-full border border-white/40" />
                        </div>
                    </div>
                </div>
            );
    }
};

const MiniWireframe: React.FC<{ tipo: EstiloPlantilla; paleta: PaletaDerivada }> = ({ tipo, paleta }) => (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ backgroundColor: paleta.bg }}>
        <div className="h-[46%] shrink-0" style={{ borderBottom: `1px solid ${paleta.border}` }}>
            <MiniPortada tipo={tipo} paleta={paleta} />
        </div>
        <div className="min-h-0 flex-1">
            <MiniMenu tipo={tipo} paleta={paleta} />
        </div>
    </div>
);

/* ------------------------------------------------------------------ *
 *  Arquetipos (estructura del sitio)
 * ------------------------------------------------------------------ */

const ARQUETIPOS: { id: EstiloPlantilla; nombre: string; icono: React.ReactNode; desc: string }[] = [
    { id: 'moderno', nombre: 'Tarjetas', icono: <Grid3x3 size={20} />, desc: 'Portada con foto, barra fija y tarjetas. La más versátil.' },
    { id: 'carta', nombre: 'Carta', icono: <List size={20} />, desc: 'Portada editorial partida, serif y carta impresa a dos columnas.' },
    { id: 'minimalista', nombre: 'Minimal', icono: <Minus size={20} />, desc: 'Titular enorme, aire y una carta sin cajas. Para cocina de autor.' },
    { id: 'grid', nombre: 'Editorial', icono: <Layout size={20} />, desc: 'Portada bento, navegación flotante y retícula de retratos.' },
    { id: 'inmersivo', nombre: 'Inmersivo', icono: <ImageIcon size={20} />, desc: 'Portada a sangre con el texto sobre la foto. Manda la imagen.' },
    { id: 'vitrina', nombre: 'Vitrina', icono: <GalleryHorizontal size={20} />, desc: 'Escaparate horizontal en carrusel y navegación flotante.' },
    { id: 'mosaico', nombre: 'Mosaico', icono: <LayoutGrid size={20} />, desc: 'Collage de portada, fondo punteado y menú en mosaico.' },
    { id: 'diptico', nombre: 'Díptico', icono: <Columns2 size={20} />, desc: 'Portada partida 50/50, franjas alternas y pie editorial.' },
    { id: 'compacta', nombre: 'Compacta', icono: <Rows3 size={20} />, desc: 'Cabecera compacta, índice lateral y filas densas para cartas largas.' },
];

/* ------------------------------------------------------------------ *
 *  Selector de paleta
 * ------------------------------------------------------------------ */

type ModoVista = 'claro' | 'oscuro';

const TarjetaPaleta: React.FC<{
    paleta: Paleta;
    activa: boolean;
    modo: ModoVista;
    deshabilitado: boolean;
    onElegir: () => void;
}> = ({ paleta, activa, modo, deshabilitado, onElegir }) => {
    const derivada = derivarPaleta(aBase(modo === 'claro' ? paleta.claro : paleta.oscuro));
    /* Los cinco colores que se guardan, en el orden en que se leen: papel,
       marca, apoyo y las dos tintas. La tarjeta es solo esto: color. */
    const muestras: [string, string][] = [
        ['Fondo', derivada.bg],
        ['Marca', derivada.primary],
        ['Apoyo', derivada.secondary],
        ['Texto', derivada.text],
        ['Títulos', derivada.title],
    ];

    return (
        <button
            type="button"
            onClick={onElegir}
            disabled={deshabilitado}
            aria-pressed={activa}
            title={`${paleta.nombre} — ${paleta.etiqueta}`}
            className={`af-pulsar group relative overflow-hidden rounded-[20px] border text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                activa ? 'border-af-accent ring-2 ring-af-accent/25' : 'border-af/30 hover:border-af-accent/60'
            }`}
        >
            <div className="flex h-28 w-full" aria-hidden="true">
                {muestras.map(([rol, color]) => (
                    <span
                        key={rol}
                        title={`${rol} ${color}`}
                        className="flex-1 transition-[filter] duration-300 group-hover:brightness-[1.03]"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 bg-af-surface px-4 py-3">
                <p className={`truncate text-sm font-bold ${activa ? 'text-af-accent' : 'text-af-ink'}`}>
                    {paleta.nombre}
                </p>
                {activa && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-af-accent text-white">
                        <Check size={14} strokeWidth={3} />
                    </span>
                )}
            </div>
        </button>
    );
};

const OpcionSegmentada: React.FC<{
    activa: boolean;
    onClick: () => void;
    children: React.ReactNode;
    deshabilitado?: boolean;
    titulo?: string;
}> = ({ activa, onClick, children, deshabilitado, titulo }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={deshabilitado}
        aria-pressed={activa}
        title={titulo}
        className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            activa ? 'bg-af-accent text-white' : 'text-af-ink-secondary hover:text-af-ink'
        }`}
    >
        {children}
    </button>
);

/* ------------------------------------------------------------------ *
 *  Sección
 * ------------------------------------------------------------------ */

export const SeccionDiseno: React.FC<SeccionDisenoProps> = ({ tema, aplicarTema, guardando }) => {
    const [familia, setFamilia] = useState<FamiliaPaleta | 'Todas'>('Todas');
    const [modo, setModo] = useState<ModoVista>('claro');

    const arquetipoActivo: EstiloPlantilla = tema.estilo_plantilla || 'moderno';

    const esSeleccionado = (p: Paleta) =>
        tema.color_primario?.toUpperCase() === p.claro.primario.toUpperCase() &&
        tema.color_fondo?.toUpperCase() === p.claro.fondo.toUpperCase();

    const paletaActiva = PALETAS.find(esSeleccionado);

    /** Los colores con los que se dibuja la sección de estructura.
     *  Siguen el mismo conmutador Claro/Oscuro que las paletas: las nueve
     *  miniaturas se leen en el modo que estés mirando, no siempre en claro. */
    const claroActivo: JuegoColores = paletaActiva?.claro ?? {
        primario: tema.color_primario,
        secundario: tema.color_secundario,
        fondo: tema.color_fondo,
        texto: tema.color_texto,
        titulos: tema.color_texto_titulos || tema.color_texto,
    };
    /* El modo oscuro sale de la misma regla que la página pública
       (PlantillaRestaurante): si el restaurante no guardó colores oscuros, se
       derivan del claro con `conLuminosidad`. Así la miniatura no inventa un
       oscuro que el visitante nunca vería. */
    const oscuroActivo: JuegoColores = paletaActiva?.oscuro ?? {
        primario: tema.color_primario_oscuro || conLuminosidad(tema.color_primario, 0.68),
        secundario: tema.color_secundario_oscuro || conLuminosidad(tema.color_secundario, 0.62),
        fondo: tema.color_fondo_oscuro || conLuminosidad(tema.color_fondo, 0.055),
        texto: tema.color_texto_oscuro || '#F5F5F4',
        titulos: tema.color_texto_titulos_oscuro || '#FFFFFF',
    };
    const derivadaActiva = derivarPaleta(aBase(modo === 'oscuro' ? oscuroActivo : claroActivo));

    /* Las tarjetas de tipografía se dibujan con su propia letra: hay que tener
       el catálogo cargado al entrar en Apariencia. */
    useEffect(() => { cargarCatalogoFuentes(); }, []);

    const parActivo = parDeTema(tema.fuente_titulos, tema.fuente_cuerpo);

    const visibles = familia === 'Todas' ? PALETAS : PALETAS.filter((p) => p.familia === familia);
    const descripcionFamilia =
        familia === 'Todas'
            ? `${FAMILIAS.length} familias`
            : FAMILIAS.find((f) => f.id === familia)?.descripcion ?? '';

    const aplicarPaleta = (p: Paleta) => aplicarTema({
        color_primario: p.claro.primario,
        color_secundario: p.claro.secundario,
        color_fondo: p.claro.fondo,
        color_texto: p.claro.texto,
        color_texto_titulos: p.claro.titulos,
        color_primario_oscuro: p.oscuro.primario,
        color_secundario_oscuro: p.oscuro.secundario,
        color_fondo_oscuro: p.oscuro.fondo,
        color_texto_oscuro: p.oscuro.texto,
        color_texto_titulos_oscuro: p.oscuro.titulos,
    });

    return (
        <div className="space-y-8">

            {/* ---------- Estructura ---------- */}
            <section>
                <header className="mb-5">
                    <h2 className="text-[15px] font-bold tracking-tight text-af-ink">Estructura del sitio</h2>
                    <p className="mt-1 text-xs leading-relaxed text-af-ink-secondary">Cambia la página entera: portada, navegación, información y menú. Todas usan tus colores.</p>
                </header>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ARQUETIPOS.map((arq) => {
                        const activo = arquetipoActivo === arq.id;
                        return (
                            <button
                                key={arq.id}
                                type="button"
                                onClick={() => aplicarTema({ estilo_plantilla: arq.id })}
                                disabled={guardando}
                                aria-pressed={activo}
                                className={`af-pulsar relative overflow-hidden rounded-[20px] border text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                                    activo ? 'border-af-accent ring-2 ring-af-accent/25' : 'border-af/30 hover:border-af-accent/60'
                                }`}
                            >
                                <div className="h-44 w-full">
                                    <MiniWireframe tipo={arq.id} paleta={derivadaActiva} />
                                </div>
                                <div className="border-t border-af/20 bg-af-surface p-4">
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className={activo ? 'text-af-accent' : 'text-af-ink-secondary'}>{arq.icono}</span>
                                        <h3 className={`font-bold ${activo ? 'text-af-accent' : 'text-af-ink'}`}>{arq.nombre}</h3>
                                    </div>
                                    <p className="text-xs leading-relaxed text-af-ink-secondary">{arq.desc}</p>
                                </div>
                                {activo && (
                                    <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-af-accent text-white">
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ---------- Tipografía ---------- */}
            <section>
                <header className="mb-5">
                    <h2 className="text-[15px] font-bold tracking-tight text-af-ink">Tipografía</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-af-ink-secondary">
                        Una pareja para los títulos y otra para el texto. Cada tarjeta se escribe con su propia letra;
                        al elegirla queda guardada con tu restaurante y se aplica en toda tu página.
                    </p>
                </header>

                {!parActivo && (
                    <div className="mb-4 rounded-[16px] border border-af/25 bg-af-surface px-4 py-3">
                        <p className="text-xs text-af-ink-secondary">
                            Tu carta usa una tipografía heredada. Elige una pareja del catálogo para unificarla.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {PARES_FUENTES.map((par) => {
                        const activa = parActivo?.id === par.id;
                        const familiaTitulo = `'${par.titulos}', Georgia, serif`;
                        const familiaCuerpo = `'${par.cuerpo}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        return (
                            <button
                                key={par.id}
                                type="button"
                                onClick={() => aplicarTema({ fuente_titulos: par.titulos, fuente_cuerpo: par.cuerpo })}
                                disabled={guardando}
                                aria-pressed={activa}
                                className={`af-pulsar relative rounded-[20px] border p-4 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                                    activa ? 'border-af-accent ring-2 ring-af-accent/25' : 'border-af/30 hover:border-af-accent/60'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span
                                        className="text-[2.6rem] leading-[0.85] text-af-ink"
                                        style={{ fontFamily: familiaTitulo }}
                                        aria-hidden="true"
                                    >
                                        Aa
                                    </span>
                                    {activa && (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-af-accent text-white">
                                            <Check size={14} strokeWidth={3} />
                                        </span>
                                    )}
                                </div>

                                <p className="mt-3 truncate text-base font-semibold text-af-ink" style={{ fontFamily: familiaTitulo }}>
                                    {par.nombre}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-af-ink-secondary">
                                    {par.etiqueta}
                                </p>
                                <p className="mt-2 text-[13px] leading-relaxed text-af-ink-secondary" style={{ fontFamily: familiaCuerpo }}>
                                    El sabor de lo nuestro, servido con calma.
                                </p>
                                <p className="mt-3 truncate border-t border-af/15 pt-2 text-[10px] text-af-ink-secondary">
                                    {par.titulos} · {par.cuerpo}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ---------- Paleta ---------- */}
            <section>
                <header className="mb-5">
                    <h2 className="text-[15px] font-bold tracking-tight text-af-ink">Paleta de colores</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-af-ink-secondary">
                        Cada paleta trae cinco colores, en claro y en oscuro: el fondo y las tintas sostienen la lectura,
                        la marca va en los botones y el apoyo en precios, sellos y detalles. La tarjeta se prueba con la
                        estructura activa y el visitante elige el modo. Tu panel también adopta el color de marca.
                    </p>

                    {/* Los cinco papeles de la paleta, con los colores que se están
                        viendo ahora. Sin esto, cinco muestras seguidas no dicen qué
                        hace cada una en la página. */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {([
                            ['Fondo', derivadaActiva.bg],
                            ['Marca', derivadaActiva.primary],
                            ['Apoyo', derivadaActiva.secondary],
                            ['Texto', derivadaActiva.text],
                            ['Títulos', derivadaActiva.title],
                        ] as [string, string][]).map(([rol, color]) => (
                            <span key={rol} className="inline-flex items-center gap-1.5 text-[11px] text-af-ink-secondary">
                                <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                                {rol}
                            </span>
                        ))}
                    </div>
                </header>

                {/* Controles: familia y modo de la vista previa */}
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div
                        role="group"
                        aria-label="Filtrar paletas por familia"
                        /* Envuelve en vez de desplazarse: con siete familias la fila ya
                           no cabe en una pantalla de portátil, y una barra que se
                           desplaza en horizontal sin barra visible esconde la última
                           familia sin que nadie se entere. Con `rounded-[20px]` en vez
                           de `rounded-full` la cápsula aguanta dos líneas sin cortar
                           las puntas. */
                        className="flex flex-wrap gap-1 rounded-[20px] border border-af/25 bg-af-surface p-1"
                    >
                        <OpcionSegmentada activa={familia === 'Todas'} onClick={() => setFamilia('Todas')}>Todas</OpcionSegmentada>
                        {FAMILIAS.map((f) => (
                            <OpcionSegmentada key={f.id} activa={familia === f.id} onClick={() => setFamilia(f.id)} titulo={f.descripcion}>
                                {f.id}
                            </OpcionSegmentada>
                        ))}
                    </div>

                    <div
                        role="group"
                        aria-label="Modo de la vista previa"
                        className="flex shrink-0 gap-1 self-start rounded-full border border-af/25 bg-af-surface p-1 lg:self-auto"
                    >
                        <OpcionSegmentada activa={modo === 'claro'} onClick={() => setModo('claro')} deshabilitado={guardando}>
                            <span className="inline-flex items-center gap-1.5"><Sun size={14} /> Claro</span>
                        </OpcionSegmentada>
                        <OpcionSegmentada activa={modo === 'oscuro'} onClick={() => setModo('oscuro')} deshabilitado={guardando}>
                            <span className="inline-flex items-center gap-1.5"><Moon size={14} /> Oscuro</span>
                        </OpcionSegmentada>
                    </div>
                </div>

                <p className="mb-4 text-xs text-af-ink-secondary">
                    {visibles.length} {visibles.length === 1 ? 'paleta' : 'paletas'} · {descripcionFamilia}
                </p>

                {!paletaActiva && (
                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-af/25 bg-af-surface px-4 py-3">
                        <span className="flex gap-1.5">
                            {[tema.color_primario, tema.color_secundario, tema.color_fondo].map((col) => (
                                <span key={col} className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: col }} />
                            ))}
                        </span>
                        <p className="text-xs text-af-ink-secondary">
                            Estás usando colores personalizados. Elige una paleta para unificarlos en claro y en oscuro.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {visibles.map((p) => (
                        <TarjetaPaleta
                            key={p.id}
                            paleta={p}
                            activa={esSeleccionado(p)}
                            modo={modo}
                            deshabilitado={guardando}
                            onElegir={() => aplicarPaleta(p)}
                        />
                    ))}
                </div>
            </section>


        </div>
    );
};
