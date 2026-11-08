import { useCallback, useEffect, useState } from 'react';
import type { PanelRestaurante, Pedido, Resena } from '@tuki/dominio';
import { ErrorHttp, mensajeDeError } from '@tuki/api-cliente';
import { usarAuth } from '@tuki/auth-react';
import { Cabecera, Cargando, Etiqueta, MensajeError, Tarjeta } from '@tuki/ui-kit';
import { apis } from '../apis';
import { CrearRestaurante } from '../componentes/CrearRestaurante';
import { SeccionMenu } from '../componentes/SeccionMenu';
import { SeccionPedidos } from '../componentes/SeccionPedidos';
import { SeccionResenas } from '../componentes/SeccionResenas';

interface Resumen {
  promedio: number;
  cantidad: number;
}

export const Panel = () => {
  const { usuario, salir } = usarAuth();
  const [panel, setPanel] = useState<PanelRestaurante | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sinRestaurante, setSinRestaurante] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await apis.restaurantes.mios();
      setPanel(datos);
      setSinRestaurante(false);

      const [listaPedidos, listaResenas] = await Promise.all([
        apis.pedidos.porRestaurante(datos.restaurante.id),
        apis.resenas.listar(datos.restaurante.id),
      ]);
      setPedidos(listaPedidos.pedidos);
      setResenas(listaResenas.resenas);
      setResumen(listaResenas.resumen);
    } catch (fallo) {
      if (fallo instanceof ErrorHttp && fallo.codigo === 'no_encontrado') {
        setSinRestaurante(true);
      } else {
        setError(mensajeDeError(fallo));
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiarEstado = async (pedidoId: string, estado: Pedido['estado']) => {
    try {
      await apis.pedidos.cambiarEstado(pedidoId, estado);
      await cargar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  const responder = async (resenaId: string, respuesta: string) => {
    try {
      await apis.resenas.responder(resenaId, respuesta);
      await cargar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  return (
    <>
      <Cabecera titulo="Tuki Panel">
        <span>{usuario?.nombre}</span>
        <button
          className="tuki-btn tuki-btn-secundario"
          onClick={() => void salir()}
        >
          Salir
        </button>
      </Cabecera>

      <main className="tuki-main">
        {cargando ? <Cargando /> : null}
        {error ? <MensajeError>{error}</MensajeError> : null}

        {!cargando && sinRestaurante ? <CrearRestaurante alCrear={() => void cargar()} /> : null}

        {panel ? (
          <>
            <div className="tuki-fila">
              <div>
                <h1 className="tuki-titulo">{panel.restaurante.nombre}</h1>
                <p className="tuki-subtitulo">
                  {panel.restaurante.ciudad ?? 'Sin ciudad'} ·{' '}
                  <a
                    href={`http://localhost:5173/restaurante/${panel.restaurante.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver página pública
                  </a>
                </p>
              </div>
              <Etiqueta>{panel.restaurante.activo ? 'Publicado' : 'Oculto'}</Etiqueta>
            </div>

            <div className="tuki-grid" style={{ marginBottom: 24 }}>
              <Tarjeta>
                <small>Platos</small>
                <h2>{panel.platillos.length}</h2>
              </Tarjeta>
              <Tarjeta>
                <small>Pedidos</small>
                <h2>{pedidos.length}</h2>
              </Tarjeta>
              <Tarjeta>
                <small>Reseñas</small>
                <h2>{resenas.length}</h2>
              </Tarjeta>
              <Tarjeta>
                <small>Calificación</small>
                <h2>{resumen ? `★ ${resumen.promedio}` : '—'}</h2>
              </Tarjeta>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <SeccionMenu panel={panel} />
              <SeccionPedidos
                pedidos={pedidos}
                onCambiarEstado={(id, estado) => void cambiarEstado(id, estado)}
              />
              <SeccionResenas
                resenas={resenas}
                resumen={resumen}
                onResponder={responder}
              />
            </div>
          </>
        ) : null}
      </main>
    </>
  );
};
