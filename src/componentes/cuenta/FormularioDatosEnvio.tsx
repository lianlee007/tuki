import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, Save, ShieldCheck } from 'lucide-react';
import { Boton, Input, Textarea } from '../ui';
import {
  DATOS_ENVIO_VACIOS,
  erroresDatosEnvio,
  normalizarDatosEnvio,
  soloDigitos,
  type DatosEnvio,
} from '../../modulos/cuenta';

interface Props {
  /** Datos actuales de la cuenta; si faltan, el formulario arranca vacío. */
  inicial?: DatosEnvio | null;
  guardando?: boolean;
  error?: string | null;
  textoBoton?: string;
  /** Si se pasa, aparece la salida «lo hago más tarde». */
  onOmitir?: () => void | Promise<void>;
  textoOmitir?: string;
  /** Nota bajo los campos; el registro y «Mi cuenta» cambian el énfasis. */
  nota?: string;
  onGuardar: (datos: DatosEnvio) => void | Promise<void>;
}

type Campo = keyof DatosEnvio;

/**
 * Formulario de los datos de entrega.
 *
 * Se usa en dos momentos: al crear la cuenta de comensal (antes de enviar el
 * registro) y en «Mi cuenta» para actualizarlos. La validación es local y la
 * misma que aplica `src/lib/datosEnvio.ts`; el guardado lo decide el padre.
 */
export const FormularioDatosEnvio: React.FC<Props> = ({
  inicial,
  guardando = false,
  error = null,
  textoBoton = 'Guardar datos de envío',
  onOmitir,
  textoOmitir = 'Ahora no, lo completo más tarde',
  nota,
  onGuardar,
}) => {
  const [datos, setDatos] = useState<DatosEnvio>(() => ({
    ...DATOS_ENVIO_VACIOS,
    ...(inicial ?? {}),
  }));
  const [tocado, setTocado] = useState(false);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [omitiendo, setOmitiendo] = useState(false);

  /* Si los datos llegan después (la consulta de la cuenta es asíncrona), se
     rellenan sin pisar lo que la persona ya haya escrito. */
  const inicialTelefono = inicial?.telefono ?? '';
  const inicialDireccion = inicial?.direccion ?? '';
  const inicialBarrio = inicial?.barrio ?? '';
  const inicialReferencias = inicial?.referencias ?? '';

  useEffect(() => {
    setDatos((previos) => ({
      telefono: previos.telefono || inicialTelefono,
      direccion: previos.direccion || inicialDireccion,
      barrio: previos.barrio || inicialBarrio,
      referencias: previos.referencias || inicialReferencias,
    }));
  }, [inicialTelefono, inicialDireccion, inicialBarrio, inicialReferencias]);

  const errores = erroresDatosEnvio(datos);
  const valido = Object.keys(errores).length === 0;
  const mostrar = (campo: Campo) => Boolean(tocados[campo] || tocado);
  const ocupado = guardando || omitiendo;

  const cambiar = (campo: Campo, valor: string) => {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  };

  const alEnviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setTocado(true);
    if (!valido) return;
    await onGuardar(normalizarDatosEnvio(datos));
  };

  const alOmitir = async () => {
    if (!onOmitir) return;
    setOmitiendo(true);
    try {
      await onOmitir();
    } finally {
      setOmitiendo(false);
    }
  };

  return (
    <form onSubmit={alEnviar} className="space-y-4" autoComplete="on">
      <Input
        label="Teléfono"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="300 111 2233"
        value={datos.telefono}
        onChange={(evento) =>
          cambiar('telefono', soloDigitos(evento.target.value).slice(0, 10))
        }
        onBlur={() => setTocados((previos) => ({ ...previos, telefono: true }))}
        maxLength={10}
        icon={<Phone size={18} />}
        error={mostrar('telefono') && Boolean(errores.telefono)}
        helper={mostrar('telefono') ? errores.telefono : '10 dígitos, sin indicativo.'}
      />

      <Input
        label="Dirección"
        type="text"
        autoComplete="street-address"
        placeholder="Calle 5 # 10-20"
        value={datos.direccion}
        onChange={(evento) => cambiar('direccion', evento.target.value)}
        onBlur={() => setTocados((previos) => ({ ...previos, direccion: true }))}
        maxLength={200}
        icon={<MapPin size={18} />}
        error={mostrar('direccion') && Boolean(errores.direccion)}
        helper={
          mostrar('direccion')
            ? errores.direccion
            : 'Calle, carrera o la dirección completa.'
        }
      />

      <Input
        label="Barrio"
        type="text"
        autoComplete="address-level3"
        placeholder="Centro"
        value={datos.barrio}
        onChange={(evento) => cambiar('barrio', evento.target.value)}
        onBlur={() => setTocados((previos) => ({ ...previos, barrio: true }))}
        maxLength={60}
        error={mostrar('barrio') && Boolean(errores.barrio)}
        helper={
          mostrar('barrio') ? errores.barrio : 'El barrio ayuda a ubicar la entrega.'
        }
      />

      <Textarea
        label="Referencias (opcional)"
        autoComplete="off"
        placeholder="Torre, apartamento, color del edificio o punto de referencia"
        value={datos.referencias}
        onChange={(evento) => cambiar('referencias', evento.target.value)}
        onBlur={() => setTocados((previos) => ({ ...previos, referencias: true }))}
        maxLength={160}
        rows={2}
        className="min-h-[84px]"
        error={mostrar('referencias') && Boolean(errores.referencias)}
        helper={mostrar('referencias') ? errores.referencias : undefined}
      />

      <p className="flex items-start gap-2 rounded-xl bg-af-ground px-3 py-2.5 text-[11px] leading-relaxed text-af-ink-secondary">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-af-success" />
        <span>
          {nota ??
            'Solo lo ve el restaurante que recibe tu pedido. Puedes cambiarlo cuando quieras desde Mi cuenta.'}
        </span>
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-af-danger/30 bg-af-danger/10 px-3 py-2.5 text-sm font-medium text-af-danger-text"
        >
          {error}
        </p>
      )}

      <div className="space-y-3 pt-1">
        <Boton
          type="submit"
          cargando={guardando}
          disabled={omitiendo}
          anchoCompleto
          icono={<Save size={16} />}
        >
          {textoBoton}
        </Boton>

        {onOmitir && (
          <div className="space-y-2">
            <p className="text-center text-[11px] font-medium uppercase tracking-wide text-af-ink-secondary">
              ¿Prefieres hacerlo después?
            </p>
            <button
              type="button"
              onClick={alOmitir}
              disabled={ocupado}
              className="af-pulsar flex w-full items-center justify-center gap-2 rounded-xl border border-af-ink/15 px-4 py-3 text-sm font-semibold text-af-ink-secondary transition-colors hover:border-af-ink/25 hover:text-af-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Clock size={15} />
              {omitiendo ? 'Guardando…' : textoOmitir}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-af-ink-secondary">
              Podrás completarlos más tarde desde <strong>Mi cuenta</strong> o al
              terminar tu primer pedido.
            </p>
          </div>
        )}
      </div>

      {!onOmitir && (
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-af-success">
          <CheckCircle2 size={13} /> Tus datos se guardan en tu cuenta, no en este
          navegador.
        </p>
      )}
    </form>
  );
};
