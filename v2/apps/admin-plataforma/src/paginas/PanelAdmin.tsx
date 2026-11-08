import { useEffect, useState } from 'react';
import type { RestauranteDescubierto } from '@tuki/dominio';
import { mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import {
  Cabecera,
  Cargando,
  Etiqueta,
  MensajeError,
  Tarjeta,
} from '@tuki/ui-kit';
import { apis } from '../apis';

const SERVICIOS = [
  { nombre: 'Identidad', url: 'http://localhost:3001/salud' },
  { nombre: 'Restaurantes', url: 'http://localhost:3002/salud' },
  { nombre: 'Medios', url: 'http://localhost:3003/salud' },
  { nombre: 'Pedidos', url: 'http://localhost:3004/salud' },
  { nombre: 'Reseñas', url: 'http://localhost:3005/salud' },
];

interface EstadoServicio {
  nombre: string;
  ok: boolean;
}

export const PanelAdmin = () => {
  const { usuario, salir } = usarAuth();
  const [restaurantes, setRestaurantes] = useState<RestauranteDescubierto[]>([]);
  const [servicios, setServicios] = useState<EstadoServicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const respuesta = await apis.restaurantes.listar({ limite: 60 });
        setRestaurantes(respuesta.items);
      } catch (fallo) {
        setError(mensajeDeError(fallo));
      } finally {
        setCargando(false);
      }
    };

    const revisarServicios = async () => {
      const resultados = await Promise.allSettled(
        SERVICIOS.map(async (servicio) => {
          const respuesta = await fetch(servicio.url, {
            signal: AbortSignal.timeout(3_000),
          });
          return { nombre: servicio.nombre, ok: respuesta.ok };
        }),
      );

      setServicios(
        resultados.map((resultado, indice) => ({
          nombre: SERVICIOS[indice]?.nombre ?? 'Servicio',
          ok: resultado.status === 'fulfilled' && resultado.value.ok,
        })),
      );
    };

    void cargar();
    void revisarServicios();
  }, []);

  return (
    <>
      <Cabecera titulo="Tuki Admin">
        <span>{usuario?.email}</span>
        <button
          className="tuki-btn tuki-btn-secundario"
          onClick={() => void salir()}
        >
          Salir
        </button>
      </Cabecera>

      <main className="tuki-main">
        <h1 className="tuki-titulo">Estado de la plataforma</h1>
        <p className="tuki-subtitulo">
          Servicios desplegados y restaurantes publicados.
        </p>

        {error ? <MensajeError>{error}</MensajeError> : null}
        {cargando ? <Cargando /> : null}

        <div className="tuki-grid" style={{ marginBottom: 24 }}>
          {servicios.map((servicio) => (
            <Tarjeta key={servicio.nombre}>
              <div className="tuki-fila">
                <strong>{servicio.nombre}</strong>
                <Etiqueta>{servicio.ok ? 'En línea' : 'Sin conexión'}</Etiqueta>
              </div>
            </Tarjeta>
          ))}
        </div>

        <h2>Restaurantes</h2>
        <div className="tuki-grid">
          {restaurantes.map((restaurante) => (
            <Tarjeta key={restaurante.id}>
              <div className="tuki-fila">
                <strong>{restaurante.nombre}</strong>
                <Etiqueta>{restaurante.ciudad ?? 'Sin ciudad'}</Etiqueta>
              </div>
              <p>{restaurante.descripcion ?? 'Sin descripción.'}</p>
              <small>
                {restaurante.platosCantidad} platos · dueño aún no visible desde
                administración
              </small>
            </Tarjeta>
          ))}
        </div>

        {!cargando && restaurantes.length === 0 ? (
          <p>No hay restaurantes registrados.</p>
        ) : null}

        <p style={{ marginTop: 24, color: 'var(--tuki-texto-suave)' }}>
          Moderación de reseñas, suspensión de locales y gestión de usuarios se
          conectan en la siguiente iteración del panel.
        </p>
      </main>
    </>
  );
};
