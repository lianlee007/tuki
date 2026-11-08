import type React from 'react';
import { useState } from 'react';
import { mensajeDeError } from '@tuki/api-cliente';
import { apis } from '../apis';
import { Boton, Entrada, MensajeError, Tarjeta } from '@tuki/ui-kit';

/** Alta mínima del restaurante cuando la cuenta aún no tiene uno. */
export const CrearRestaurante: React.FC<{ alCrear: () => void }> = ({ alCrear }) => {
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('Popayán');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const crear = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apis.restaurantes.crear({
        nombre,
        ciudad,
        whatsapp,
        cocinas: ['local'],
      });
      alCrear();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta>
      <h2>Configura tu restaurante</h2>
      <p className="tuki-subtitulo">
        Crea el local y luego agrega tus platos desde el menú.
      </p>
      <form onSubmit={(evento) => void crear(evento)}>
        <Entrada
          etiqueta="Nombre del restaurante"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          required
        />
        <Entrada
          etiqueta="Ciudad"
          value={ciudad}
          onChange={(evento) => setCiudad(evento.target.value)}
        />
        <Entrada
          etiqueta="WhatsApp"
          value={whatsapp}
          onChange={(evento) => setWhatsapp(evento.target.value)}
          placeholder="3001234567"
        />
        {error ? <MensajeError>{error}</MensajeError> : null}
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear restaurante'}
        </Boton>
      </form>
    </Tarjeta>
  );
};
