import React from 'react';
import { Leaf, Sprout, Flame, WheatOff, Fish, MilkOff } from 'lucide-react';
import { Platillo } from '../../tipos';

interface Props {
  platillo: Platillo;
  className?: string;
  compacto?: boolean;
  /** Fuerza los colores pensados para ir sobre fotografía (fondo oscuro). */
  sobreImagen?: boolean;
}

type Variante = 'vegetariano' | 'picante' | 'alergeno';

interface Etiqueta {
  texto: string;
  variante: Variante;
  icono: React.ReactNode;
}

/**
 * Etiquetas de dieta y alérgenos del platillo.
 *
 * El color es semántico (verde = vegetariano, rojo = picante, ámbar =
 * alérgeno) y NO sale de la paleta del restaurante: un alérgeno debe verse
 * igual en todas partes. El modo claro/oscuro y el contraste los resuelve la
 * hoja de estilos (`.af-etiqueta`), que cambia de tono en `.dark` y usa un
 * fondo oscuro cuando la etiqueta va encima de una foto.
 */
export const EtiquetasPlatillo: React.FC<Props> = ({ platillo, className = '', compacto = false, sobreImagen = false }) => {
  const tam = compacto ? 10 : 12;
  const etiquetas: Etiqueta[] = [];

  if (platillo.vegano) {
    etiquetas.push({ texto: 'Vegano', variante: 'vegetariano', icono: <Sprout size={tam} /> });
  } else if (platillo.vegetariano) {
    etiquetas.push({ texto: 'Vegetariano', variante: 'vegetariano', icono: <Leaf size={tam} /> });
  }
  if (platillo.picante) {
    etiquetas.push({ texto: 'Picante', variante: 'picante', icono: <Flame size={tam} /> });
  }

  const alergenos = (platillo.alergenos || []).slice(0, 2);
  alergenos.forEach((a) => {
    const texto = String(a);
    const esGluten = /gluten|trigo|wheat/i.test(texto);
    const esLacteo = /lactosa|lácteo|lacteo|leche|milk/i.test(texto);
    const esPescado = /pescado|marisco|fish|seafood/i.test(texto);
    etiquetas.push({
      texto,
      variante: 'alergeno',
      icono: esGluten ? <WheatOff size={tam} /> : esLacteo ? <MilkOff size={tam} /> : esPescado ? <Fish size={tam} /> : <Leaf size={tam} />,
    });
  });

  if (etiquetas.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {etiquetas.map((e, i) => (
        <span
          key={`${e.texto}-${i}`}
          className={`af-etiqueta af-etiqueta-${e.variante}${compacto ? ' af-etiqueta--compacta' : ''}${sobreImagen ? ' sobre-imagen' : ''}`}
        >
          {e.icono}
          {e.texto}
        </span>
      ))}
    </div>
  );
};
