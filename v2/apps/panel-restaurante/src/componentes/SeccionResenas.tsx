import type React from 'react';
import { useState } from 'react';
import type { Resena } from '@tuki/dominio';
import { Boton, Tarjeta } from '@tuki/ui-kit';

export const SeccionResenas: React.FC<{
  resenas: Resena[];
  resumen: { promedio: number; cantidad: number } | null;
  onResponder: (resenaId: string, respuesta: string) => Promise<void>;
}> = ({ resenas, resumen, onResponder }) => {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  return (
    <Tarjeta>
      <div className="tuki-fila">
        <h2>Reseñas</h2>
        <strong>
          {resumen ? `★ ${resumen.promedio} (${resumen.cantidad})` : 'Sin reseñas'}
        </strong>
      </div>

      <ul className="tuki-lista">
        {resenas.map((resena) => (
          <li key={resena.id}>
            <div className="tuki-fila">
              <strong>{resena.nombreCliente}</strong>
              <span>{'★'.repeat(resena.calificacion)}</span>
            </div>
            <p>{resena.comentario ?? 'Sin comentario.'}</p>
            {resena.respuestaDueno ? (
              <p style={{ color: 'var(--tuki-texto-suave)' }}>
                Respuesta: {resena.respuestaDueno}
              </p>
            ) : (
              <div className="tuki-fila">
                <input
                  className="tuki-input"
                  placeholder="Responder…"
                  value={respuestas[resena.id] ?? ''}
                  onChange={(evento) =>
                    setRespuestas((previo) => ({
                      ...previo,
                      [resena.id]: evento.target.value,
                    }))
                  }
                />
                <Boton
                  type="button"
                  secundario
                  disabled={!respuestas[resena.id]?.trim()}
                  onClick={() => {
                    const texto = respuestas[resena.id]?.trim();
                    if (texto) void onResponder(resena.id, texto);
                  }}
                >
                  Responder
                </Boton>
              </div>
            )}
          </li>
        ))}
      </ul>

      {resenas.length === 0 ? <p>Aún no tienes reseñas.</p> : null}
    </Tarjeta>
  );
};
