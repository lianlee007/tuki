import {
  Beef,
  CakeSlice,
  ChefHat,
  Coffee,
  CookingPot,
  Croissant,
  CupSoda,
  Fish,
  Flame,
  HandPlatter,
  IceCreamBowl,
  Leaf,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Sparkles,
  Sprout,
  Truck,
  UtensilsCrossed,
  Waves,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

/**
 * La base guarda el nombre del icono, no el componente: así la taxonomía se
 * puede editar sin tocar el código. Este mapa es el único puente entre los dos
 * mundos y nunca falla: una cocina nueva sin icono cae en el genérico.
 */
const ICONOS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Coffee,
  Croissant,
  CakeSlice,
  Pizza,
  Wheat,
  Soup,
  Fish,
  Flame,
  ChefHat,
  HandPlatter,
  CookingPot,
  Leaf,
  Sandwich,
  Beef,
  Waves,
  Truck,
  Salad,
  Sprout,
  IceCreamBowl,
  CupSoda,
  Sparkles,
};

export const iconoCocina = (nombre?: string | null): LucideIcon =>
  (nombre && ICONOS[nombre]) || UtensilsCrossed;
