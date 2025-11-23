
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Restaurante, Tema, Platillo } from '../tipos';
import { PlantillaRestaurante } from '../componentes/restaurante/PlantillaRestaurante';
import { SEO } from '../componentes/sistema-diseno/SEO';
import { generarSlug } from '../lib/utils';

const VistaPublica = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ restaurante: Restaurante | null; tema: Tema | null; platillos: Platillo[]; }>({ restaurante: null, tema: null, platillos: [] });

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        // El slug tiene formato: "nombre-restaurante-abc12345"
        // Extraer el ID del slug (últimos 8 caracteres después del último guión)
        const partes = slug.split('-');
        const idCorto = partes[partes.length - 1];
        
        // Primero intentar buscar directamente por ID completo si el slug es solo el ID (compatibilidad con URLs antiguas)
        const { data: restById, error: errorById } = await supabase
          .from('restaurantes')
          .select('*')
          .eq('id', slug)
          .maybeSingle();
        
        let rest = restById;
        
        // Si no se encontró por ID completo, buscar por ID corto al final del slug
        if (!rest && idCorto && idCorto.length === 8) {
          const { data: restaurantes, error: restError } = await supabase
            .from('restaurantes')
            .select('*');
          
          if (!restError && restaurantes) {
            // Encontrar el restaurante cuyo ID empiece con el idCorto del slug
            rest = restaurantes.find(r => r.id.toLowerCase().startsWith(idCorto.toLowerCase()));
          }
        }
        
        // Si aún no se encontró, intentar buscar por nombre normalizado (compatibilidad con URLs antiguas sin ID)
        if (!rest) {
          const { data: restaurantes, error: restError } = await supabase
            .from('restaurantes')
            .select('*');
          
          if (!restError && restaurantes) {
            rest = restaurantes.find(r => generarSlug(r.nombre) === slug);
          }
        }
        
        if (!rest) throw new Error('Restaurante no encontrado');

        const { data: themeData } = await supabase.from('temas').select('*').eq('restaurante_id', rest.id).maybeSingle();
        const theme: Tema = themeData || {
             id: 'default', restaurante_id: rest.id, color_primario: '#000000', color_secundario: '#333333', color_fondo: '#FFFFFF', color_texto: '#000000', color_texto_titulos: '#000000', fuente_titulos: 'Playfair Display', fuente_cuerpo: 'Inter'
        };

        const { data: dishes } = await supabase.from('platillos').select('*').eq('restaurante_id', rest.id).eq('activo', true).order('orden');

        setData({ restaurante: rest, tema: theme, platillos: dishes || [] });
      } catch (err: any) {
        setError(err.message || 'Error al cargar el restaurante');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
  
  if (error || !data.restaurante || !data.tema) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center"><h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1><p className="text-xl text-gray-600 mb-8">{error || 'Restaurante no encontrado'}</p><a href="/" className="px-6 py-3 bg-black text-white rounded-xl hover:opacity-80 font-bold transition-all">Volver al Inicio</a></div>;

  return (
    <>
      <SEO 
        titulo={`${data.restaurante.nombre} | Menú Digital`}
        descripcion={data.restaurante.descripcion || `Descubre el menú de ${data.restaurante.nombre}. Pide en línea.`}
        imagen={data.restaurante.imagen_banner_url}
      />
      <PlantillaRestaurante restaurante={data.restaurante} tema={data.tema} platillos={data.platillos} />
    </>
  );
};

export default VistaPublica;
export { PlantillaRestaurante };
