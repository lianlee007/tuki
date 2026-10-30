import React, { useEffect, useState } from 'react';
// @ts-ignore — react-router-dom no publica tipos en este proyecto.
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  LogOut,
  MapPin,
  MessageSquare,
  ReceiptText,
  Store,
} from 'lucide-react';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { Avatar } from '../componentes/sistema-diseno/Avatar';
import { ThemeToggle } from '../componentes/sistema-diseno/TemaToggle';
import { MarcaTuki } from '../componentes/sistema-diseno/Logo';
import { SEO } from '../componentes/sistema-diseno/SEO';
import { MisResenas } from '../componentes/cuenta/MisResenas';
import { MisPedidos } from '../componentes/cuenta/MisPedidos';
import { SeccionDatosEnvio } from '../componentes/cuenta/SeccionDatosEnvio';
import { useDatosEnvio } from '../modulos/cuenta';

type Seccion = 'resenas' | 'pedidos' | 'envio';

const fechaAlta = (iso?: string): string => {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

/**
 * «Mi cuenta» del comensal.
 *
 * No es un perfil público: es la trastienda de quien pide. Reúne sus datos de
 * envío, sus reseñas y sus pedidos, y deja claro qué se publica y qué no.
 * El dueño de un restaurante entra igual, con un atajo a su panel.
 */
export default function PaginaMiCuenta() {
  const { user, rol, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const seccionPedida = params.get('seccion');
  const [seccion, setSeccion] = useState<Seccion>(() =>
    seccionPedida === 'envio' || seccionPedida === 'pedidos' ? seccionPedida : 'resenas'
  );
  const envio = useDatosEnvio(user?.id);

  useEffect(() => {
    if (seccionPedida === 'envio' || seccionPedida === 'pedidos' || seccionPedida === 'resenas') {
      setSeccion(seccionPedida);
    }
  }, [seccionPedida]);

  if (!user) return null;

  const nombre =
    [user.user_metadata?.nombre, user.user_metadata?.apellido]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    user.email?.split('@')[0] ||
    'Tu cuenta';

  const desde = fechaAlta(user.created_at);

  const salir = async () => {
    await cerrarSesion();
    navigate('/');
  };

  const cambiarSeccion = (nueva: Seccion) => {
    setSeccion(nueva);
    navigate(`/mi-cuenta?seccion=${nueva}`, { replace: true });
  };

  const tabs: { id: Seccion; texto: string; icono: React.ReactNode }[] = [
    { id: 'resenas', texto: 'Mis reseñas', icono: <MessageSquare size={16} /> },
    { id: 'pedidos', texto: 'Mis pedidos', icono: <ReceiptText size={16} /> },
    { id: 'envio', texto: 'Datos de envío', icono: <MapPin size={16} /> },
  ];

  return (
    <>
      <SEO
        titulo="Mi cuenta · Tuki"
        descripcion="Tus datos de envío, reseñas y pedidos en Tuki, en un solo lugar."
      />

      <div className="min-h-screen bg-af-ground font-system text-af-ink">
        <header className="nav-af sticky top-0 z-40">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
            <Link to="/" className="af-pulsar flex items-center" aria-label="Tuki, volver a descubrir">
              <MarcaTuki tamano={20} titulo="" />
            </Link>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <Link
                to="/"
                className="af-pulsar inline-flex items-center gap-2 rounded-full bg-af-surface px-3.5 py-2 text-[13px] font-semibold text-af-ink transition-colors hover:text-af-accent-text"
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Seguir explorando</span>
                <span className="sm:hidden">Volver</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
          <section className="rounded-[26px] bg-af-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar nombre={nombre} tamano={64} />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-af-ink-secondary">
                  Mi cuenta
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-af-ink">
                  {nombre}
                </h1>
                <p className="mt-1 truncate text-sm text-af-ink-secondary">{user.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-af-ground px-2.5 py-1 text-[11px] font-semibold text-af-ink-secondary">
                    {rol === 'restaurante' ? 'Cuenta de restaurante' : 'Cuenta de comensal'}
                  </span>
                  {desde && (
                    <span className="text-[11px] text-af-ink-secondary">
                      En Tuki desde {desde}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
                {rol === 'restaurante' && (
                  <Link
                    to="/panel"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-af-accent-solid px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 af-pulsar"
                  >
                    <Store size={16} /> Ir a mi panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={salir}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-af-danger/20 px-4 py-2.5 text-sm font-semibold text-af-danger-text transition-colors hover:bg-af-danger/10 af-pulsar"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </div>

            <p className="mt-5 rounded-xl bg-af-ground px-3.5 py-3 text-xs leading-relaxed text-af-ink-secondary">
              Tu correo nunca se muestra en una reseña. Solo se publica el nombre
              que escribiste, las estrellas y, si la añadiste, la foto.
            </p>
          </section>

          {rol === 'cliente' &&
            seccion !== 'envio' &&
            !envio.cargando &&
            !envio.completo &&
            !envio.error && (
            <button
              type="button"
              onClick={() => cambiarSeccion('envio')}
              className="af-pulsar mt-5 flex w-full items-center gap-3 rounded-2xl border border-af-accent/25 bg-af-accent/5 p-4 text-left transition-colors hover:bg-af-accent/10"
            >
              <span className="rounded-xl bg-af-accent/15 p-2.5 text-af-accent-text">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-af-ink">
                  Guarda tu dirección de entrega
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-af-ink-secondary">
                  La usaremos para llenar tus pedidos y no escribirla cada vez.
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-af-accent-text">
                Completar <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          )}

          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Secciones de mi cuenta">
            {tabs.map((tab) => {
              const activa = seccion === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => cambiarSeccion(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors af-pulsar ${
                    activa
                      ? 'bg-af-ink text-af-ground'
                      : 'bg-af-surface text-af-ink-secondary hover:text-af-ink'
                  }`}
                >
                  {tab.icono}
                  {tab.texto}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            {seccion === 'envio' ? (
              <SeccionDatosEnvio estado={envio} />
            ) : seccion === 'pedidos' ? (
              <MisPedidos usuarioId={user.id} />
            ) : (
              <MisResenas usuarioId={user.id} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
