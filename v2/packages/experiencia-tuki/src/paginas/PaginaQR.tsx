import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, ExternalLink } from 'lucide-react';
import { ThemeToggle, BotonTexto, Logo, Contenedor, Seccion, Tarjeta } from '../componentes/ui';
import { origenPublico } from '../lib/urlPublica';

export default function PaginaQR() {
  const appUrl = origenPublico();

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(appUrl)}&color=C2410C&bgcolor=FFFFFF`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appUrl);
    alert('¡Link copiado al portapapeles!');
  };

  return (
    <div className="min-h-screen bg-af-ground font-system text-af-ink transition-colors duration-300">
      <nav className="nav-af fixed top-0 w-full z-50">
        <Contenedor maxAncho="grande">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
            <Link to="/" className="flex items-center gap-3 font-system text-xl font-bold group">
              <div className="p-2 rounded-xl bg-af-accent-solid text-white">
                <Logo size={22} />
              </div>
              <span className="text-af-ink tracking-tight">Tuki</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/">
                <button className="p-2 rounded-full bg-af-surface border border-af/30 text-af-ink hover:bg-af-surface/50 transition-colors">
                  <ArrowLeft size={20} />
                </button>
              </Link>
            </div>
          </div>
        </Contenedor>
      </nav>

      <Seccion padding="grande">
        <Contenedor maxAncho="grande">
          <div className="text-center mb-16 animate-fade-in-af">
            <div className="inline-flex items-center gap-3 mb-4 text-af-accent">
              <QrCode size={48} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-af-ink mb-4 font-system tracking-tight">
              Código QR de Tuki
            </h1>
            <p className="text-lg text-af-ink-secondary max-w-2xl mx-auto leading-relaxed">
              Escanea este código con tu celular para acceder directamente a Tuki
            </p>
          </div>

          <Tarjeta enlace={false} className="max-w-md mx-auto p-8 md:p-12 rounded-[32px] border border-af/20 shadow-sm animate-fade-in-af">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="p-6 rounded-[28px] bg-white border border-af/20 shadow-xl">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-2xl"
                  />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white p-4 rounded-2xl border border-af/20 shadow-xl">
                    <div className="bg-af-accent-solid text-white p-3 rounded-xl">
                      <Logo size={32} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-lg">
                <p className="text-xs font-bold text-af-ink-secondary uppercase tracking-wider mb-2">URL de la aplicación</p>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={appUrl}
                    readOnly
                    className="w-full input-af pr-16 text-sm text-af-ink font-mono truncate"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-af-accent text-white hover:opacity-90 transition-opacity"
                    title="Copiar URL"
                  >
                    <ExternalLink size={18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </Tarjeta>

          <div className="mt-12 flex justify-center">
            <Link to="/">
              <BotonTexto>Volver al Inicio</BotonTexto>
            </Link>
          </div>
        </Contenedor>
      </Seccion>
    </div>
  );
}
