/** Configuración de Tailwind del panel del restaurante. */
const preset = require('@tuki/experiencia/tailwind-preset');

module.exports = {
  presets: [preset],
  darkMode: 'class',
  future: { hoverOnlyWhenSupported: true },
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/experiencia-tuki/src/**/*.{ts,tsx}',
    '../../packages/ui-kit/src/**/*.{ts,tsx}',
  ],
};
