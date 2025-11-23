
import React, { useState } from 'react';
import { Restaurante } from '../../tipos';
import { Boton, Tarjeta, Input, Logo, LogoWhatsApp } from '../ui';
import { QrCode, Share2, Copy, Download, Printer, Check, ExternalLink } from 'lucide-react';
import { apiQR } from '../../servicios/misApis';
import { generarSlugUnico } from '../../lib/utils';

// --- LOGOS OFICIALES DE MARCA (SVG) ---

const LogoFacebook = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" fill="white"/>
  </svg>
);

// Logo Instagram oficial (Cámara simple)
const LogoInstagram = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
    <circle cx="18" cy="6" r="1" fill="white"/>
  </svg>
);

const LogoX = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.9 5.25h-2.15L12.2 10.3 8.2 5.25H4.5l6.4 8.4L4.5 18.75h2.15l4.95-5.55 4.4 5.55h3.7l-6.8-8.9L18.9 5.25zm-3 12.15h-1.2L7.8 6.65H9l8.9 10.75z" fill="white"/>
  </svg>
);

interface SeccionDifusionProps {
  restaurante: Restaurante;
}

export const SeccionDifusion: React.FC<SeccionDifusionProps> = ({ restaurante }) => {
  const [copiado, setCopiado] = useState(false);

  // Construimos la URL pública usando slug del nombre del restaurante
  const baseUrl = window.location.origin;
  const slug = generarSlugUnico(restaurante.nombre, restaurante.id);
  const publicUrl = `${baseUrl}/restaurante/${slug}`;
  
  // --- CONSUMO API PROPIA 2 (QR) ---
  const colorPrimarioQR = "FF8C42"; // Naranja marca
  const qrData = apiQR.generarCodigoQR(publicUrl, colorPrimarioQR, 400);
  const qrImage = qrData.imagen_url;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const descargarQR = async () => {
    try {
      // Crear canvas para combinar QR con logo
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener contexto del canvas');
      }

      // Tamaño del QR (400x400 según la API)
      const qrSize = 400;
      const padding = 20; // Padding alrededor del QR
      const logoSize = 80; // Tamaño del logo en el centro
      const logoPadding = 8; // Padding interno del logo
      const totalSize = qrSize + (padding * 2);

      canvas.width = totalSize;
      canvas.height = totalSize;

      // Fondo blanco
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, totalSize, totalSize);

      // Cargar imagen del QR
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        qrImg.onload = () => resolve(qrImg);
        qrImg.onerror = (err) => {
          console.error('Error cargando QR:', err);
          reject(new Error('No se pudo cargar la imagen del QR'));
        };
        qrImg.src = qrImage;
      });

      // Dibujar QR en el canvas
      ctx.drawImage(qrImg, padding, padding, qrSize, qrSize);

      // Cargar y dibujar logo
      const logoImg = new Image();
      let logoCargado = false;
      
      if (restaurante.imagen_logo_url) {
        logoImg.crossOrigin = 'anonymous';
        
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout cargando logo'));
            }, 5000);
            
            logoImg.onload = () => {
              clearTimeout(timeout);
              logoCargado = true;
              resolve(logoImg);
            };
            logoImg.onerror = (err) => {
              clearTimeout(timeout);
              console.warn('No se pudo cargar el logo, continuando sin él:', err);
              resolve(null);
            };
            logoImg.src = restaurante.imagen_logo_url;
          });

          if (logoCargado && logoImg.complete && logoImg.naturalWidth > 0) {
          // Calcular posición del logo (centro del QR)
          const logoX = padding + (qrSize / 2) - (logoSize / 2);
          const logoY = padding + (qrSize / 2) - (logoSize / 2);

          // Dibujar fondo blanco circular para el logo
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(
            padding + qrSize / 2,
            padding + qrSize / 2,
            logoSize / 2 + logoPadding,
            0,
            2 * Math.PI
          );
          ctx.fill();

          // Dibujar borde del logo
          ctx.strokeStyle = '#FF8C42';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Dibujar logo en el centro
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            padding + qrSize / 2,
            padding + qrSize / 2,
            logoSize / 2,
            0,
            2 * Math.PI
          );
          ctx.clip();
          
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          }
        } catch (logoError) {
          console.warn('Error procesando logo, continuando sin él:', logoError);
        }
      }

      // Convertir canvas a blob y descargar
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Error generando imagen');
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR-${restaurante.nombre.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error descargando QR con logo', error);
      // Fallback: descargar solo el QR
      try {
        const response = await fetch(qrImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR-${restaurante.nombre.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (fallbackError) {
        console.error('Error en fallback', fallbackError);
        window.open(qrImage, '_blank');
      }
    }
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Share2 size={20} /> Difusión y Marketing
          </h2>
          <p className="text-text-muted text-sm">Comparte tu restaurante con el mundo.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* COLUMNA IZQUIERDA: QR */}
        <section>
           <Tarjeta className="flex flex-col items-center justify-center text-center space-y-6 border border-white/5 h-full">
              <div className="space-y-2">
                 <h3 className="font-bold text-xl font-serif text-text-main">Código QR de Mesa</h3>
                 <p className="text-sm text-text-muted px-4">
                    Escanea para ver el menú. El logo en el centro no afecta su funcionamiento.
                 </p>
              </div>

              {/* Contenedor del QR con Logo Superpuesto */}
              <div className="relative group transform transition-transform hover:scale-105">
                  {/* Fondo blanco para el QR */}
                  <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-white relative z-0">
                    <img 
                        src={qrImage} 
                        alt="Código QR Restaurante" 
                        className="w-56 h-56 object-contain mix-blend-multiply" 
                    />
                  </div>

                  {/* Logo Central Absoluto */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-white p-1 shadow-lg flex items-center justify-center border-2 border-primary/20">
                    {restaurante.imagen_logo_url ? (
                        <img 
                            src={restaurante.imagen_logo_url} 
                            className="w-full h-full rounded-full object-cover" 
                            alt="Logo Centro"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Logo size={24} />
                        </div>
                    )}
                  </div>
              </div>

              <div className="flex gap-3 w-full justify-center pt-4">
                 <Boton variante="secundario" onClick={descargarQR} className="text-xs" icono={<Download size={16}/>}>
                    Descargar PNG
                 </Boton>
                 <Boton variante="secundario" onClick={() => window.print()} className="text-xs" icono={<Printer size={16}/>}>
                    Imprimir
                 </Boton>
              </div>
           </Tarjeta>
        </section>

        {/* COLUMNA DERECHA: ENLACES Y REDES */}
        <section className="space-y-6">
           <Tarjeta className="border border-white/5 space-y-6">
              <div>
                 <label className="block text-sm font-bold text-text-muted mb-3 ml-1">Enlace Público del Menú</label>
                 <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                       <Input 
                          value={publicUrl} 
                          readOnly 
                          className="pr-12 text-sm text-text-muted bg-surface" 
                       />
                       <a 
                          href={publicUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-accent transition-colors"
                          title="Abrir en nueva pestaña"
                       >
                          <ExternalLink size={16} />
                       </a>
                    </div>
                    <button 
                       onClick={copiarEnlace}
                       className="neumorphic-btn p-3 rounded-xl hover:text-primary transition-colors active:scale-95"
                       title="Copiar enlace"
                    >
                       {copiado ? <Check size={20} className="text-green-500"/> : <Copy size={20}/>}
                    </button>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                 <label className="block text-sm font-bold text-text-muted mb-4 ml-1">Compartir en Redes Sociales</label>
                 <div className="grid grid-cols-2 gap-3">
                    <a 
                       href={`https://wa.me/?text=${encodeURIComponent(`¡Hola! Mira nuestro menú en ${restaurante.nombre}: ${publicUrl}`)}`}
                       target="_blank"
                       rel="noreferrer"
                       className="col-span-2 neumorphic-btn w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity group bg-[#25D366] border-none"
                    >
                       <LogoWhatsApp fill="white" />
                       <span className="font-bold text-white">WhatsApp</span>
                    </a>
                    
                    <a 
                       href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                       target="_blank"
                       rel="noreferrer"
                       className="neumorphic-btn w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity group bg-[#1877F2] border-none"
                    >
                       <LogoFacebook />
                       <span className="font-bold text-white">Facebook</span>
                    </a>

                    <a 
                       href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Descubre el menú de ${restaurante.nombre} aquí: ${publicUrl}`)}`}
                       target="_blank"
                       rel="noreferrer"
                       className="neumorphic-btn w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity group bg-black border-white/20"
                    >
                       <LogoX />
                       <span className="font-bold text-white">X</span>
                    </a>

                    {/* Botón Instagram con color oficial #E1306C */}
                    <button
                       onClick={() => {
                           copiarEnlace();
                           window.open('https://instagram.com', '_blank');
                       }}
                       className="col-span-2 neumorphic-btn w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity group border-none bg-[#E1306C] relative overflow-hidden"
                       title="Copiar enlace y abrir Instagram"
                    >
                       <div className="relative flex items-center gap-3">
                           <LogoInstagram />
                           <span className="font-bold text-white">{copiado ? 'Enlace Copiado' : 'Instagram'}</span>
                       </div>
                    </button>
                 </div>
                 <p className="text-[10px] text-center text-text-muted mt-2 opacity-70">
                    * Para Instagram, el botón copia el enlace y abre la web.
                 </p>
              </div>
           </Tarjeta>

           <div className="neumorphic p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-full text-primary">
                 <QrCode size={24} />
              </div>
              <div>
                 <h4 className="font-bold text-primary text-sm">Tip Pro</h4>
                 <p className="text-xs text-text-muted mt-1">
                    Al usar alta corrección de errores, el QR sigue funcionando incluso con el logo en el centro.
                 </p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};
