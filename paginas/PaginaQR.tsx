import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, QrCode, ExternalLink } from 'lucide-react';
import { ThemeToggle, Boton, Logo } from '../componentes/ui';

export default function PaginaQR() {
    const appUrl = window.location.origin;

    // Generar URL del QR usando una API pública
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(appUrl)}&color=EA580C&bgcolor=F5F1E8`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(appUrl);
        alert('¡Link copiado al portapapeles!');
    };

    return (
        <div className="min-h-screen bg-bg font-sans text-text-main transition-colors duration-300">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-lg border-b border-white/5 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-bold group">
                        <div className="neumorphic p-2 rounded-lg text-primary group-hover:text-secondary transition-colors">
                            <Logo size={24} />
                        </div>
                        <span className="text-text-main group-hover:text-primary transition-colors">SmartFood</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link to="/">
                            <button className="neumorphic p-2 rounded-full text-text-muted hover:text-primary transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="text-center mb-12 animate-fadeIn">
                    <div className="inline-flex items-center gap-3 mb-4 text-primary">
                        <QrCode size={48} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-text-main">
                        Código QR de SmartFood
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Escanea este código con tu celular para acceder directamente a SmartFood
                    </p>
                </div>

                {/* QR Card */}
                <div className="neumorphic p-8 md:p-12 rounded-3xl border border-white/5 mb-8 animate-fadeIn">
                    <div className="flex flex-col items-center gap-6">
                        {/* Logo en el centro */}
                        <div className="relative">
                            {/* QR Code */}
                            <div className="neumorphic-inset p-6 rounded-3xl">
                                <img
                                    src={qrUrl}
                                    alt="QR Code"
                                    className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-2xl"
                                />
                            </div>

                            {/* Logo superpuesto en el centro */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="bg-bg neumorphic p-4 rounded-2xl border-4 border-bg shadow-2xl">
                                    <div className="bg-primary text-white p-3 rounded-xl">
                                        <Logo size={32} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* URL Display */}
                        <div className="w-full max-w-lg">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-bold">URL de la aplicación</p>
                            <div className="neumorphic-inset p-4 rounded-xl flex items-center justify-between gap-4">
                                <code className="text-sm md:text-base text-primary font-mono truncate flex-1">
                                    {appUrl}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="neumorphic-btn p-2 rounded-lg shrink-0 hover:scale-105 transition-transform text-white dark:text-primary"
                                    title="Copiar URL"
                                >
                                    <ExternalLink size={18} className="text-white dark:text-primary" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/">
                        <Boton className="w-full sm:w-auto justify-center">
                            Volver al Inicio
                        </Boton>
                    </Link>
                </div>
            </main>
        </div>
    );
}
