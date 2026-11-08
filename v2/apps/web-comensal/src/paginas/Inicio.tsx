import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RestauranteDescubierto } from '@tuki/dominio';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import {
  Boton,
  Cabecera,
  Cargando,
  Etiqueta,
  MensajeError,
  Tarjeta,
} from '@tuki/ui-kit';
import { apis } from '../apis';

export const Inicio = () => {
  const { usuario, salir } = usarAuth();
  const [restaurantes, setRestaurantes] = useState<RestauranteDescubierto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apis.restaurantes
      .listar({ limite: 24 })
      .then((respuesta) => setRestaurantes(respuesta.items))
      .catch((fallo) => setError(mensajeDeError(fallo)))
      .finally(() => setCargando(false));
  }, []);

  return (
    <>
      <Cabecera>
        {usuario ? (
          <>
            <Link to="/mi-cuenta">Hola, {usuario.nombre}</Link>
            <Boton secundario onClick={() => void salir()}>
              Salir
            </Boton>
          </>
        ) : (
          <Link to="/entrar">Entrar</Link>
        )}
      </Cabecera>

      <main className="tuki-main">
        <h1 className="tuki-titulo">Descubre qué comer hoy</h1>
        <p className="tuki-subtitulo">
          Restaurantes de Popayán con su menú, su cocina y sus precios.
        </p>

        {cargando ? <Cargando /> : null}
        {error ? <MensajeError>{error}</MensajeError> : null}

        <div className="tuki-grid">
          {restaurantes.map((restaurante) => (
            <Link key={restaurante.id} to={`/restaurante/${restaurante.slug}`}>
              <Tarjeta>
                <Etiqueta>{restaurante.ciudad ?? 'Popayán'}</Etiqueta>
                <h3>{restaurante.nombre}</h3>
                <p style={{ color: 'var(--tuki-texto-suave)' }}>
                  {restaurante.descripcion ?? 'Menú disponible para pedir.'}
                </p>
                <div className="tuki-fila">
                  <small>{restaurante.platosCantidad} platos</small>
                  <span className="tuki-precio">
                    {restaurante.precioMin === null
                      ? 'Sin precio'
                      : `Desde $${restaurante.precioMin.toLocaleString('es-CO')}`}
                  </span>
                </div>
              </Tarjeta>
            </Link>
          ))}
        </div>

        {!cargando && !error && restaurantes.length === 0 ? (
          <p>No hay restaurantes publicados todavía.</p>
        ) : null}
      </main>
    </>
  );
};
