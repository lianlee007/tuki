import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Lint del frontend. Se limita a la SPA: el gateway se valida con Ruff y el
 * despliegue con kubeconform/kube-linter/conftest, cada uno en su propio job.
 *
 * Reglas activas a propósito:
 * - `recommended` de TypeScript sin comprobación de tipos (rápido en CI; los
 *   tipos ya los cubre `tsc --noEmit`).
 * - `rules-of-hooks` como error: un hook condicional es un fallo real.
 * - `exhaustive-deps` como aviso: no bloquea la entrega.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'public/**',
      'Skills/**',
      'services/**',
      'scripts/**',
      // Load test de k6: usa globals propios (`__ENV`) y no forma parte de la SPA.
      'deploy/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // El proyecto usa `any` en bordes de datos de Supabase y en utilidades de
      // render; tipar todo eso es trabajo aparte y no aporta al gate de entrega.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Las páginas usan `@ts-ignore` para las importaciones opcionales del CDN
      // de AI Studio; convertirlas a `@ts-expect-error` rompería el build cuando
      // el módulo sí resuelve. Se deja la regla fuera del gate.
      '@typescript-eslint/ban-ts-comment': 'off',
      // Aviso, no error: las inicializaciones defensivas (`let abierto = false`)
      // son legibles y no afectan la entrega.
      'no-useless-assignment': 'warn',
    },
  },
);
