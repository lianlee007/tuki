import React from 'react';
import { Battery, Clock, Plus, ShoppingCart, Signal, Star, Wifi } from 'lucide-react';
import type { Dispositivo } from './Marcos';

/**
 * Menú de demostración que vive dentro de los marcos.
 *
 * Se dibuja con los tokens `af`, así que hereda el papel cálido de la landing y
 * cambia de claro a oscuro con el resto de la página: el visitante ve el menú
 * como lo verá su cliente, no una captura congelada.
 *
 * Y se dibuja distinto en cada dispositivo a propósito. En el teléfono las
 * filas van en horizontal —miniatura, nombre y precio— porque es lo que cabe y
 * lo que se lee con el pulgar; en tablet y portátil van en tarjetas de dos
 * columnas. Que el contenido cambie de forma al cambiar de aparato es
 * justamente lo que la sección quiere demostrar.
 */

const PLATILLOS = [
  {
    nombre: 'Bandeja Paisa',
    precio: '$35.000',
    desc: 'Frijoles, chicharrón, chorizo, huevo, arepa, plátano y aguacate.',
    img: 'https://www.saborusa.com/wp-content/uploads/2021/02/Bandeja-paisa-con-arroz-fr%C3%ADjoles-chorizo-huevo-frito-chicharr%C3%B3n-arepa-pl%C3%A1tano-maduro-aguacate-y-morcilla-en-plato-de-barro.webp',
  },
  {
    nombre: 'Ajiaco Santafereño',
    precio: '$28.000',
    desc: 'Tres papas, pollo desmechado, guasca, mazorca y crema de leche.',
    img: 'https://www.recetasnestle.com.co/sites/default/files/styles/recipe_detail_desktop_new/public/srh_recipes/f78cf6630b31638994b09b3b470b085c.webp?itok=jCj648zw',
  },
  {
    nombre: 'Cazuela de Frijoles',
    precio: '$25.000',
    desc: 'Frijoles con carne de res, zanahoria, pimentón y caldo espeso.',
    img: 'https://www.saborusa.com/wp-content/uploads/2021/02/Cazuela-de-fr%C3%ADjoles-con-carne-de-res-zanahoria-piment%C3%B3n-y-caldo-espeso-servida-en-taza-blanca.webp',
  },
  {
    nombre: 'Tamal Huilense',
    precio: '$18.000',
    desc: 'Masa de arroz con carnes marinadas, envuelto en hoja de plátano.',
    img: 'https://elcronista.co/assets/media/tamal-huilense.jpg',
  },
];

const BANNER =
  'https://i.pinimg.com/1200x/87/75/b0/8775b049c1d0b0bc5ff27447dde28983.jpg';

const CATEGORIAS = ['Recomendados', 'Entradas', 'Fuertes', 'Bebidas', 'Postres'];

const BarraEstado: React.FC = () => (
  <div className="flex h-[30px] shrink-0 items-end justify-between px-5 pb-1 text-[10px] font-semibold text-af-ink">
    <span className="tracking-tight">9:41</span>
    <span className="flex items-center gap-1.5">
      <Signal size={11} strokeWidth={2.6} />
      <Wifi size={11} strokeWidth={2.6} />
      <Battery size={14} strokeWidth={2.2} />
    </span>
  </div>
);

const Etiqueta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex items-center gap-1 rounded-full bg-af-surface px-2.5 py-1 text-[10px] font-semibold text-af-ink-secondary">
    {children}
  </span>
);

export const MenuDemo: React.FC<{
  nombre: string;
  dispositivo: Dispositivo;
  /** El portátil ya dibuja su barra de navegador, así que no lleva fila de estado. */
  conEstado?: boolean;
  /** El héroe se ve al cargar y sus fotos deben entrar ya; la demostración
   *  vive muy abajo y se carga al acercarse, para no competir con el héroe. */
  prioridad?: boolean;
}> = ({ nombre, dispositivo, conEstado = false, prioridad = false }) => {
  const movil = dispositivo === 'movil';
  const pc = dispositivo === 'pc';
  const titulo = nombre.trim() || 'Tu restaurante';
  const carga = prioridad ? 'eager' : 'lazy';

  /* Alturas por aparato. La pantalla del portátil es la más baja de las tres
     (404 px útiles) y el menú gasta casi todo el alto en cabecera, portada y
     categorías, así que allí la portada se acorta y la fila de datos
     desaparece: cada fila que se deja fuera son dos platos que no se ven. */
  const altoBanner = movil ? 118 : pc ? 122 : 134;
  const altoFoto = movil ? 62 : 84;

  return (
    <div className="flex h-full flex-col bg-af-ground text-af-ink">
      {conEstado && <BarraEstado />}

      {/* Cabecera del menú */}
      <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
        <span
          className="truncate font-semibold tracking-tight"
          style={{ fontSize: movil ? 13 : 15 }}
        >
          {titulo}
        </span>
        <span className="relative shrink-0 transition-transform">
          <ShoppingCart size={movil ? 16 : 18} strokeWidth={2} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-af-accent" />
        </span>
      </div>

      {/* Portada */}
      <div className="mx-3 shrink-0 overflow-hidden rounded-2xl" style={{ height: altoBanner }}>
        <div className="relative h-full w-full">
          <img
            src={BANNER}
            alt=""
            width={520}
            height={220}
            className="h-full w-full object-cover"
            loading={carga}
            decoding="async"
            fetchPriority={prioridad ? 'high' : undefined}
            draggable={false}
          />
          {/* Velo plano, no degradado: casa con la casa y garantiza que el
              nombre se lea sobre cualquier foto. */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[13px] font-bold text-[#1C1917]">
              {titulo.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-white">{titulo}</span>
              <span className="block truncate text-[10px] font-medium text-white/80">
                Comida de casa
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Datos rápidos */}
      {!pc && (
        <div className="flex shrink-0 items-center gap-1.5 px-3 py-2.5">
          <Etiqueta>
            <Clock size={10} strokeWidth={2.6} /> Abierto
          </Etiqueta>
          <Etiqueta>
            <Star size={10} strokeWidth={2.6} className="text-af-accent" /> 4.9
          </Etiqueta>
          {!movil && <Etiqueta>Envío a domicilio</Etiqueta>}
        </div>
      )}

      {/* Categorías */}
      <div className="flex shrink-0 gap-1.5 overflow-hidden px-3 pb-3">
        {CATEGORIAS.map((c, i) => (
          <span
            key={c}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              i === 0
                ? 'bg-af-accent text-white'
                : 'bg-af-surface text-af-ink-secondary'
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Carta. El recorte va en el envoltorio y no en la rejilla: si la rejilla
          recibe una altura definida, `align-content: stretch` reparte esa altura
          entre las filas y aplasta las tarjetas a 55 px. El contenido conserva
          su altura natural y es el envoltorio quien corta, que es lo que de
          verdad hace una captura de una pantalla con scroll. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={movil ? 'space-y-2 px-3' : 'grid grid-cols-2 content-start gap-2.5 px-3'}>
          {PLATILLOS.map((p) =>
            movil ? (
              <article
                key={p.nombre}
                className="flex items-center gap-2.5 rounded-2xl bg-af-surface p-2"
              >
                <img
                  src={p.img}
                  alt=""
                  width={62}
                  height={62}
                  className="h-[62px] w-[62px] shrink-0 rounded-xl object-cover"
                  loading={carga}
                  decoding="async"
                  draggable={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{p.nombre}</p>
                  <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-af-ink-secondary">
                    {p.desc}
                  </p>
                  <span className="mt-1 block text-[11px] font-bold text-af-accent-text">
                    {p.precio}
                  </span>
                </div>
              </article>
            ) : (
              <article
                key={p.nombre}
                className="flex flex-col overflow-hidden rounded-2xl bg-af-surface"
              >
                <div className="relative shrink-0" style={{ height: altoFoto }}>
                  <img
                    src={p.img}
                    alt=""
                    width={320}
                    height={168}
                    className="h-full w-full object-cover"
                    loading={carga}
                    decoding="async"
                    draggable={false}
                  />
                  <span className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#1C1917]">
                    {p.precio}
                  </span>
                </div>
                <div className="flex flex-1 items-start gap-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold">{p.nombre}</p>
                    <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-af-ink-secondary">
                      {p.desc}
                    </p>
                  </div>
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-af-accent text-white">
                    <Plus size={12} strokeWidth={3} />
                  </span>
                </div>
              </article>
            )
          )}
        </div>
      </div>
    </div>
  );
};
