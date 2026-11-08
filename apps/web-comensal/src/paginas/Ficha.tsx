import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { RestaurantePublico } from '@tuki/dominio';
import { mensajeDeError } from '@tuki/api-cliente';
import { Cabecera, Cargando, Etiqueta, MensajeError, Tarjeta } from '@tuki/ui-kit';
import { apis } from '../apis';

interface Resumen {
  promedio: number;
  cantidad: number;
}

export const Ficha = () => {
  const { slug = '' } = useParams();
  const [ficha, setFicha] = useState<RestaurantePublico | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);

    apis.restaurantes
      .ficha(slug)
      .then(async (datos) => {
        if (!vigente) return;
        setFicha(datos);
        try {
          const resenas = await apis.resenas.listar(datos.restaurante.id);
          if (vigente) setResumen(resenas.resumen);
        } catch {
          if (vigente) setResumen(null);
        }
      })
      .catch((fallo) => {
        if (vigente) setError(mensajeDeError(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [slug]);

  if (cargando) {
    return (
      <>
        <Cabecera />
        <main className="tuki-main">
          <Cargando />
        </main>
      </>
    );
  }

  if (error || !ficha) {
    return (
      <>
        <Cabecera />
        <main className="tuki-main">
          <MensajeError>{error ?? 'No encontramos el restaurante.'}</MensajeError>
          <p>
            <Link to="/">Volver al inicio</Link>
          </p>
        </main>
      </>
    );
  }

  const { restaurante, tema, cocinas, categorias, platillos } = ficha;
  const nombreCategoria = (id: string | null) =>
    categorias.find((categoria) => categoria.id === id)?.nombre ?? 'Menú';

  return (
    <>
      <Cabecera />
      <main className="tuki-main">
        <div
          className="tuki-card"
          style={{ background: tema.colorFondo, color: tema.colorTexto }}
        >
          <h1 className="tuki-titulo" style={{ color: tema.colorTextoTitulos }}>
            {restaurante.nombre}
          </h1>
          <p>{restaurante.eslogan ?? restaurante.descripcion}</p>
          <div className="tuki-fila">
            <div>
              {cocinas.map((cocina) => (
                <Etiqueta key={cocina.id}>{cocina.nombre}</Etiqueta>
              ))}
            </div>
            <strong>
              {resumen ? `★ ${resumen.promedio} (${resumen.cantidad})` : 'Sin reseñas'}
            </strong>
          </div>
        </div>

        <h2 style={{ marginTop: 28 }}>Menú</h2>
        <div className="tuki-grid">
          {platillos.map((platillo) => (
            <Tarjeta key={platillo.id}>
              <small style={{ color: 'var(--tuki-texto-suave)' }}>
                {nombreCategoria(platillo.categoriaId)}
              </small>
              <h3>{platillo.nombre}</h3>
              <p>{platillo.descripcion}</p>
              <div className="tuki-fila">
                <span className="tuki-precio">
                  ${platillo.precio.toLocaleString('es-CO')}
                </span>
                {platillo.vegetariano ? <Etiqueta>Vegetariano</Etiqueta> : null}
              </div>
            </Tarjeta>
          ))}
        </div>

        {platillos.length === 0 ? <p>Este restaurante aún no publicó platos.</p> : null}
      </main>
    </>
  );
};
