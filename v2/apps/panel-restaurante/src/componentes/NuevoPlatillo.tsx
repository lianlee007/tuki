import type React from 'react';
import { useState } from 'react';
import type { Categoria } from '@tuki/dominio';
import { mensajeDeError } from '@tuki/api-cliente';
import { Boton, Entrada, MensajeError, Tarjeta } from '@tuki/ui-kit';
import { apis } from '../apis';

/** Alta rápida de un plato desde el panel. */
export const NuevoPlatillo: React.FC<{
  restauranteId: string;
  categorias: Categoria[];
  alCrear: () => void;
}> = ({ restauranteId, categorias, alCrear }) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? '');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const crear = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apis.restaurantes.crearPlatillo(restauranteId, {
        nombre,
        precio: Number(precio),
        categoriaId: categoriaId || null,
        descripcion,
      });
      setNombre('');
      setPrecio('');
      setDescripcion('');
      alCrear();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta>
      <h3>Agregar plato</h3>
      <form onSubmit={(evento) => void crear(evento)}>
        <Entrada
          etiqueta="Nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          required
        />
        <Entrada
          etiqueta="Precio"
          type="number"
          min={0}
          value={precio}
          onChange={(evento) => setPrecio(evento.target.value)}
          required
        />
        <label className="tuki-campo">
          <span className="tuki-label">Categoría</span>
          <select
            className="tuki-input"
            value={categoriaId}
            onChange={(evento) => setCategoriaId(evento.target.value)}
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>
        <Entrada
          etiqueta="Descripción"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />
        {error ? <MensajeError>{error}</MensajeError> : null}
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Agregar al menú'}
        </Boton>
      </form>
    </Tarjeta>
  );
};
