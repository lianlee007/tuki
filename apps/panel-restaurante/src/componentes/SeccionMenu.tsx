import type React from 'react';
import type { PanelRestaurante } from '@tuki/dominio';
import { Etiqueta, Tarjeta } from '@tuki/ui-kit';
import { NuevoPlatillo } from './NuevoPlatillo';

/** Resumen del menú agrupado por categoría. */
export const SeccionMenu: React.FC<{
  panel: PanelRestaurante;
  alCrear: () => void;
}> = ({ panel, alCrear }) => {
  const nombreCategoria = (id: string | null) =>
    panel.categorias.find((categoria) => categoria.id === id)?.nombre ?? 'Sin categoría';

  return (
    <Tarjeta>
      <div className="tuki-fila">
        <h2>Menú</h2>
        <Etiqueta>{panel.platillos.length} platos</Etiqueta>
      </div>

      {panel.categorias.map((categoria) => {
        const platos = panel.platillos.filter(
          (platillo) => platillo.categoriaId === categoria.id,
        );
        return (
          <div key={categoria.id} style={{ marginTop: 16 }}>
            <h3>{categoria.nombre}</h3>
            <ul className="tuki-lista">
              {platos.map((platillo) => (
                <li key={platillo.id} className="tuki-fila">
                  <span>
                    {platillo.nombre}
                    <small style={{ color: 'var(--tuki-texto-suave)' }}>
                      {' '}
                      · {nombreCategoria(platillo.categoriaId)}
                    </small>
                  </span>
                  <span className="tuki-precio">
                    ${platillo.precio.toLocaleString('es-CO')}
                  </span>
                </li>
              ))}
            </ul>
            {platos.length === 0 ? <p>Sin platos en esta categoría.</p> : null}
          </div>
        );
      })}
      <div style={{ marginTop: 16 }}>
        <NuevoPlatillo
          restauranteId={panel.restaurante.id}
          categorias={panel.categorias}
          alCrear={alCrear}
        />
      </div>
    </Tarjeta>
  );
};
