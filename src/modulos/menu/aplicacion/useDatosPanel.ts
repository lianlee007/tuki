
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Restaurante, Tema, Categoria, Platillo } from '../../../tipos';
import { apiRestaurante } from '../infraestructura/apiRestaurante';
import { apiPlatillos } from '../infraestructura/apiPlatillos';

export const useDatosPanel = (user: User | null) => {
  const [cargando, setCargando] = useState(true);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [tema, setTema] = useState<Tema | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  const mostrarMensaje = (tipo: 'exito' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    // Los errores necesitan más tiempo: hay que leerlos y corregir el campo.
    setTimeout(() => setMensaje(null), tipo === 'error' ? 6000 : 3000);
  };

  const cargarDatos = async () => {
    if (!user) return;
    setCargando(true);
    try {
      // 1. Cargar Restaurante
      const { data: restInicial, error: restError } = await apiRestaurante.obtenerPorUsuario(user.id);
      let restData = restInicial;
      if (restError) throw restError;

      if (!restData) {
         const { data: newRest, error: createError } = await apiRestaurante.crear(user.id, {
             email: user.email,
             nombre: user.user_metadata?.nombre,
             apellido: user.user_metadata?.apellido
         });
         if (createError) throw createError;
         restData = newRest;
      }
      setRestaurante(restData);

      // 2. Cargar Tema
      let { data: temaData } = await apiRestaurante.obtenerTema(restData.id);
      if (!temaData) {
          const { data: newTema } = await apiRestaurante.crearTemaDefault(restData.id);
          temaData = newTema;
      }
      setTema(temaData);

      // 3. Cargar Datos Relacionados
      const { data: catData } = await apiPlatillos.obtenerCategorias(restData.id);
      setCategorias(catData || []);

      const { data: platData } = await apiPlatillos.obtenerPorRestaurante(restData.id);
      const platillosMapeados = (platData || []).map(p => ({ ...p, visible: p.activo !== false }));
      setPlatillos(platillosMapeados);

    } catch (error: any) {
      console.error("Error cargando datos:", error);
      mostrarMensaje('error', typeof error === 'string' ? error : error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (user) cargarDatos();
  }, [user]);

  return {
    cargando,
    restaurante,
    setRestaurante,
    tema,
    setTema,
    categorias,
    platillos,
    setPlatillos,
    mensaje,
    mostrarMensaje,
    cargarDatos
  };
};
