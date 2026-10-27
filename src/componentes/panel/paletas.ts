/**
 * Catálogo de paletas del panel de diseño.
 *
 * Vive aparte del componente para que sea datos puros: así lo puede consumir
 * tanto la interfaz (SeccionDiseno) como cualquier verificación automática que
 * compruebe el contraste de todas las paletas en claro y en oscuro.
 *
 * Cómo está pensado el catálogo:
 *
 * - Cada paleta se compone como una tríada intencionada: un FONDO (papel),
 *   un color de MARCA (primario) y un APOYO (secundario) con una relación
 *   elegida a propósito (complementaria, análoga o contrastada), no siempre
 *   "marca + ámbar". Esa era la repetición que se veía antes.
 * - El fondo no es siempre el mismo casi-blanco: hay papeles cálidos, fríos,
 *   neutros, crema y blanco puro, y en oscuro hay negros tintados de distinta
 *   temperatura. Así dos paletas nunca se sienten iguales aunque compartan tono.
 * - El modo oscuro está DISEÑADO (no volteado): mantiene el carácter del color
 *   y elige un negro del mismo temple que la paleta.
 *
 * Las tintas (texto, titulares, superficies, precios, semánticos) no se guardan
 * aquí: las deriva `derivarPaleta` en lib/color.ts, que además corrige el
 * contraste. Por eso toda paleta es legible por construcción, en ambos modos.
 */
import type { PaletaBase } from '../../lib/color';

/** Los cinco colores que se guardan por restaurante, en claro o en oscuro. */
export interface JuegoColores {
  primario: string;
  secundario: string;
  fondo: string;
  texto: string;
  titulos: string;
}

/** Familias del selector: agrupan por intención, no por temperatura a secas. */
export type FamiliaPaleta =
  | 'Clásicas'
  | 'Naturales'
  | 'Fríos'
  | 'Neutras'
  | 'Atrevidas'
  | 'Profundas'
  | 'Suaves';

export interface Paleta {
  id: string;
  nombre: string;
  /** Una línea que describe el carácter, para elegir de un vistazo. */
  etiqueta: string;
  familia: FamiliaPaleta;
  claro: JuegoColores;
  oscuro: JuegoColores;
}

export const FAMILIAS: { id: FamiliaPaleta; descripcion: string }[] = [
  { id: 'Clásicas', descripcion: 'Cálidas y apetitosas. El registro de siempre, bien hecho.' },
  { id: 'Naturales', descripcion: 'Verdes y frescas. Para cocina de mercado, saludable o vegetal.' },
  { id: 'Fríos', descripcion: 'Azules y acero. Mar, coctelería y cocina moderna.' },
  { id: 'Neutras', descripcion: 'Sin color de fondo. La comida y la tipografía hacen todo el trabajo.' },
  { id: 'Atrevidas', descripcion: 'Saturadas y jóvenes. Para marcas con carácter y ganas de destacar.' },
  { id: 'Profundas', descripcion: 'Oscuras y sobrias. Alta cocina, barras y experiencias de noche.' },
  { id: 'Suaves', descripcion: 'Tenues y aireadas. Pastelería, cafeterías y cocina de autor.' },
];

export const PALETAS: Paleta[] = [
  /* ---------------------------------------------------------------- Clásicas */
  {
    id: 'brasa',
    nombre: 'Naranja Brasa',
    etiqueta: 'Apetitosa y directa',
    familia: 'Clásicas',
    claro: { primario: '#C2410C', secundario: '#1F6F5C', fondo: '#FDF6F0', texto: '#2C1A0F', titulos: '#170D06' },
    oscuro: { primario: '#FF9A5C', secundario: '#4FD1AE', fondo: '#150D08', texto: '#F6EBE2', titulos: '#FFFFFF' },
  },
  {
    id: 'toscana',
    nombre: 'Rojo Toscana',
    etiqueta: 'Tradición italiana',
    familia: 'Clásicas',
    claro: { primario: '#B02020', secundario: '#4C6B1E', fondo: '#FDF7F4', texto: '#2E1512', titulos: '#190908' },
    oscuro: { primario: '#FF7B72', secundario: '#A8D64C', fondo: '#170A09', texto: '#F8E9E7', titulos: '#FFFFFF' },
  },
  {
    id: 'terracota',
    nombre: 'Terracota',
    etiqueta: 'Rústica y artesanal',
    familia: 'Clásicas',
    claro: { primario: '#A9542B', secundario: '#4A6B2A', fondo: '#FBF6F1', texto: '#33200F', titulos: '#1F1207' },
    oscuro: { primario: '#E08A5B', secundario: '#9CC46A', fondo: '#17100A', texto: '#F3E8DF', titulos: '#FFFFFF' },
  },
  {
    id: 'vino',
    nombre: 'Vino Tinto',
    etiqueta: 'Elegante y cálida',
    familia: 'Clásicas',
    claro: { primario: '#7B1E3A', secundario: '#B98A3C', fondo: '#FBF6F6', texto: '#2C0F1C', titulos: '#180810' },
    oscuro: { primario: '#E86B8A', secundario: '#E3B96B', fondo: '#15080E', texto: '#F7E8ED', titulos: '#FFFFFF' },
  },
  {
    id: 'mostaza',
    nombre: 'Mostaza',
    etiqueta: 'Retro y cálida',
    familia: 'Clásicas',
    claro: { primario: '#A16207', secundario: '#1E6F5C', fondo: '#FDFAF0', texto: '#33240A', titulos: '#1E1405' },
    oscuro: { primario: '#E0B13A', secundario: '#45C9AC', fondo: '#16120A', texto: '#F7EED6', titulos: '#FFFFFF' },
  },
  {
    id: 'cafe',
    nombre: 'Café de Origen',
    etiqueta: 'Cafetería artesanal',
    familia: 'Clásicas',
    claro: { primario: '#6B4423', secundario: '#2F6F4F', fondo: '#FBF7F2', texto: '#2A1A0D', titulos: '#170E05' },
    oscuro: { primario: '#C89468', secundario: '#5FBF8F', fondo: '#130E09', texto: '#F2E7DA', titulos: '#FFFFFF' },
  },
  {
    id: 'melocoton',
    nombre: 'Melocotón',
    etiqueta: 'Dulce y luminosa',
    familia: 'Clásicas',
    claro: { primario: '#E89070', secundario: '#2F6B7A', fondo: '#FEF7F3', texto: '#3A2018', titulos: '#22110B' },
    oscuro: { primario: '#F7B093', secundario: '#6FB6C7', fondo: '#170D09', texto: '#F8E8E0', titulos: '#FFFFFF' },
  },

  /* --------------------------------------------------------------- Naturales */
  {
    id: 'oliva',
    nombre: 'Oliva',
    etiqueta: 'Terrosa y serena',
    familia: 'Naturales',
    claro: { primario: '#5C6B1F', secundario: '#B45309', fondo: '#F8FAF2', texto: '#232A0C', titulos: '#131804' },
    oscuro: { primario: '#B5D24A', secundario: '#E0954A', fondo: '#131708', texto: '#F0F5DC', titulos: '#FFFFFF' },
  },
  {
    id: 'bosque',
    nombre: 'Verde Bosque',
    etiqueta: 'Profunda y natural',
    familia: 'Naturales',
    claro: { primario: '#14653A', secundario: '#B5761F', fondo: '#F3FAF5', texto: '#0C2417', titulos: '#04140C' },
    oscuro: { primario: '#34D07F', secundario: '#E3B95B', fondo: '#07160F', texto: '#DBF3E4', titulos: '#FFFFFF' },
  },
  {
    id: 'esmeralda',
    nombre: 'Esmeralda',
    etiqueta: 'Fresca y pulida',
    familia: 'Naturales',
    claro: { primario: '#0B7A5A', secundario: '#C2410C', fondo: '#F2FAF8', texto: '#08302A', titulos: '#031A16' },
    oscuro: { primario: '#2FD9A8', secundario: '#FF8A5B', fondo: '#061613', texto: '#D5F5EC', titulos: '#FFFFFF' },
  },
  {
    id: 'menta',
    nombre: 'Menta',
    etiqueta: 'Limpia y moderna',
    familia: 'Naturales',
    claro: { primario: '#0E7C6B', secundario: '#D6336C', fondo: '#F2FAF9', texto: '#0A2E29', titulos: '#041916' },
    oscuro: { primario: '#3FD9C0', secundario: '#FF7BA8', fondo: '#061614', texto: '#D6F2EE', titulos: '#FFFFFF' },
  },
  {
    id: 'lima',
    nombre: 'Lima',
    etiqueta: 'Jugosa y viva',
    familia: 'Naturales',
    claro: { primario: '#63970E', secundario: '#C2410C', fondo: '#F9FBEF', texto: '#232E06', titulos: '#121803' },
    oscuro: { primario: '#A8DD46', secundario: '#FF8A4C', fondo: '#141A07', texto: '#F0F7DB', titulos: '#FFFFFF' },
  },
  {
    id: 'salvia',
    nombre: 'Salvia',
    etiqueta: 'Suave y serena',
    familia: 'Naturales',
    claro: { primario: '#52705E', secundario: '#A15A2E', fondo: '#F7FAF7', texto: '#1F2A23', titulos: '#0E1712' },
    oscuro: { primario: '#9CC7AC', secundario: '#E0A46B', fondo: '#0C120E', texto: '#E5EFE8', titulos: '#FFFFFF' },
  },
  {
    id: 'matcha',
    nombre: 'Matcha',
    etiqueta: 'Vegetal y luminosa',
    familia: 'Naturales',
    claro: { primario: '#8FA85A', secundario: '#B0562E', fondo: '#F9FBEF', texto: '#2A3312', titulos: '#161D06' },
    oscuro: { primario: '#BBD47E', secundario: '#E08A5B', fondo: '#12180A', texto: '#EDF3DA', titulos: '#FFFFFF' },
  },

  /* ------------------------------------------------------------------- Fríos */
  {
    id: 'atlantico',
    nombre: 'Atlántico',
    etiqueta: 'Marinera y fresca',
    familia: 'Fríos',
    claro: { primario: '#0B5C8A', secundario: '#D2603A', fondo: '#F3F9FC', texto: '#0A2A3F', titulos: '#041726' },
    oscuro: { primario: '#4FB3E8', secundario: '#FF9A78', fondo: '#06141F', texto: '#DCEEF8', titulos: '#FFFFFF' },
  },
  {
    id: 'marino',
    nombre: 'Azul Marino',
    etiqueta: 'Clásica y elegante',
    familia: 'Fríos',
    claro: { primario: '#1E3A8A', secundario: '#C08A2E', fondo: '#F5F8FC', texto: '#121E3C', titulos: '#080F22' },
    oscuro: { primario: '#7B9BF5', secundario: '#E3B96B', fondo: '#070D1E', texto: '#DFE6F8', titulos: '#FFFFFF' },
  },
  {
    id: 'cian',
    nombre: 'Cian',
    etiqueta: 'Moderna y nítida',
    familia: 'Fríos',
    claro: { primario: '#0E7490', secundario: '#C2185B', fondo: '#F2FAFB', texto: '#0A2A32', titulos: '#04171C' },
    oscuro: { primario: '#38C6E0', secundario: '#FF7BA8', fondo: '#061418', texto: '#D9F1F6', titulos: '#FFFFFF' },
  },
  {
    id: 'indigo',
    nombre: 'Índigo',
    etiqueta: 'Sofisticada y profunda',
    familia: 'Fríos',
    claro: { primario: '#4F46E5', secundario: '#C98A2E', fondo: '#F6F7FE', texto: '#1B1B4A', titulos: '#0C0C2A' },
    oscuro: { primario: '#9B94FF', secundario: '#E0B463', fondo: '#0C0C24', texto: '#E3E4FB', titulos: '#FFFFFF' },
  },
  {
    id: 'acero',
    nombre: 'Acero',
    etiqueta: 'Sobria y técnica',
    familia: 'Fríos',
    claro: { primario: '#4A5E72', secundario: '#0E7490', fondo: '#F4F7F9', texto: '#16202B', titulos: '#080E16' },
    oscuro: { primario: '#A6B9CB', secundario: '#45C5DE', fondo: '#0B1017', texto: '#E2E8EF', titulos: '#FFFFFF' },
  },
  {
    id: 'cielo',
    nombre: 'Cielo',
    etiqueta: 'Joven y luminosa',
    familia: 'Fríos',
    claro: { primario: '#2563EB', secundario: '#DB2777', fondo: '#F7FAFF', texto: '#10224A', titulos: '#071230' },
    oscuro: { primario: '#6F9CFF', secundario: '#FF7BB0', fondo: '#08122B', texto: '#DDE6FB', titulos: '#FFFFFF' },
  },
  {
    id: 'bruma',
    nombre: 'Bruma',
    etiqueta: 'Aireada y serena',
    familia: 'Fríos',
    claro: { primario: '#8FB6D4', secundario: '#C4795A', fondo: '#F6FAFD', texto: '#16283A', titulos: '#08131F' },
    oscuro: { primario: '#A8CBEA', secundario: '#E89B7C', fondo: '#0A1219', texto: '#DFEBF5', titulos: '#FFFFFF' },
  },

  /* ----------------------------------------------------------------- Neutras */
  {
    id: 'piedra',
    nombre: 'Piedra',
    etiqueta: 'Neutra y cálida',
    familia: 'Neutras',
    claro: { primario: '#55534C', secundario: '#0F766E', fondo: '#F6F6F4', texto: '#1F1E1B', titulos: '#0E0E0B' },
    oscuro: { primario: '#B4B1A8', secundario: '#45C9BC', fondo: '#0E0E0D', texto: '#E6E5E1', titulos: '#FFFFFF' },
  },
  {
    id: 'tinta',
    nombre: 'Tinta y Oro',
    etiqueta: 'Alta cocina',
    familia: 'Neutras',
    claro: { primario: '#22272E', secundario: '#A9701F', fondo: '#F8F8F6', texto: '#20252B', titulos: '#080B0F' },
    oscuro: { primario: '#E2B44E', secundario: '#C3CCD6', fondo: '#0A0A0C', texto: '#ECEDEF', titulos: '#FFFFFF' },
  },
  {
    id: 'lino',
    nombre: 'Lino',
    etiqueta: 'Editorial y suave',
    familia: 'Neutras',
    claro: { primario: '#8C7A63', secundario: '#4A7A8C', fondo: '#FAF8F5', texto: '#29241C', titulos: '#15120D' },
    oscuro: { primario: '#CBB595', secundario: '#86B4C7', fondo: '#100F0C', texto: '#F0EBE2', titulos: '#FFFFFF' },
  },
  {
    id: 'grafito',
    nombre: 'Grafito',
    etiqueta: 'Técnica y moderna',
    familia: 'Neutras',
    claro: { primario: '#4A4F57', secundario: '#D9542B', fondo: '#F4F5F6', texto: '#171A1F', titulos: '#07090C' },
    oscuro: { primario: '#B9C1CB', secundario: '#FF8A5B', fondo: '#0A0C10', texto: '#E3E7EC', titulos: '#FFFFFF' },
  },
  {
    id: 'papel',
    nombre: 'Papel',
    etiqueta: 'Blanco y negro, editorial',
    familia: 'Neutras',
    claro: { primario: '#000000', secundario: '#C0392B', fondo: '#FFFFFF', texto: '#111111', titulos: '#000000' },
    oscuro: { primario: '#EDEDED', secundario: '#FF6B5B', fondo: '#0A0A0A', texto: '#EDEDED', titulos: '#FFFFFF' },
  },
  {
    id: 'petalo',
    nombre: 'Pétalo',
    etiqueta: 'Dulce y serena',
    familia: 'Neutras',
    claro: { primario: '#C25E7A', secundario: '#4A7A8C', fondo: '#FBF7F8', texto: '#2E1A20', titulos: '#1A0E13' },
    oscuro: { primario: '#F0A0B4', secundario: '#86B4C7', fondo: '#130D10', texto: '#F3E6EA', titulos: '#FFFFFF' },
  },
  {
    id: 'arena',
    nombre: 'Arena',
    etiqueta: 'Clara y terrosa',
    familia: 'Neutras',
    claro: { primario: '#B7A489', secundario: '#4E6E7A', fondo: '#FBF9F5', texto: '#2E2921', titulos: '#191510' },
    oscuro: { primario: '#D8C7AC', secundario: '#8FB4C0', fondo: '#131110', texto: '#F0EBE2', titulos: '#FFFFFF' },
  },

  /* --------------------------------------------------------------- Atrevidas */
  {
    id: 'carmin',
    nombre: 'Carmín',
    etiqueta: 'Audaz y moderna',
    familia: 'Atrevidas',
    claro: { primario: '#BE123C', secundario: '#0E7490', fondo: '#FDF5F8', texto: '#330A1B', titulos: '#1D0510' },
    oscuro: { primario: '#FF6D9B', secundario: '#45C9DE', fondo: '#180812', texto: '#F9E3EC', titulos: '#FFFFFF' },
  },
  {
    id: 'fucsia',
    nombre: 'Fucsia',
    etiqueta: 'Atrevida y festiva',
    familia: 'Atrevidas',
    claro: { primario: '#A21CAF', secundario: '#0D9488', fondo: '#FDF5FE', texto: '#2E0A33', titulos: '#1A051D' },
    oscuro: { primario: '#E879F9', secundario: '#3DD6C4', fondo: '#170818', texto: '#F7E3FA', titulos: '#FFFFFF' },
  },
  {
    id: 'coral',
    nombre: 'Coral',
    etiqueta: 'Fresca y cercana',
    familia: 'Atrevidas',
    claro: { primario: '#E8546B', secundario: '#2F6FA8', fondo: '#FEF6F7', texto: '#35121B', titulos: '#1F090F' },
    oscuro: { primario: '#FF8AA0', secundario: '#7FB6E8', fondo: '#170A0E', texto: '#F8E6EA', titulos: '#FFFFFF' },
  },
  {
    id: 'mandarina',
    nombre: 'Mandarina',
    etiqueta: 'Energética',
    familia: 'Atrevidas',
    claro: { primario: '#EA6A0A', secundario: '#1F6F9C', fondo: '#FEF7F0', texto: '#331B07', titulos: '#1D0F03' },
    oscuro: { primario: '#FFB067', secundario: '#5FB3E0', fondo: '#170E05', texto: '#F8ECDF', titulos: '#FFFFFF' },
  },
  {
    id: 'uva',
    nombre: 'Uva',
    etiqueta: 'Juvenil y dulce',
    familia: 'Atrevidas',
    claro: { primario: '#7C3AED', secundario: '#EAB308', fondo: '#F8F7FE', texto: '#2A1B52', titulos: '#170E2E' },
    oscuro: { primario: '#B49AFF', secundario: '#F5D14A', fondo: '#100C22', texto: '#E7E3FA', titulos: '#FFFFFF' },
  },
  {
    id: 'mango',
    nombre: 'Mango',
    etiqueta: 'Tropical y viva',
    familia: 'Atrevidas',
    claro: { primario: '#E0A000', secundario: '#0F766E', fondo: '#FEFAF0', texto: '#332600', titulos: '#1D1500' },
    oscuro: { primario: '#F5CC4A', secundario: '#45C9BC', fondo: '#161200', texto: '#F8F2DC', titulos: '#FFFFFF' },
  },
  {
    id: 'orquidea',
    nombre: 'Orquídea',
    etiqueta: 'Vibrante y profunda',
    familia: 'Atrevidas',
    claro: { primario: '#7A1E7A', secundario: '#C9A227', fondo: '#FDF5FD', texto: '#33102F', titulos: '#1D071C' },
    oscuro: { primario: '#D97AD9', secundario: '#E8C766', fondo: '#140614', texto: '#F6E3F6', titulos: '#FFFFFF' },
  },

  /* --------------------------------------------------------------- Profundas */
  {
    id: 'berenjena',
    nombre: 'Berenjena',
    etiqueta: 'Exótica y refinada',
    familia: 'Profundas',
    claro: { primario: '#581C87', secundario: '#A9542B', fondo: '#FAF5FC', texto: '#250E3D', titulos: '#150628' },
    oscuro: { primario: '#C79BFF', secundario: '#E89B6B', fondo: '#120A1F', texto: '#EDE3FA', titulos: '#FFFFFF' },
  },
  {
    id: 'ciruela',
    nombre: 'Ciruela',
    etiqueta: 'Nocturna y suave',
    familia: 'Profundas',
    claro: { primario: '#6B3A5B', secundario: '#3F7A6E', fondo: '#FAF6F9', texto: '#2A1622', titulos: '#170B13' },
    oscuro: { primario: '#CE9BBE', secundario: '#6FCBB8', fondo: '#140B11', texto: '#F2E7EF', titulos: '#FFFFFF' },
  },
  {
    id: 'medianoche',
    nombre: 'Medianoche',
    etiqueta: 'Bar de cócteles',
    familia: 'Profundas',
    claro: { primario: '#1E1B4B', secundario: '#D2603A', fondo: '#F5F5FB', texto: '#16143A', titulos: '#0A0922' },
    oscuro: { primario: '#8A85E0', secundario: '#FF9A78', fondo: '#08071A', texto: '#DDDBF5', titulos: '#FFFFFF' },
  },
  {
    id: 'oronegro',
    nombre: 'Oro Negro',
    etiqueta: 'Lujo nocturno',
    familia: 'Profundas',
    claro: { primario: '#7A5B0B', secundario: '#3A4A5C', fondo: '#F9F8F3', texto: '#2A2410', titulos: '#17130A' },
    oscuro: { primario: '#F0C64A', secundario: '#A6B9CB', fondo: '#0B0A08', texto: '#EFEFEA', titulos: '#FFFFFF' },
  },
  {
    id: 'granate',
    nombre: 'Granate',
    etiqueta: 'Intensa y sobria',
    familia: 'Profundas',
    claro: { primario: '#6E1A16', secundario: '#1F5F7A', fondo: '#FAF5F5', texto: '#2A0A0A', titulos: '#170404' },
    oscuro: { primario: '#E05A78', secundario: '#5FB3E0', fondo: '#140609', texto: '#F5E5E9', titulos: '#FFFFFF' },
  },
  {
    id: 'petroleo',
    nombre: 'Petróleo',
    etiqueta: 'Profunda y marina',
    familia: 'Profundas',
    claro: { primario: '#12404A', secundario: '#D9A05B', fondo: '#F2F8F9', texto: '#0C2A30', titulos: '#041A1E' },
    oscuro: { primario: '#4FC1D0', secundario: '#F0C489', fondo: '#03161A', texto: '#D7F0F4', titulos: '#FFFFFF' },
  },
  {
    id: 'abeto',
    nombre: 'Abeto',
    etiqueta: 'Bosque de noche',
    familia: 'Profundas',
    claro: { primario: '#1F4A32', secundario: '#B08442', fondo: '#F3F8F4', texto: '#0E2418', titulos: '#04140C' },
    oscuro: { primario: '#5FAE7E', secundario: '#E0B468', fondo: '#07130D', texto: '#DDEFE4', titulos: '#FFFFFF' },
  },

  /* ------------------------------------------------------------------ Suaves
     El registro que faltaba: colores de marca tenues sobre papeles altos. Todo
     lo demás del catálogo es medio-saturado y de luminosidad media; aquí el
     carácter lo lleva el aire, no la intensidad. Es lo que pide una pastelería,
     una cafetería de especialidad o una cocina de autor. La marca sigue siendo
     visible sobre el papel (el motor garantiza 1.45:1) y las tintas se
     corrigen igual que en el resto. */
  {
    id: 'rosa-palo',
    nombre: 'Rosa Palo',
    etiqueta: 'Dulce y serena',
    familia: 'Suaves',
    claro: { primario: '#B2788A', secundario: '#7E9B86', fondo: '#FCF7F7', texto: '#34212A', titulos: '#1F1119' },
    oscuro: { primario: '#EBB0BE', secundario: '#A8C6B0', fondo: '#171013', texto: '#F8ECF0', titulos: '#FFFFFF' },
  },
  {
    id: 'lavanda',
    nombre: 'Lavanda',
    etiqueta: 'Floral y calmada',
    familia: 'Suaves',
    claro: { primario: '#8F82C4', secundario: '#4E9C8A', fondo: '#F9F8FD', texto: '#26213F', titulos: '#141029' },
    oscuro: { primario: '#C0B4F0', secundario: '#6FCBB6', fondo: '#100E1E', texto: '#EAE7F8', titulos: '#FFFFFF' },
  },
  {
    id: 'eucalipto',
    nombre: 'Eucalipto',
    etiqueta: 'Botánica y fresca',
    familia: 'Suaves',
    claro: { primario: '#6E9A86', secundario: '#5F86A8', fondo: '#F6FAF8', texto: '#1E2E28', titulos: '#0D1A15' },
    oscuro: { primario: '#9ED3BC', secundario: '#93B8D8', fondo: '#0A1411', texto: '#E4F2EC', titulos: '#FFFFFF' },
  },
  {
    id: 'niebla',
    nombre: 'Niebla',
    etiqueta: 'Fría y discreta',
    familia: 'Suaves',
    claro: { primario: '#7C8CA0', secundario: '#B87A5E', fondo: '#F7F9FB', texto: '#1E2630', titulos: '#0D1218' },
    oscuro: { primario: '#AEC0D4', secundario: '#E0A68C', fondo: '#0C1014', texto: '#E6EBF2', titulos: '#FFFFFF' },
  },
  {
    id: 'vainilla',
    nombre: 'Vainilla',
    etiqueta: 'Cálida y cremosa',
    familia: 'Suaves',
    claro: { primario: '#C39A4A', secundario: '#7A8C79', fondo: '#FDFAF1', texto: '#35290F', titulos: '#201806' },
    oscuro: { primario: '#E8C878', secundario: '#A6BEA4', fondo: '#16120A', texto: '#F6EED8', titulos: '#FFFFFF' },
  },
  {
    id: 'aqua',
    nombre: 'Aqua',
    etiqueta: 'Fresca y serena',
    familia: 'Suaves',
    claro: { primario: '#7FB5AE', secundario: '#7E5F9C', fondo: '#F5FAF9', texto: '#1D2E2C', titulos: '#0C1917' },
    oscuro: { primario: '#A6D8D1', secundario: '#C0A6E0', fondo: '#0A1413', texto: '#E2F1EF', titulos: '#FFFFFF' },
  },
];

/** Traduce los cinco colores guardados al contrato que usa el motor de color. */
export const aBase = (c: JuegoColores): PaletaBase => ({
  bg: c.fondo,
  text: c.texto,
  title: c.titulos,
  primary: c.primario,
  secondary: c.secundario,
});
