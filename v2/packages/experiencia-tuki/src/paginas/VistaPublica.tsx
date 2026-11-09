import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useSearchParams } from 'react-router-dom';
import { apis, aCategoria, aPlatillo, aRestaurante, aTema, intentar } from '../lib/api-tuki';
import { Restaurante, Tema, Platillo } from '../tipos';
import { PlantillaRestaurante } from '../componentes/restaurante/PlantillaRestaurante';
import { SEO } from '../componentes/sistema-diseno/SEO';

const VistaPublica = () => {
  const { slug } = useParams();
  const [parametros] = useSearchParams();
  const platoId = parametros.get('plato');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ restaurante: Restaurante | null; tema: Tema | null; platillos: Platillo[]; }>({ restaurante: null, tema: null, platillos: [] });

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const { data: ficha, error: fallo } = await intentar(() =>
          apis.restaurantes.ficha(slug),
        );
        if (fallo || !ficha) throw new Error('Restaurante no encontrado');

        setData({
          restaurante: aRestaurante(ficha.restaurante),
          tema: aTema(ficha.tema),
          platillos: ficha.platillos.map((platillo) =>
            aPlatillo(platillo, ficha.categorias.map(aCategoria)),
          ),
        });
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
      <PlantillaRestaurante
        restaurante={data.restaurante}
        tema={data.tema}
        platillos={data.platillos}
        platilloInicialId={platoId ?? undefined}
      />
    </>
  );
};

export default VistaPublica;
export { PlantillaRestaurante };
