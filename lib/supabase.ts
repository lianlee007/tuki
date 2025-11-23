/**
 * Descripción: Configuración e inicialización del cliente de base de datos Supabase.
 */
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../constantes';

// Aseguramos que siempre haya un valor string para evitar el error "supabaseUrl is required"
// Si las credenciales fallan, la app cargará pero las peticiones darán error (más fácil de depurar que una pantalla blanca)
const supabaseUrl = ENV.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = ENV.SUPABASE_ANON_KEY || "placeholder-key";

// Creación de la instancia única del cliente
export const supabase = createClient(supabaseUrl, supabaseKey);