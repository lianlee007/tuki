
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  titulo?: string;
  descripcion?: string;
  imagen?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  titulo = 'Tuki - Crea tu menú digital', 
  descripcion = 'Plataforma para crear el sitio web y el menú digital de tu restaurante con IA. Listo en minutos, sin saber programar.',
  imagen = 'https://tuki.app/og-image.jpg',
  url
}) => {
  const sitioUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Metaetiquetas Estándar */}
      <title>{titulo}</title>
      <meta name="description" content={descripcion} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={sitioUrl} />
      <meta property="og:title" content={titulo} />
      <meta property="og:description" content={descripcion} />
      <meta property="og:image" content={imagen} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={sitioUrl} />
      <meta property="twitter:title" content={titulo} />
      <meta property="twitter:description" content={descripcion} />
      <meta property="twitter:image" content={imagen} />
    </Helmet>
  );
};
